from datetime import datetime, date, timedelta, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, desc
from . import models, schemas
from .forecasting import calculate_medicine_forecast, generate_alerts_from_inventory

def utcnow():
    return datetime.now(timezone.utc)

# ----------------- ACTIVITY LOGS -----------------
def log_activity(db: Session, action_type: str, description: str, facility_id: Optional[str] = None, user_role: str = "Healthcare Staff"):
    entry = models.ActivityLog(
        facility_id=facility_id,
        action_type=action_type,
        description=description,
        user_role=user_role,
        timestamp=utcnow()
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


# ----------------- FACILITIES -----------------
def get_facilities(db: Session) -> List[models.Facility]:
    return db.query(models.Facility).all()

def get_facility(db: Session, facility_id: str) -> Optional[models.Facility]:
    return db.query(models.Facility).filter(models.Facility.id == facility_id).first()


# ----------------- MEDICINES -----------------
def get_medicine_status(med: models.Medicine) -> str:
    today = date.today()
    if (med.expiry_date - today).days < 0:
        return "Expired"
    if med.current_stock == 0:
        return "Critical"
    if med.current_stock <= med.min_threshold:
        return "Low Stock"
    if med.current_stock <= (med.min_threshold * 1.25):
        return "Watch"
    return "Healthy"

def format_medicine_out(med: models.Medicine) -> schemas.MedicineOut:
    today = date.today()
    st = get_medicine_status(med)
    days_exp = (med.expiry_date - today).days
    is_near_exp = 0 <= days_exp <= 60
    days_out = round(med.current_stock / max(0.1, med.avg_daily_consumption), 1) if med.avg_daily_consumption > 0 else 999.0

    return schemas.MedicineOut(
        id=med.id,
        facility_id=med.facility_id,
        name=med.name,
        generic_name=med.generic_name,
        category=med.category,
        batch_number=med.batch_number,
        current_stock=med.current_stock,
        unit=med.unit,
        min_threshold=med.min_threshold,
        avg_daily_consumption=med.avg_daily_consumption,
        lead_time_days=med.lead_time_days,
        supplier=med.supplier,
        expiry_date=med.expiry_date,
        last_updated=med.last_updated,
        status=st,
        days_until_stockout=days_out,
        is_near_expiry=is_near_exp
    )

def get_medicines(
    db: Session,
    facility_id: Optional[str] = None,
    category: Optional[str] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[schemas.MedicineOut]:
    query = db.query(models.Medicine)
    if facility_id:
        query = query.filter(models.Medicine.facility_id == facility_id)
    if category and category != "All":
        query = query.filter(models.Medicine.category == category)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                models.Medicine.name.ilike(search_pattern),
                models.Medicine.generic_name.ilike(search_pattern),
                models.Medicine.id.ilike(search_pattern),
                models.Medicine.batch_number.ilike(search_pattern)
            )
        )

    medicines = query.offset(skip).limit(limit).all()
    today = date.today()
    result = []
    for med in medicines:
        st = get_medicine_status(med)
        days_exp = (med.expiry_date - today).days
        is_near_exp = 0 <= days_exp <= 60

        if status_filter and status_filter != "All":
            if status_filter == "Near Expiry" and not is_near_exp:
                continue
            elif status_filter != "Near Expiry" and st != status_filter:
                continue

        result.append(format_medicine_out(med))
    return result

def get_medicine_by_id(db: Session, medicine_id: str) -> Optional[models.Medicine]:
    return db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()

