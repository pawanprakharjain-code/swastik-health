from datetime import datetime, date, timedelta, timezone
from sqlalchemy.orm import Session
from . import models
from .forecasting import generate_alerts_from_inventory

def utcnow():
    return datetime.now(timezone.utc)

def seed_database(db: Session, force: bool = False):
    if not force and db.query(models.Facility).count() > 0:
        return

    if force:
        db.query(models.ActivityLog).delete()
        db.query(models.Alert).delete()
        db.query(models.StockTransfer).delete()
        db.query(models.StockMovement).delete()
        db.query(models.ConsumptionHistory).delete()
        db.query(models.PatientQueue).delete()
        db.query(models.Bed).delete()
        db.query(models.Doctor).delete()
        db.query(models.Medicine).delete()
        db.query(models.Facility).delete()
        db.commit()

    facilities = [
        models.Facility(
            id="FAC-01",
            name="PHC Ramgarh",
            facility_type="Primary Health Centre",
            district="Greenfield Rural",
            state="Demo State",
            contact_phone="+91 98765 11001",
            total_beds=20
        ),
        models.Facility(
            id="FAC-02",
            name="CHC Balrampur",
            facility_type="Community Health Centre",
            district="Greenfield Central",
            state="Demo State",
            contact_phone="+91 98765 22002",
            total_beds=40
        ),
        models.Facility(
            id="FAC-03",
            name="District Hospital Greenfield",
            facility_type="District Hospital",
            district="Greenfield Metro",
            state="Demo State",
            contact_phone="+91 98765 33003",
            total_beds=100
        ),
        models.Facility(
            id="FAC-04",
            name="PHC Shivpuri",
            facility_type="Primary Health Centre",
            district="Greenfield North",
            state="Demo State",
            contact_phone="+91 98765 44004",
            total_beds=15
        )
    ]
    db.add_all(facilities)
    db.flush()

    today = date.today()
    med_catalogue = [
        {"id": "MED-001", "name": "Paracetamol 500 mg", "gen": "Acetaminophen", "cat": "Analgesic & Antipyretic", "stock": 420, "unit": "Tablets", "reorder": 120, "daily": 35.0, "exp": today + timedelta(days=400), "lead": 4},
        {"id": "MED-002", "name": "Amoxicillin 500 mg", "gen": "Amoxicillin Trihydrate", "cat": "Antibiotic", "stock": 24, "unit": "Capsules", "reorder": 80, "daily": 14.0, "exp": today + timedelta(days=280), "lead": 5},
        {"id": "MED-003", "name": "ORS Powder Sachets", "gen": "Oral Rehydration Salts", "cat": "Electrolyte & Rehydration", "stock": 180, "unit": "Sachets", "reorder": 60, "daily": 18.0, "exp": today + timedelta(days=22), "lead": 3},
        {"id": "MED-004", "name": "Azithromycin 250 mg", "gen": "Azithromycin", "cat": "Antibiotic", "stock": 0, "unit": "Tablets", "reorder": 50, "daily": 10.0, "exp": today + timedelta(days=320), "lead": 4},
        {"id": "MED-005", "name": "Metformin 500 mg", "gen": "Metformin Hydrochloride", "cat": "Antidiabetic", "stock": 70, "unit": "Tablets", "reorder": 75, "daily": 15.0, "exp": today + timedelta(days=365), "lead": 4},
        {"id": "MED-006", "name": "Cetirizine 10 mg", "gen": "Cetirizine Dihydrochloride", "cat": "Antihistamine", "stock": 310, "unit": "Tablets", "reorder": 80, "daily": 12.0, "exp": today + timedelta(days=500), "lead": 3},
        {"id": "MED-007", "name": "Salbutamol Inhaler 100 mcg", "gen": "Albuterol / Salbutamol", "cat": "Respiratory Bronchodilator", "stock": 18, "unit": "Canisters", "reorder": 30, "daily": 4.5, "exp": today + timedelta(days=190), "lead": 6},
        {"id": "MED-008", "name": "Amlodipine 5 mg", "gen": "Amlodipine Besylate", "cat": "Cardiovascular / Antihypertensive", "stock": 260, "unit": "Tablets", "reorder": 100, "daily": 16.0, "exp": today + timedelta(days=450), "lead": 4},
        {"id": "MED-009", "name": "Iron + Folic Acid", "gen": "Ferrous Sulfate + Folic Acid", "cat": "Nutritional Supplement", "stock": 85, "unit": "Tablets", "reorder": 100, "daily": 18.0, "exp": today + timedelta(days=240), "lead": 4},
        {"id": "MED-010", "name": "Povidone Iodine 5%", "gen": "Povidone-Iodine Solution", "cat": "Antiseptic & Disinfectant", "stock": 42, "unit": "Bottles (100ml)", "reorder": 25, "daily": 3.0, "exp": today + timedelta(days=600), "lead": 4},
        {"id": "MED-011", "name": "Zinc Sulfate 20 mg", "gen": "Zinc Sulfate Dispersible", "cat": "Paediatric Supplement", "stock": 140, "unit": "Tablets", "reorder": 60, "daily": 9.0, "exp": today + timedelta(days=330), "lead": 3},
        {"id": "MED-012", "name": "Normal Saline (0.9% NaCl)", "gen": "Sodium Chloride 0.9% IV", "cat": "IV Fluids", "stock": 65, "unit": "Bags (500ml)", "reorder": 50, "daily": 11.0, "exp": today + timedelta(days=380), "lead": 3},
        {"id": "MED-013", "name": "Dextrose 5% IV", "gen": "Dextrose Infusion 5%", "cat": "IV Fluids", "stock": 58, "unit": "Bags (500ml)", "reorder": 45, "daily": 8.0, "exp": today + timedelta(days=400), "lead": 3},
        {"id": "MED-014", "name": "Ibuprofen 400 mg", "gen": "Ibuprofen", "cat": "NSAID Analgesic", "stock": 195, "unit": "Tablets", "reorder": 80, "daily": 14.0, "exp": today + timedelta(days=310), "lead": 4},
        {"id": "MED-015", "name": "Ciprofloxacin Eye Drops", "gen": "Ciprofloxacin 0.3%", "cat": "Ophthalmic", "stock": 35, "unit": "Vials (5ml)", "reorder": 20, "daily": 2.5, "exp": today + timedelta(days=210), "lead": 4},
        {"id": "MED-016", "name": "Omeprazole 20 mg", "gen": "Omeprazole Capsules", "cat": "Gastrointestinal Antacid", "stock": 210, "unit": "Capsules", "reorder": 70, "daily": 15.0, "exp": today + timedelta(days=420), "lead": 4},
        {"id": "MED-017", "name": "Rabies Antiserum", "gen": "Equine Rabies Immunoglobulin", "cat": "Biologicals / Vaccine", "stock": 8, "unit": "Vials", "reorder": 15, "daily": 1.2, "exp": today + timedelta(days=120), "lead": 7},
        {"id": "MED-018", "name": "Tetanus Toxoid (TT)", "gen": "Tetanus Vaccine Adsorbed", "cat": "Immunization / Vaccine", "stock": 88, "unit": "Ampoules", "reorder": 40, "daily": 6.0, "exp": today + timedelta(days=290), "lead": 4}
    ]

    for i, m in enumerate(med_catalogue):
        batch_num = f"BAT-2024-{100 + i}"
        med1 = models.Medicine(
            id=f"{m['id']}-F1",
            facility_id="FAC-01",
            name=m["name"],
            generic_name=m["gen"],
            category=m["cat"],
            batch_number=batch_num,
            current_stock=m["stock"],
            unit=m["unit"],
            min_threshold=m["reorder"],
            avg_daily_consumption=m["daily"],
            lead_time_days=m["lead"],
            supplier="State Central Medical Supplies Depot",
            expiry_date=m["exp"],
            last_updated=utcnow()
        )
        db.add(med1)

        surplus_stock = int(m["stock"] * 2.5 + 50)
        med2 = models.Medicine(
            id=f"{m['id']}-F2",
            facility_id="FAC-02",
            name=m["name"],
            generic_name=m["gen"],
            category=m["cat"],
            batch_number=f"BAT-2024-{200 + i}",
            current_stock=surplus_stock,
            unit=m["unit"],
            min_threshold=m["reorder"],
            avg_daily_consumption=m["daily"] * 1.8,
            lead_time_days=m["lead"],
            supplier="State Central Medical Supplies Depot",
            expiry_date=m["exp"] + timedelta(days=90),
            last_updated=utcnow()
        )
        db.add(med2)

        hub_stock = int(m["stock"] * 5.0 + 200)
        med3 = models.Medicine(
            id=f"{m['id']}-F3",
            facility_id="FAC-03",
            name=m["name"],
            generic_name=m["gen"],
            category=m["cat"],
            batch_number=f"BAT-2024-{300 + i}",
            current_stock=hub_stock,
            unit=m["unit"],
            min_threshold=m["reorder"] * 2,
            avg_daily_consumption=m["daily"] * 3.5,
            lead_time_days=3,
            supplier="State Central Medical Supplies Depot",
            expiry_date=m["exp"] + timedelta(days=180),
            last_updated=utcnow()
        )
        db.add(med3)

    db.flush()

    fac1_meds = db.query(models.Medicine).filter(models.Medicine.facility_id == "FAC-01").all()
    for med in fac1_meds:
        base_rate = med.avg_daily_consumption
        for day_idx in range(21, 0, -1):
            hist_date = today - timedelta(days=day_idx)
            day_mult = 1.2 if hist_date.weekday() in (0, 4) else (0.8 if hist_date.weekday() == 6 else 1.0)
            qty = max(1, int(base_rate * day_mult + ((day_idx % 3) - 1)))
            db.add(models.ConsumptionHistory(
                medicine_id=med.id,
                facility_id="FAC-01",
                record_date=hist_date,
                quantity_consumed=qty
            ))
    db.flush()

    wards = ["General Ward A", "General Ward B", "Emergency / Triage", "Maternity Ward"]
    for b_idx in range(1, 31):
        assigned_ward = wards[(b_idx - 1) // 8 % len(wards)]
        if b_idx in (1, 2, 4, 7, 9, 12, 15, 18, 20, 22, 25):
            b_status = "Available"
        elif b_idx in (3, 6, 11, 19):
            b_status = "Cleaning"
        elif b_idx == 30:
            b_status = "Out of service"
        else:
            b_status = "Occupied"

        db.add(models.Bed(
            id=f"BED-{b_idx:02d}",
            facility_id="FAC-01",
            bed_number=f"B-{b_idx:02d}",
            ward=assigned_ward,
            status=b_status,
            last_updated=utcnow()
        ))

    for b_idx in range(1, 41):
        db.add(models.Bed(
            id=f"F2-BED-{b_idx:02d}",
            facility_id="FAC-02",
            bed_number=f"B2-{b_idx:02d}",
            ward="General Ward" if b_idx <= 25 else "ICU",
            status="Available" if b_idx % 2 == 0 else "Occupied",
            last_updated=utcnow()
        ))

    doctors_data = [
        {"id": "DOC-01", "name": "Dr. Aditi Sharma", "dept": "General Medicine", "shift": "Morning (08:00–14:00)", "present": True, "fac": "FAC-01"},
        {"id": "DOC-02", "name": "Dr. Rahul Verma", "dept": "Paediatrics", "shift": "Morning (08:00–14:00)", "present": True, "fac": "FAC-01"},
        {"id": "DOC-03", "name": "Dr. Sana Khan", "dept": "Gynaecology & Obstetrics", "shift": "Morning (08:00–14:00)", "present": True, "fac": "FAC-01"},
        {"id": "DOC-04", "name": "Dr. Karan Patel", "dept": "Emergency Medicine", "shift": "Evening (14:00–20:00)", "present": True, "fac": "FAC-01"},
        {"id": "DOC-05", "name": "Dr. Meera Joshi", "dept": "General Medicine", "shift": "Evening (14:00–20:00)", "present": False, "fac": "FAC-01", "notes": "On medical leave"},
        {"id": "DOC-06", "name": "Dr. Arjun Rao", "dept": "Dental Surgery", "shift": "Morning (08:00–14:00)", "present": False, "fac": "FAC-01", "notes": "Attending district immunization training"},
        
        {"id": "DOC-07", "name": "Dr. Rajesh Gupta", "dept": "General Medicine", "shift": "Morning (08:00–14:00)", "present": True, "fac": "FAC-02"},
        {"id": "DOC-08", "name": "Dr. Pooja Iyer", "dept": "Paediatrics", "shift": "Morning (08:00–14:00)", "present": True, "fac": "FAC-02"},
        {"id": "DOC-09", "name": "Dr. Vikram Singh", "dept": "Emergency Medicine", "shift": "Night (20:00–08:00)", "present": True, "fac": "FAC-02"}
    ]
    for d in doctors_data:
        db.add(models.Doctor(
            id=d["id"],
            facility_id=d["fac"],
            name=d["name"],
            department=d["dept"],
            shift=d["shift"],
            is_present=d["present"],
            notes=d.get("notes"),
            last_updated=utcnow()
        ))

    pq_data = [
        {"token": "T-1021", "dept": "General OPD", "status": "In Consultation", "pri": "Routine", "area": "OPD Room 1", "wait": 0},
        {"token": "T-1022", "dept": "Emergency", "status": "In Consultation", "pri": "Emergency", "area": "Triage Bay", "wait": 0},
        {"token": "T-1023", "dept": "Paediatrics", "status": "Waiting", "pri": "Routine", "area": "Room 3", "wait": 12},
        {"token": "T-1024", "dept": "General OPD", "status": "Waiting", "pri": "Urgent", "area": "OPD Room 1", "wait": 18},
        {"token": "T-1025", "dept": "Gynaecology & Obstetrics", "status": "Waiting", "pri": "Routine", "area": "Room 2", "wait": 25},
        {"token": "T-1026", "dept": "General OPD", "status": "Waiting", "pri": "Routine", "area": "OPD Room 2", "wait": 35},
        {"token": "T-1027", "dept": "General OPD", "status": "Waiting", "pri": "Routine", "area": "OPD Room 1", "wait": 45},
        {"token": "T-1028", "dept": "Emergency", "status": "Completed", "pri": "Urgent", "area": "Triage Bay", "wait": 5},
        {"token": "T-1029", "dept": "General OPD", "status": "Completed", "pri": "Routine", "area": "OPD Room 1", "wait": 10}
    ]
    for p in pq_data:
        db.add(models.PatientQueue(
            id=f"PQ-{p['token']}",
            token=p["token"],
            facility_id="FAC-01",
            department=p["dept"],
            arrival_time=utcnow() - timedelta(minutes=p["wait"] + 15),
            queue_status=p["status"],
            priority=p["pri"],
            assigned_service_area=p["area"],
            estimated_wait_minutes=p["wait"]
        ))

    db.add(models.StockTransfer(
        id="TRF-1001",
        medicine_id="MED-002-F2",
        medicine_name="Amoxicillin 500 mg",
        source_facility_id="FAC-02",
        destination_facility_id="FAC-01",
        quantity=50,
        status="Pending",
        notes="Urgent replenishment request: PHC Ramgarh inventory critical (24 caps remaining)",
        requested_by="Pharmacist, PHC Ramgarh",
        created_at=utcnow() - timedelta(hours=2)
    ))

    db.add(models.StockTransfer(
        id="TRF-0994",
        medicine_id="MED-001-F3",
        medicine_name="Paracetamol 500 mg",
        source_facility_id="FAC-03",
        destination_facility_id="FAC-01",
        quantity=200,
        status="Approved",
        notes="Standard weekly replenishment batch",
        requested_by="Store Manager, PHC Ramgarh",
        approved_by="District Supply Officer",
        created_at=utcnow() - timedelta(days=3),
        resolved_at=utcnow() - timedelta(days=2)
    ))

    db.add(models.ActivityLog(
        facility_id="FAC-01",
        action_type="SYSTEM",
        description="Demo facility database initialized with standard synthetic formulary.",
        user_role="System Admin",
        timestamp=utcnow() - timedelta(hours=5)
    ))
    db.add(models.ActivityLog(
        facility_id="FAC-01",
        action_type="TRANSFER",
        description="Pending transfer TRF-1001 created for 50 Capsules of Amoxicillin 500 mg from CHC Balrampur.",
        user_role="Facility Pharmacist",
        timestamp=utcnow() - timedelta(hours=2)
    ))

    db.commit()
    generate_alerts_from_inventory(db)
