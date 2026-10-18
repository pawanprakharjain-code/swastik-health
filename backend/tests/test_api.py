import pytest
from datetime import date, timedelta, datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app import models, schemas, crud
from backend.app.forecasting import calculate_medicine_forecast
from backend.app.seed_data import seed_database

# Use in-memory SQLite with StaticPool so all connections share the same memory instance
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    seed_database(session, force=True)
    yield session
    session.close()
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ----------------- SYSTEM & HEALTH TESTS -----------------
def test_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "DEMO ENVIRONMENT" in data["environment"]

def test_list_facilities(client):
    res = client.get("/api/facilities")
    assert res.status_code == 200
    facs = res.json()
    assert len(facs) >= 4
    fac_ids = [f["id"] for f in facs]
    assert "FAC-01" in fac_ids
    assert "FAC-02" in fac_ids


# ----------------- INVENTORY TESTS -----------------
def test_add_medicine_valid(client):
    payload = {
        "id": "MED-TEST-01",
        "facility_id": "FAC-01",
        "name": "Ibuprofen Liquid 100mg/5ml",
        "generic_name": "Ibuprofen Oral Suspension",
        "category": "Paediatric Analgesic",
        "batch_number": "BAT-TEST-99",
        "current_stock": 50,
        "unit": "Bottles (60ml)",
        "min_threshold": 20,
        "avg_daily_consumption": 4.0,
        "lead_time_days": 3,
        "supplier": "State Central Depot",
        "expiry_date": (date.today() + timedelta(days=300)).isoformat()
    }
    res = client.post("/api/medicines", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == payload["name"]
    assert data["current_stock"] == 50

    # Verify initial stock movement recorded
    mov_res = client.get(f"/api/medicines/{data['id']}/movements")
    assert mov_res.status_code == 200
    movements = mov_res.json()
    assert len(movements) >= 1
    assert movements[0]["movement_type"] == "RECEIPT"
    assert movements[0]["new_stock"] == 50

def test_add_medicine_reject_negative_stock(client):
    payload = {
        "facility_id": "FAC-01",
        "name": "Invalid Medicine",
        "generic_name": "Invalid",
        "category": "Test",
        "batch_number": "B-00",
        "current_stock": -10,  # Negative stock should be rejected
        "unit": "Units",
        "min_threshold": 10,
        "avg_daily_consumption": 2.0,
        "expiry_date": (date.today() + timedelta(days=100)).isoformat()
    }
    res = client.post("/api/medicines", json=payload)
    assert res.status_code == 422  # Pydantic validation error

def test_receive_stock(client):
    res = client.post("/api/medicines/MED-001-F1/receive", json={
        "quantity": 100,
        "reason": "Replenishment batch arrived",
        "batch_number": "BAT-NEW-BATCH"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["current_stock"] == 520  # 420 initial + 100

    # Verify movement entry
    mov_res = client.get("/api/medicines/MED-001-F1/movements")
    assert mov_res.status_code == 200
    movements = mov_res.json()
    assert movements[0]["quantity"] == 100
    assert movements[0]["new_stock"] == 520

def test_adjust_stock_with_reason(client):
    res = client.post("/api/medicines/MED-001-F1/adjust", json={
        "new_quantity": 400,
        "reason": "Quarterly physical count reconciliation"
    })
    assert res.status_code == 200
    assert res.json()["current_stock"] == 400

    # Negative adjustment value must be rejected
    res_bad = client.post("/api/medicines/MED-001-F1/adjust", json={
        "new_quantity": -5,
        "reason": "Broken vials"
    })
    assert res_bad.status_code == 422

def test_low_stock_detection(client):
    # Set stock below threshold
    client.post("/api/medicines/MED-001-F1/adjust", json={
        "new_quantity": 40,
        "reason": "Emergency outbreak consumption"
    })
    med_res = client.get("/api/medicines/MED-001-F1")
    assert med_res.status_code == 200
    assert med_res.json()["status"] in ["Low Stock", "Critical"]


# ----------------- FORECASTING TESTS -----------------
def test_forecasting_calculation(client, db_session):
    res = client.get("/api/forecast?facility_id=FAC-01")
    assert res.status_code == 200
    data = res.json()
    assert data["total_forecasted"] >= 15
    assert len(data["items"]) >= 15
    assert data["critical_risk_count"] >= 1

    # Check Amoxicillin forecast item
    amox = next((item for item in data["items"] if "Amoxicillin" in item["medicine_name"]), None)
    assert amox is not None
    assert amox["risk_level"] in ["CRITICAL", "HIGH"]
    assert amox["days_until_stockout"] < 10.0
    assert amox["suggested_reorder_qty"] > 0
    assert "stockout" in amox["risk_reason"].lower()

def test_forecasting_zero_consumption_safety():
    med = models.Medicine(
        id="MED-ZERO-TEST",
        facility_id="FAC-01",
        name="Zero Use Medicine",
        generic_name="Test",
        category="Test",
        batch_number="B-1",
        current_stock=50,
        unit="Units",
        min_threshold=10,
        avg_daily_consumption=0.0,
        lead_time_days=4,
        expiry_date=date.today() + timedelta(days=200)
    )
    # Should safely return forecast without division by zero error
    item = calculate_medicine_forecast(medicine=med, history_records=[])
    assert item.days_until_stockout >= 900
    assert item.risk_level == "LOW"

def test_forecasting_recalculate_action(client):
    res = client.post("/api/forecast/recalculate?facility_id=FAC-01")
    assert res.status_code == 200
    data = res.json()
    assert data["total_forecasted"] > 0
    assert "Weighted Moving Average" in data["model_methodology"]


# ----------------- PATIENT QUEUE TESTS -----------------
def test_patient_queue_flow(client):
    # 1. Register demo patient
    reg_res = client.post("/api/patients/queue", json={
        "facility_id": "FAC-01",
        "department": "General OPD",
        "priority": "Urgent",
        "assigned_service_area": "OPD Room 2"
    })
    assert reg_res.status_code == 201
    patient = reg_res.json()
    token = patient["token"]
    assert token.startswith("T-")
    assert patient["queue_status"] == "Waiting"

    # 2. Update status to In Consultation
    up_res = client.patch(f"/api/patients/queue/{patient['id']}", json={
        "queue_status": "In Consultation",
        "assigned_service_area": "OPD Room 2"
    })
    assert up_res.status_code == 200
    assert up_res.json()["queue_status"] == "In Consultation"

    # 3. Complete consultation
    comp_res = client.patch(f"/api/patients/queue/{patient['id']}", json={
        "queue_status": "Completed"
    })
    assert comp_res.status_code == 200
    assert comp_res.json()["queue_status"] == "Completed"
    assert comp_res.json()["completed_time"] is not None


# ----------------- BED MANAGEMENT TESTS -----------------
def test_bed_status_transitions(client):
    # Check bed status
    bed_res = client.patch("/api/beds/BED-01", json={"status": "Occupied"})
    assert bed_res.status_code == 200
    assert bed_res.json()["status"] == "Occupied"

    # Cycle to Cleaning
    bed_res = client.patch("/api/beds/BED-01", json={"status": "Cleaning"})
    assert bed_res.status_code == 200
    assert bed_res.json()["status"] == "Cleaning"

    # Cycle to Available
    bed_res = client.patch("/api/beds/BED-01", json={"status": "Available"})
    assert bed_res.status_code == 200
    assert bed_res.json()["status"] == "Available"

    # Reject invalid status
    bad_res = client.patch("/api/beds/BED-01", json={"status": "INVALID_STATUS"})
    assert bad_res.status_code == 400


# ----------------- DOCTOR ATTENDANCE TESTS -----------------
def test_doctor_attendance_toggle(client):
    res = client.patch("/api/doctors/DOC-05/attendance", json={
        "is_present": True,
        "notes": "Returned from medical leave"
    })
    assert res.status_code == 200
    assert res.json()["is_present"] is True

    # Check dashboard reflection
    dash = client.get("/api/dashboard?facility_id=FAC-01").json()
    assert dash["doctors_present"] >= 5


# ----------------- SUPPLY CHAIN / TRANSFER TESTS -----------------
def test_stock_transfer_workflow(client):
    # 1. Create transfer request from FAC-02 (surplus) to FAC-01
    trf_res = client.post("/api/transfers", json={
        "medicine_id": "MED-001-F2",
        "source_facility_id": "FAC-02",
        "destination_facility_id": "FAC-01",
        "quantity": 100,
        "notes": "Transfer request to replenish low reserves"
    })
    assert trf_res.status_code == 201
    trf = trf_res.json()
    assert trf["status"] == "Pending"
    trf_id = trf["id"]

    # 2. Reject transfer exceeding available stock
    fail_res = client.post("/api/transfers", json={
        "medicine_id": "MED-001-F2",
        "source_facility_id": "FAC-02",
        "destination_facility_id": "FAC-01",
        "quantity": 999999,  # Ridiculously high quantity
        "notes": "Excessive transfer"
    })
    assert fail_res.status_code == 400

    # 3. Check stock before approval
    src_before = client.get("/api/medicines/MED-001-F2").json()["current_stock"]
    dest_before = client.get("/api/medicines/MED-001-F1").json()["current_stock"]

    # 4. Approve transfer
    appr_res = client.post(f"/api/transfers/{trf_id}/approve")
    assert appr_res.status_code == 200
    assert appr_res.json()["status"] == "Approved"

    # 5. Verify atomic stock movements at both facilities
    src_after = client.get("/api/medicines/MED-001-F2").json()["current_stock"]
    dest_after = client.get("/api/medicines/MED-001-F1").json()["current_stock"]
    assert src_after == src_before - 100
    assert dest_after == dest_before + 100

    # 6. Verify duplicate approval is rejected (Idempotency)
    dup_res = client.post(f"/api/transfers/{trf_id}/approve")
    assert dup_res.status_code == 400  # Already approved