def create_medicine(db: Session, med_in: schemas.MedicineCreate) -> models.Medicine:
    med_id = med_in.id or f"MED-{int(utcnow().timestamp()) % 100000:05d}"
    med = models.Medicine(
        id=med_id,
        facility_id=med_in.facility_id,
        name=med_in.name,
        generic_name=med_in.generic_name,
        category=med_in.category,
        batch_number=med_in.batch_number,
        current_stock=med_in.current_stock,
        unit=med_in.unit,
        min_threshold=med_in.min_threshold,
        avg_daily_consumption=med_in.avg_daily_consumption,
        lead_time_days=med_in.lead_time_days,
        supplier=med_in.supplier,
        expiry_date=med_in.expiry_date,
        last_updated=utcnow()
    )
    db.add(med)
    db.flush()

    movement = models.StockMovement(
        medicine_id=med.id,
        facility_id=med.facility_id,
        movement_type="RECEIPT",
        quantity=med.current_stock,
        previous_stock=0,
        new_stock=med.current_stock,
        reason="Initial stock ledger entry upon registration",
        reference_id=f"INIT-{med.id}",
        timestamp=utcnow()
    )
    db.add(movement)
    db.commit()
    db.refresh(med)

    log_activity(db, "STOCK_RECEIPT", f"Added medicine '{med.name}' with initial stock of {med.current_stock} {med.unit}", med.facility_id)
    generate_alerts_from_inventory(db, med.facility_id)
    return med

def update_medicine(db: Session, medicine_id: str, updates: schemas.MedicineUpdate) -> Optional[models.Medicine]:
    med = get_medicine_by_id(db, medicine_id)
    if not med:
        return None
    
    update_data = updates.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(med, field, val)
    
    med.last_updated = utcnow()
    db.commit()
    db.refresh(med)
    log_activity(db, "SYSTEM", f"Updated details for medicine '{med.name}' ({med.id})", med.facility_id)
    generate_alerts_from_inventory(db, med.facility_id)
    return med

def receive_medicine_stock(db: Session, medicine_id: str, req: schemas.StockReceiptRequest) -> models.Medicine:
    med = get_medicine_by_id(db, medicine_id)
    if not med:
        raise ValueError(f"Medicine {medicine_id} not found")
    
    prev_stock = med.current_stock
    new_stock = prev_stock + req.quantity
    med.current_stock = new_stock
    med.last_updated = utcnow()
    if req.batch_number:
        med.batch_number = req.batch_number
    if req.supplier:
        med.supplier = req.supplier

    movement = models.StockMovement(
        medicine_id=med.id,
        facility_id=med.facility_id,
        movement_type="RECEIPT",
        quantity=req.quantity,
        previous_stock=prev_stock,
        new_stock=new_stock,
        reason=req.reason,
        reference_id=f"RCV-{int(utcnow().timestamp())}",
        timestamp=utcnow()
    )
    db.add(movement)
    db.commit()
    db.refresh(med)

    log_activity(db, "STOCK_RECEIPT", f"Received {req.quantity} {med.unit} for '{med.name}'. New stock: {new_stock}", med.facility_id)
    generate_alerts_from_inventory(db, med.facility_id)
    return med

def adjust_medicine_stock(db: Session, medicine_id: str, req: schemas.StockAdjustmentRequest) -> models.Medicine:
    med = get_medicine_by_id(db, medicine_id)
    if not med:
        raise ValueError(f"Medicine {medicine_id} not found")
    
    prev_stock = med.current_stock
    new_stock = req.new_quantity
    diff = new_stock - prev_stock
    med.current_stock = new_stock
    med.last_updated = utcnow()

    movement = models.StockMovement(
        medicine_id=med.id,
        facility_id=med.facility_id,
        movement_type="ADJUSTMENT",
        quantity=diff,
        previous_stock=prev_stock,
        new_stock=new_stock,
        reason=req.reason,
        reference_id=f"ADJ-{int(utcnow().timestamp())}",
        timestamp=utcnow()
    )
    db.add(movement)
    db.commit()
    db.refresh(med)

    log_activity(db, "STOCK_ADJUSTMENT", f"Stock adjusted for '{med.name}' from {prev_stock} to {new_stock} ({diff:+d}). Reason: {req.reason}", med.facility_id)
    generate_alerts_from_inventory(db, med.facility_id)
    return med

def get_stock_movements(db: Session, medicine_id: str) -> List[models.StockMovement]:
    return db.query(models.StockMovement).filter(
        models.StockMovement.medicine_id == medicine_id
    ).order_by(desc(models.StockMovement.timestamp)).all()


