import os
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from .database import engine, Base, get_db
from . import models, schemas, crud
from .forecasting import calculate_medicine_forecast, generate_alerts_from_inventory
from .seed_data import seed_database

# Initialize tables
Base.metadata.create_all(bind=engine)

# Seed database with initial demonstration dataset
with next(get_db()) as db_session:
    seed_database(db_session)

app = FastAPI(
    title="SehatFlow AI API",
    description="Proactive AI-Driven Health Center and Medicine Supply Chain Management Platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS Middleware
origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- HEALTH & SYSTEM -----------------
@app.get("/api/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "SehatFlow AI Backend",
        "environment": "DEMO ENVIRONMENT — SYNTHETIC DATA",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0"
    }

@app.post("/api/system/reset-demo", tags=["System"])
def reset_demo_database(db: Session = Depends(get_db)):
    """Reset demonstration dataset back to canonical pristine state."""
    seed_database(db, force=True)
    return {"message": "Demo database successfully reset to canonical state."}


# ----------------- FACILITIES -----------------
@app.get("/api/facilities", response_model=List[schemas.FacilityOut], tags=["Facilities"])
def list_facilities(db: Session = Depends(get_db)):
    return crud.get_facilities(db)

@app.get("/api/facilities/{facility_id}", response_model=schemas.FacilityOut, tags=["Facilities"])
def get_facility(facility_id: str, db: Session = Depends(get_db)):
    fac = crud.get_facility(db, facility_id)
    if not fac:
        raise HTTPException(status_code=404, detail="Facility not found")
    return fac


# ----------------- DASHBOARD -----------------
@app.get("/api/dashboard", response_model=schemas.DashboardSummary, tags=["Dashboard"])
def get_dashboard(facility_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    return crud.get_dashboard_summary(db, facility_id)


# ----------------- MEDICINES -----------------
@app.get("/api/medicines", response_model=List[schemas.MedicineOut], tags=["Medicines"])
def list_medicines(
    facility_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    return crud.get_medicines(db, facility_id, category, status, search, skip, limit)

@app.post("/api/medicines", response_model=schemas.MedicineOut, status_code=status.HTTP_201_CREATED, tags=["Medicines"])
def create_medicine(med_in: schemas.MedicineCreate, db: Session = Depends(get_db)):
    med = crud.create_medicine(db, med_in)
    return crud.get_medicines(db, facility_id=med.facility_id, search=med.name)[0]

@app.get("/api/medicines/{medicine_id}", response_model=schemas.MedicineOut, tags=["Medicines"])
def get_medicine(medicine_id: str, db: Session = Depends(get_db)):
    med = crud.get_medicine_by_id(db, medicine_id)
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    meds = crud.get_medicines(db, search=med.name)
    matched = [m for m in meds if m.id == medicine_id]
    return matched[0] if matched else med

@app.patch("/api/medicines/{medicine_id}", response_model=schemas.MedicineOut, tags=["Medicines"])
def update_medicine(medicine_id: str, updates: schemas.MedicineUpdate, db: Session = Depends(get_db)):
    med = crud.update_medicine(db, medicine_id, updates)
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    meds = crud.get_medicines(db, search=med.name)
    matched = [m for m in meds if m.id == medicine_id]
    return matched[0] if matched else med

@app.post("/api/medicines/{medicine_id}/receive", response_model=schemas.MedicineOut, tags=["Medicines"])
def receive_stock(medicine_id: str, req: schemas.StockReceiptRequest, db: Session = Depends(get_db)):
    try:
        med = crud.receive_medicine_stock(db, medicine_id, req)
        meds = crud.get_medicines(db, search=med.name)
        matched = [m for m in meds if m.id == medicine_id]
        return matched[0] if matched else med
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/medicines/{medicine_id}/adjust", response_model=schemas.MedicineOut, tags=["Medicines"])
def adjust_stock(medicine_id: str, req: schemas.StockAdjustmentRequest, db: Session = Depends(get_db)):
    try:
        med = crud.adjust_medicine_stock(db, medicine_id, req)
        meds = crud.get_medicines(db, search=med.name)
        matched = [m for m in meds if m.id == medicine_id]
        return matched[0] if matched else med
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/medicines/{medicine_id}/movements", response_model=List[schemas.StockMovementOut], tags=["Medicines"])
def get_movements(medicine_id: str, db: Session = Depends(get_db)):
    return crud.get_stock_movements(db, medicine_id)


# ----------------- AI DEMAND FORECASTING -----------------
def compute_forecast_data(
    db: Session,
    facility_id: Optional[str] = None,
    safety_days: float = 3.0,
    lead_time_override: Optional[int] = None
) -> schemas.ForecastRecalculateResponse:
    query = db.query(models.Medicine)
    if facility_id:
        query = query.filter(models.Medicine.facility_id == facility_id)
    meds = query.all()

    items: List[schemas.ForecastItem] = []
    crit_count = high_count = med_count = low_count = 0

    for m in meds:
        history = db.query(models.ConsumptionHistory).filter(
            models.ConsumptionHistory.medicine_id == m.id
        ).order_by(models.ConsumptionHistory.record_date).all()

        inbound = db.query(models.StockTransfer).filter(
            models.StockTransfer.destination_facility_id == m.facility_id,
            models.StockTransfer.medicine_id == m.id,
            models.StockTransfer.status == "Pending"
        ).all()
        inbound_qty = sum(t.quantity for t in inbound)

        item = calculate_medicine_forecast(
            medicine=m,
            history_records=history,
            pending_incoming_transfer_qty=inbound_qty,
            lead_time_override=lead_time_override,
            safety_stock_days=float(safety_days)
        )
        items.append(item)

        if item.risk_level == "CRITICAL":
            crit_count += 1
        elif item.risk_level == "HIGH":
            high_count += 1
        elif item.risk_level == "MEDIUM":
            med_count += 1
        else:
            low_count += 1

    risk_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    items.sort(key=lambda x: (risk_order.get(x.risk_level, 4), -x.suggested_reorder_qty))

    return schemas.ForecastRecalculateResponse(
        recalculated_at=datetime.now(timezone.utc),
        total_forecasted=len(items),
        critical_risk_count=crit_count,
        high_risk_count=high_count,
        medium_risk_count=med_count,
        low_risk_count=low_count,
        items=items,
        model_methodology="Weighted Moving Average (WMA) on 3-week consumption buckets with lead-time calibrated safety buffer"
    )

@app.get("/api/forecast", response_model=schemas.ForecastRecalculateResponse, tags=["Forecasting"])
def get_forecast(
    facility_id: Optional[str] = Query(None),
    safety_days: float = Query(3.0, ge=1.0, le=30.0),
    lead_time_override: Optional[int] = Query(None, ge=1),
    db: Session = Depends(get_db)
):
    return compute_forecast_data(db, facility_id, safety_days, lead_time_override)

@app.post("/api/forecast/recalculate", response_model=schemas.ForecastRecalculateResponse, tags=["Forecasting"])
def recalculate_forecast(facility_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    generate_alerts_from_inventory(db, facility_id)
    crud.log_activity(db, "SYSTEM", "Recalculated AI demand forecast across all inventory records.", facility_id)
    return compute_forecast_data(db, facility_id=facility_id)


# ----------------- PATIENT QUEUE -----------------
@app.get("/api/patients/queue", response_model=List[schemas.PatientQueueOut], tags=["Patient Queue"])
def list_patient_queue(
    facility_id: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return crud.get_patient_queue(db, facility_id, department, status)

@app.post("/api/patients/queue", response_model=schemas.PatientQueueOut, status_code=status.HTTP_201_CREATED, tags=["Patient Queue"])
def register_queue_patient(req: schemas.PatientQueueCreate, db: Session = Depends(get_db)):
    return crud.register_patient(db, req)

@app.patch("/api/patients/queue/{queue_id}", response_model=schemas.PatientQueueOut, tags=["Patient Queue"])
def update_patient_status(queue_id: str, updates: schemas.PatientQueueStatusUpdate, db: Session = Depends(get_db)):
    pq = crud.update_patient_status(db, queue_id, updates)
    if not pq:
        raise HTTPException(status_code=404, detail="Patient queue token not found")
    return pq


# ----------------- BEDS -----------------
@app.get("/api/beds", response_model=List[schemas.BedOut], tags=["Beds"])
def list_beds(
    facility_id: Optional[str] = Query(None),
    ward: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return crud.get_beds(db, facility_id, ward)

@app.patch("/api/beds/{bed_id}", response_model=schemas.BedOut, tags=["Beds"])
def update_bed(bed_id: str, updates: schemas.BedUpdate, db: Session = Depends(get_db)):
    try:
        bed = crud.update_bed_status(db, bed_id, updates)
        if not bed:
            raise HTTPException(status_code=404, detail="Bed not found")
        return bed
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ----------------- DOCTORS -----------------
@app.get("/api/doctors", response_model=List[schemas.DoctorOut], tags=["Doctors"])
def list_doctors(
    facility_id: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return crud.get_doctors(db, facility_id, department)

@app.patch("/api/doctors/{doctor_id}/attendance", response_model=schemas.DoctorOut, tags=["Doctors"])
def update_doctor_attendance(doctor_id: str, req: schemas.DoctorAttendanceUpdate, db: Session = Depends(get_db)):
    doc = crud.update_doctor_attendance(db, doctor_id, req)
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doc

@app.post("/api/doctors", response_model=schemas.DoctorOut, status_code=status.HTTP_201_CREATED, tags=["Doctors"])
def add_doctor(doc_in: schemas.DoctorCreate, db: Session = Depends(get_db)):
    doc_id = doc_in.id or f"DOC-{int(datetime.now(timezone.utc).timestamp()) % 10000:04d}"
    doc = models.Doctor(
        id=doc_id,
        facility_id=doc_in.facility_id,
        name=doc_in.name,
        department=doc_in.department,
        shift=doc_in.shift,
        is_present=doc_in.is_present,
        notes=doc_in.notes,
        last_updated=datetime.now(timezone.utc)
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    crud.log_activity(db, "DOCTOR_ATTENDANCE", f"Added doctor {doc.name} to roster ({doc.department})", doc.facility_id)
    return doc


# ----------------- STOCK TRANSFERS -----------------
@app.get("/api/transfers", response_model=List[schemas.StockTransferOut], tags=["Supply Chain"])
def list_transfers(facility_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    return crud.get_stock_transfers(db, facility_id)

@app.post("/api/transfers", response_model=schemas.StockTransferOut, status_code=status.HTTP_201_CREATED, tags=["Supply Chain"])
def request_transfer(req: schemas.StockTransferCreate, db: Session = Depends(get_db)):
    try:
        trf = crud.create_stock_transfer(db, req)
        return crud.get_stock_transfers(db, trf.source_facility_id)[0]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/transfers/{transfer_id}/approve", response_model=schemas.StockTransferOut, tags=["Supply Chain"])
def approve_transfer(transfer_id: str, db: Session = Depends(get_db)):
    try:
        crud.approve_stock_transfer(db, transfer_id)
        trfs = crud.get_stock_transfers(db)
        matched = [t for t in trfs if t.id == transfer_id]
        return matched[0]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/transfers/{transfer_id}/reject", response_model=schemas.StockTransferOut, tags=["Supply Chain"])
def reject_transfer(transfer_id: str, db: Session = Depends(get_db)):
    trf = db.query(models.StockTransfer).filter(models.StockTransfer.id == transfer_id).first()
    if not trf:
        raise HTTPException(status_code=404, detail="Transfer request not found")
    if trf.status != "Pending":
        raise HTTPException(status_code=400, detail=f"Transfer is already in state '{trf.status}'")
    
    trf.status = "Rejected"
    trf.resolved_at = datetime.now(timezone.utc)
    db.commit()
    
    crud.log_activity(db, "TRANSFER", f"Transfer {transfer_id} rejected.", trf.source_facility_id)
    trfs = crud.get_stock_transfers(db)
    matched = [t for t in trfs if t.id == transfer_id]
    return matched[0]


# ----------------- ALERTS -----------------
@app.get("/api/alerts", response_model=List[schemas.AlertOut], tags=["Alerts"])
def list_alerts(
    facility_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query("Active"),
    db: Session = Depends(get_db)
):
    return crud.get_alerts(db, facility_id, category, severity, status)

@app.patch("/api/alerts/{alert_id}", response_model=schemas.AlertOut, tags=["Alerts"])
def update_alert(alert_id: str, updates: schemas.AlertUpdate, db: Session = Depends(get_db)):
    alt = crud.update_alert_status(db, alert_id, updates.status)
    if not alt:
        raise HTTPException(status_code=404, detail="Alert not found")
    alerts = crud.get_alerts(db, status="All")
    matched = [a for a in alerts if a.id == alert_id]
    return matched[0] if matched else alt


# ----------------- ACTIVITY LOGS -----------------
@app.get("/api/activities", response_model=List[schemas.ActivityLogOut], tags=["Activity"])
def list_activities(
    facility_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(models.ActivityLog)
    if facility_id:
        query = query.filter(models.ActivityLog.facility_id == facility_id)
    logs = query.order_by(models.ActivityLog.timestamp.desc()).limit(limit).all()
    return [schemas.ActivityLogOut.model_validate(l) for l in logs]


# ----------------- STATIC FRONTEND SERVING -----------------
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