# ----------------- PATIENT QUEUE -----------------
def get_patient_queue(
    db: Session,
    facility_id: Optional[str] = None,
    department: Optional[str] = None,
    status_filter: Optional[str] = None
) -> List[models.PatientQueue]:
    query = db.query(models.PatientQueue)
    if facility_id:
        query = query.filter(models.PatientQueue.facility_id == facility_id)
    if department and department != "All":
        query = query.filter(models.PatientQueue.department == department)
    if status_filter and status_filter != "All":
        query = query.filter(models.PatientQueue.queue_status == status_filter)
    
    return query.order_by(models.PatientQueue.arrival_time.desc()).all()

def register_patient(db: Session, req: schemas.PatientQueueCreate) -> models.PatientQueue:
    token = req.token or f"T-{int(utcnow().timestamp()) % 10000:04d}"
    pq_id = f"PQ-{token}"

    waiting_count = db.query(models.PatientQueue).filter(
        models.PatientQueue.facility_id == req.facility_id,
        models.PatientQueue.department == req.department,
        models.PatientQueue.queue_status == "Waiting"
    ).count()

    estimated_wait = max(5, (waiting_count + 1) * 12)

    pq = models.PatientQueue(
        id=pq_id,
        token=token,
        facility_id=req.facility_id,
        department=req.department,
        arrival_time=utcnow(),
        queue_status="Waiting",
        priority=req.priority,
        assigned_service_area=req.assigned_service_area,
        estimated_wait_minutes=estimated_wait
    )
    db.add(pq)
    db.commit()
    db.refresh(pq)

    log_activity(db, "PATIENT_QUEUE", f"Registered demonstration patient token {token} in {req.department} (Priority: {req.priority})", req.facility_id)
    
    if waiting_count >= 8:
        alert_id = f"ALT-WAIT-{req.facility_id}-{req.department}"
        db.merge(models.Alert(
            id=alert_id,
            facility_id=req.facility_id,
            category="HIGH_WAIT_TIME",
            severity="WARNING",
            title=f"Queue Surge in {req.department}",
            description=f"{waiting_count + 1} demonstration patients waiting in {req.department}. Average wait time estimated at ~{estimated_wait} mins.",
            entity_type="patient",
            entity_id=pq.id,
            recommended_action="Deploy additional on-duty clinician or redirect routine cases.",
            status="Active"
        ))
        db.commit()

    return pq

def update_patient_status(db: Session, queue_id: str, updates: schemas.PatientQueueStatusUpdate) -> Optional[models.PatientQueue]:
    pq = db.query(models.PatientQueue).filter(models.PatientQueue.id == queue_id).first()
    if not pq:
        return None
    
    pq.queue_status = updates.queue_status
    if updates.assigned_service_area:
        pq.assigned_service_area = updates.assigned_service_area
    if updates.queue_status == "Completed":
        pq.completed_time = utcnow()

    db.commit()
    db.refresh(pq)
    log_activity(db, "PATIENT_QUEUE", f"Patient token {pq.token} status updated to '{pq.queue_status}'", pq.facility_id)
    return pq


# ----------------- BEDS -----------------
def get_beds(db: Session, facility_id: Optional[str] = None, ward: Optional[str] = None) -> List[models.Bed]:
    query = db.query(models.Bed)
    if facility_id:
        query = query.filter(models.Bed.facility_id == facility_id)
    if ward and ward != "All":
        query = query.filter(models.Bed.ward == ward)
    return query.order_by(models.Bed.id).all()

def update_bed_status(db: Session, bed_id: str, status_update: schemas.BedUpdate) -> Optional[models.Bed]:
    bed = db.query(models.Bed).filter(models.Bed.id == bed_id).first()
    if not bed:
        return None
    
    allowed_statuses = ["Available", "Occupied", "Cleaning", "Out of service"]
    if status_update.status not in allowed_statuses:
        raise ValueError(f"Invalid status '{status_update.status}'. Allowed: {allowed_statuses}")
    
    old_status = bed.status
    bed.status = status_update.status
    bed.last_updated = utcnow()
    db.commit()
    db.refresh(bed)

    log_activity(db, "BED_STATUS", f"Bed {bed.bed_number} ({bed.ward}) transitioned from '{old_status}' to '{bed.status}'", bed.facility_id)

    total_beds = db.query(models.Bed).filter(models.Bed.facility_id == bed.facility_id).count()
    avail_beds = db.query(models.Bed).filter(models.Bed.facility_id == bed.facility_id, models.Bed.status == "Available").count()
    if total_beds > 0 and (avail_beds / total_beds) < 0.20:
        alert_id = f"ALT-BED-{bed.facility_id}"
        db.merge(models.Alert(
            id=alert_id,
            facility_id=bed.facility_id,
            category="LOW_BED_CAPACITY",
            severity="CRITICAL",
            title="Critical Bed Shortage",
            description=f"Only {avail_beds} of {total_beds} beds available ({round(avail_beds/total_beds*100)}% capacity).",
            entity_type="bed",
            entity_id=bed.id,
            recommended_action="Expedite cleaning turnaround and coordinate with district hospital for referrals.",
            status="Active"
        ))
        db.commit()

    return bed


# ----------------- DOCTORS -----------------
def get_doctors(db: Session, facility_id: Optional[str] = None, department: Optional[str] = None) -> List[models.Doctor]:
    query = db.query(models.Doctor)
    if facility_id:
        query = query.filter(models.Doctor.facility_id == facility_id)
    if department and department != "All":
        query = query.filter(models.Doctor.department == department)
    return query.order_by(models.Doctor.id).all()

def update_doctor_attendance(db: Session, doctor_id: str, req: schemas.DoctorAttendanceUpdate) -> Optional[models.Doctor]:
    doc = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if not doc:
        return None
    
    doc.is_present = req.is_present
    if req.notes:
        doc.notes = req.notes
    doc.last_updated = utcnow()
    db.commit()
    db.refresh(doc)

    status_str = "Present (On Duty)" if doc.is_present else "Absent / Off Duty"
    log_activity(db, "DOCTOR_ATTENDANCE", f"{doc.name} ({doc.department}) marked as {status_str}", doc.facility_id)

    total_docs = db.query(models.Doctor).filter(models.Doctor.facility_id == doc.facility_id).count()
    present_docs = db.query(models.Doctor).filter(models.Doctor.facility_id == doc.facility_id, models.Doctor.is_present == True).count()
    if total_docs > 0 and (present_docs / total_docs) < 0.50:
        alert_id = f"ALT-STAFF-{doc.facility_id}"
        db.merge(models.Alert(
            id=alert_id,
            facility_id=doc.facility_id,
            category="STAFF_SHORTAGE",
            severity="CRITICAL",
            title="Severe Staffing Deficit",
            description=f"Only {present_docs} of {total_docs} rostered doctors are present today ({round(present_docs/total_docs*100)}% coverage).",
            entity_type="doctor",
            entity_id=doc.id,
            recommended_action="Activate on-call medical officers or request locum doctor support.",
            status="Active"
        ))
        db.commit()

    return doc


# ----------------- STOCK TRANSFERS -----------------
def get_stock_transfers(db: Session, facility_id: Optional[str] = None) -> List[schemas.StockTransferOut]:
    query = db.query(models.StockTransfer)
    if facility_id:
        query = query.filter(
            or_(
                models.StockTransfer.source_facility_id == facility_id,
                models.StockTransfer.destination_facility_id == facility_id
            )
        )
    transfers = query.order_by(desc(models.StockTransfer.created_at)).all()
    
    fac_map = {f.id: f.name for f in db.query(models.Facility).all()}
    result = []
    for t in transfers:
        result.append(schemas.StockTransferOut(
            id=t.id,
            medicine_id=t.medicine_id,
            medicine_name=t.medicine_name,
            source_facility_id=t.source_facility_id,
            source_facility_name=fac_map.get(t.source_facility_id, t.source_facility_id),
            destination_facility_id=t.destination_facility_id,
            destination_facility_name=fac_map.get(t.destination_facility_id, t.destination_facility_id),
            quantity=t.quantity,
            status=t.status,
            notes=t.notes,
            requested_by=t.requested_by,
            approved_by=t.approved_by,
            created_at=t.created_at,
            resolved_at=t.resolved_at
        ))
    return result

def create_stock_transfer(db: Session, req: schemas.StockTransferCreate) -> models.StockTransfer:
    if req.source_facility_id == req.destination_facility_id:
        raise ValueError("Source and destination facilities must be different")
    
    source_med = db.query(models.Medicine).filter(
        models.Medicine.id == req.medicine_id,
        models.Medicine.facility_id == req.source_facility_id
    ).first()

    if not source_med:
        raise ValueError(f"Medicine {req.medicine_id} not found at source facility {req.source_facility_id}")
    
    if source_med.current_stock < req.quantity:
        raise ValueError(f"Insufficient stock: requested {req.quantity} {source_med.unit}, but only {source_med.current_stock} available at source facility")

    transfer_id = f"TRF-{int(utcnow().timestamp()) % 100000:05d}"
    transfer = models.StockTransfer(
        id=transfer_id,
        medicine_id=req.medicine_id,
        medicine_name=source_med.name,
        source_facility_id=req.source_facility_id,
        destination_facility_id=req.destination_facility_id,
        quantity=req.quantity,
        status="Pending",
        notes=req.notes or "Inter-facility replenishment request",
        requested_by=req.requested_by,
        created_at=utcnow()
    )
    db.add(transfer)
    db.commit()
    db.refresh(transfer)

    db.add(models.Alert(
        id=f"ALT-TRF-{transfer.id}",
        facility_id=req.destination_facility_id,
        category="PENDING_TRANSFER",
        severity="INFO",
        title=f"Inbound Transfer Pending: {source_med.name}",
        description=f"Transfer request {transfer.id} for {req.quantity} {source_med.unit} from {req.source_facility_id} awaiting authorization.",
        entity_type="transfer",
        entity_id=transfer.id,
        recommended_action="Review and approve transfer authorization.",
        status="Active"
    ))
    db.commit()

    log_activity(db, "TRANSFER", f"Created transfer request {transfer.id} for {req.quantity} {source_med.unit} of '{source_med.name}' from {req.source_facility_id} to {req.destination_facility_id}", req.source_facility_id)
    return transfer

def approve_stock_transfer(db: Session, transfer_id: str, approved_by: str = "District Supply Coordinator") -> models.StockTransfer:
    transfer = db.query(models.StockTransfer).filter(models.StockTransfer.id == transfer_id).first()
    if not transfer:
        raise ValueError(f"Transfer {transfer_id} not found")
    
    if transfer.status != "Pending":
        raise ValueError(f"Transfer {transfer_id} is already in state '{transfer.status}'. Cannot approve again.")

    source_med = db.query(models.Medicine).filter(
        models.Medicine.id == transfer.medicine_id,
        models.Medicine.facility_id == transfer.source_facility_id
    ).with_for_update().first()

    if not source_med or source_med.current_stock < transfer.quantity:
        raise ValueError(f"Stock deficit: Source only has {source_med.current_stock if source_med else 0} units left.")

    dest_med = db.query(models.Medicine).filter(
        models.Medicine.name == source_med.name,
        models.Medicine.facility_id == transfer.destination_facility_id
    ).with_for_update().first()

    if not dest_med:
        dest_med_id = f"MED-DEST-{transfer.medicine_id[-4:]}-{transfer.destination_facility_id[-2:]}"
        dest_med = models.Medicine(
            id=dest_med_id,
            facility_id=transfer.destination_facility_id,
            name=source_med.name,
            generic_name=source_med.generic_name,
            category=source_med.category,
            batch_number=source_med.batch_number,
            current_stock=0,
            unit=source_med.unit,
            min_threshold=source_med.min_threshold,
            avg_daily_consumption=max(1.0, source_med.avg_daily_consumption * 0.7),
            lead_time_days=source_med.lead_time_days,
            supplier=source_med.supplier,
            expiry_date=source_med.expiry_date,
            last_updated=utcnow()
        )
        db.add(dest_med)
        db.flush()

    prev_src = source_med.current_stock
    source_med.current_stock -= transfer.quantity
    source_med.last_updated = utcnow()

    prev_dest = dest_med.current_stock
    dest_med.current_stock += transfer.quantity
    dest_med.last_updated = utcnow()

    db.add(models.StockMovement(
        medicine_id=source_med.id,
        facility_id=transfer.source_facility_id,
        movement_type="TRANSFER_OUT",
        quantity=-transfer.quantity,
        previous_stock=prev_src,
        new_stock=source_med.current_stock,
        reason=f"Transfer to {transfer.destination_facility_id} ({transfer.id})",
        reference_id=transfer.id,
        timestamp=utcnow()
    ))

    db.add(models.StockMovement(
        medicine_id=dest_med.id,
        facility_id=transfer.destination_facility_id,
        movement_type="TRANSFER_IN",
        quantity=transfer.quantity,
        previous_stock=prev_dest,
        new_stock=dest_med.current_stock,
        reason=f"Transfer received from {transfer.source_facility_id} ({transfer.id})",
        reference_id=transfer.id,
        timestamp=utcnow()
    ))

    transfer.status = "Approved"
    transfer.approved_by = approved_by
    transfer.resolved_at = utcnow()

    trf_alert = db.query(models.Alert).filter(models.Alert.id == f"ALT-TRF-{transfer.id}").first()
    if trf_alert:
        trf_alert.status = "Resolved"

    db.commit()
    db.refresh(transfer)

    log_activity(db, "TRANSFER", f"Approved & executed transfer {transfer.id}: {transfer.quantity} {source_med.unit} transferred from {transfer.source_facility_id} to {transfer.destination_facility_id}", transfer.source_facility_id, user_role="District Coordinator")
    
    generate_alerts_from_inventory(db, transfer.source_facility_id)
    generate_alerts_from_inventory(db, transfer.destination_facility_id)
    return transfer


# ----------------- ALERTS -----------------
def get_alerts(
    db: Session,
    facility_id: Optional[str] = None,
    category: Optional[str] = None,
    severity: Optional[str] = None,
    status_filter: Optional[str] = "Active"
) -> List[schemas.AlertOut]:
    query = db.query(models.Alert)
    if facility_id:
        query = query.filter(models.Alert.facility_id == facility_id)
    if category and category != "All":
        query = query.filter(models.Alert.category == category)
    if severity and severity != "All":
        query = query.filter(models.Alert.severity == severity)
    if status_filter and status_filter != "All":
        query = query.filter(models.Alert.status == status_filter)

    alerts = query.order_by(
        desc(models.Alert.severity == "CRITICAL"),
        desc(models.Alert.severity == "WARNING"),
        desc(models.Alert.created_at)
    ).all()

    fac_map = {f.id: f.name for f in db.query(models.Facility).all()}
    result = []
    for a in alerts:
        result.append(schemas.AlertOut(
            id=a.id,
            facility_id=a.facility_id,
            facility_name=fac_map.get(a.facility_id, a.facility_id),
            category=a.category,
            severity=a.severity,
            title=a.title,
            description=a.description,
            entity_type=a.entity_type,
            entity_id=a.entity_id,
            recommended_action=a.recommended_action,
            status=a.status,
            created_at=a.created_at,
            resolved_at=a.resolved_at
        ))
    return result

def update_alert_status(db: Session, alert_id: str, new_status: str) -> Optional[models.Alert]:
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        return None
    alert.status = new_status
    if new_status == "Resolved":
        alert.resolved_at = utcnow()
    db.commit()
    db.refresh(alert)
    return alert


# ----------------- DASHBOARD SUMMARY -----------------
def get_dashboard_summary(db: Session, facility_id: Optional[str] = None) -> schemas.DashboardSummary:
    fac_name = "District Healthcare Network (All Facilities)"
    if facility_id:
        f = db.query(models.Facility).filter(models.Facility.id == facility_id).first()
        if f:
            fac_name = f"{f.name} ({f.facility_type})"

    med_q = db.query(models.Medicine)
    if facility_id:
        med_q = med_q.filter(models.Medicine.facility_id == facility_id)
    meds = med_q.all()
    total_meds = len(meds)
    needing_attention = sum(1 for m in meds if m.current_stock <= m.min_threshold or (m.expiry_date - date.today()).days <= 60)
    stockout_risks = sum(1 for m in meds if m.current_stock <= (m.min_threshold * 0.5) or m.current_stock == 0)

    pq_q = db.query(models.PatientQueue)
    if facility_id:
        pq_q = pq_q.filter(models.PatientQueue.facility_id == facility_id)
    total_patients_today = pq_q.count()
    waiting_patients = pq_q.filter(models.PatientQueue.queue_status == "Waiting").count()
    avg_wait_val = db.query(func.avg(models.PatientQueue.estimated_wait_minutes))
    if facility_id:
        avg_wait_val = avg_wait_val.filter(models.PatientQueue.facility_id == facility_id)
    avg_wait = round(avg_wait_val.scalar() or 15)

    bed_q = db.query(models.Bed)
    if facility_id:
        bed_q = bed_q.filter(models.Bed.facility_id == facility_id)
    total_beds = bed_q.count()
    occupied_beds = bed_q.filter(models.Bed.status == "Occupied").count()
    available_beds = bed_q.filter(models.Bed.status == "Available").count()
    cleaning_beds = bed_q.filter(models.Bed.status == "Cleaning").count()
    occupancy_rate = round((occupied_beds / max(1, total_beds)) * 100, 1)

    doc_q = db.query(models.Doctor)
    if facility_id:
        doc_q = doc_q.filter(models.Doctor.facility_id == facility_id)
    docs_rostered = doc_q.count()
    docs_present = doc_q.filter(models.Doctor.is_present == True).count()
    docs_absent = docs_rostered - docs_present

    pending_trf_q = db.query(models.StockTransfer).filter(models.StockTransfer.status == "Pending")
    if facility_id:
        pending_trf_q = pending_trf_q.filter(
            or_(
                models.StockTransfer.source_facility_id == facility_id,
                models.StockTransfer.destination_facility_id == facility_id
            )
        )
    pending_reorders_count = pending_trf_q.count() + stockout_risks

    alerts = get_alerts(db, facility_id=facility_id, status_filter="Active")
    active_alerts_count = len(alerts)

    act_q = db.query(models.ActivityLog)
    if facility_id:
        act_q = act_q.filter(or_(models.ActivityLog.facility_id == facility_id, models.ActivityLog.facility_id == None))
    recent_acts = act_q.order_by(desc(models.ActivityLog.timestamp)).limit(8).all()
    act_outs = [schemas.ActivityLogOut.model_validate(a) for a in recent_acts]

    days_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    consumption_trend = [
        {"day": days_labels[i], "consumed": 65 + (i * 7) % 29, "restocked": 50 + (i * 11) % 35}
        for i in range(7)
    ]

    patient_flow_hourly = [
        {"time": f"{h:02d}:00", "count": c}
        for h, c in [(8, 14), (9, 28), (10, 42), (11, 38), (12, 25), (13, 16), (14, 22), (15, 30), (16, 21), (17, 12)]
    ]

    return schemas.DashboardSummary(
        facility_id=facility_id,
        facility_name=fac_name,
        total_medicines=total_meds,
        medicines_needing_attention=needing_attention,
        stockout_risks=stockout_risks,
        total_patients_today=total_patients_today,
        patients_waiting=waiting_patients,
        average_wait_minutes=avg_wait,
        total_beds=total_beds,
        occupied_beds=occupied_beds,
        available_beds=available_beds,
        cleaning_beds=cleaning_beds,
        bed_occupancy_rate=occupancy_rate,
        doctors_rostered=docs_rostered,
        doctors_present=docs_present,
        doctors_absent=docs_absent,
        pending_reorders_count=pending_reorders_count,
        active_alerts_count=active_alerts_count,
        recent_activities=act_outs,
        priority_alerts=alerts[:5],
        consumption_trend=consumption_trend,
        patient_flow_hourly=patient_flow_hourly
    )
