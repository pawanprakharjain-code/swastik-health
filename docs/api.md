# SehatFlow AI — REST API Reference Guide

The SehatFlow AI backend is implemented in Python FastAPI with Pydantic v2 schemas and SQLAlchemy 2.0 ORM.

Interactive documentation:
- Swagger UI: `http://localhost:8000/api/docs`
- ReDoc: `http://localhost:8000/api/redoc`

---

## 1. System & Health

### `GET /api/health`
Health probe and environment verification.
```json
{
  "status": "healthy",
  "service": "SehatFlow AI Backend",
  "environment": "DEMO ENVIRONMENT — SYNTHETIC DATA",
  "timestamp": "2026-10-18T05:30:00Z",
  "version": "1.0.0"
}
```

### `POST /api/system/reset-demo`
Restores the database to its pristine canonical demonstration state.

---

## 2. Facilities

### `GET /api/facilities`
Returns all registered health centers.

### `GET /api/facilities/{id}`
Returns details for a specific facility.

---

## 3. Operations Overview Dashboard

### `GET /api/dashboard?facility_id={optional}`
Aggregates real-time KPIs, bed occupancy, doctor roster ratios, alerts, recent activity feed, and 7-day consumption trend data.

---

## 4. Medicine Inventory Management

### `GET /api/medicines?facility_id=&category=&status=&search=&skip=0&limit=100`
Returns medicines matching filter and search criteria.

### `POST /api/medicines`
Registers a new medicine formulation with initial stock receipt movement.
```json
{
  "facility_id": "FAC-01",
  "name": "Paracetamol 500 mg",
  "generic_name": "Acetaminophen",
  "category": "Analgesic & Antipyretic",
  "batch_number": "BAT-2024-101",
  "current_stock": 420,
  "unit": "Tablets",
  "min_threshold": 120,
  "avg_daily_consumption": 35.0,
  "lead_time_days": 4,
  "supplier": "State Central Depot",
  "expiry_date": "2027-10-18"
}
```

### `POST /api/medicines/{id}/receive`
Records an incoming stock shipment, increments inventory, and writes a `RECEIPT` ledger entry.

### `POST /api/medicines/{id}/adjust`
Records physical count reconciliation with mandatory audit reason and writes an `ADJUSTMENT` ledger entry.

### `GET /api/medicines/{id}/movements`
Returns the immutable stock ledger for a medicine.

---

## 5. AI Demand Forecasting

### `GET /api/forecast?facility_id=&safety_days=3.0`
Returns explainable forecast records:
```json
{
  "recalculated_at": "2026-10-18T05:30:00Z",
  "total_forecasted": 18,
  "critical_risk_count": 2,
  "high_risk_count": 3,
  "medium_risk_count": 4,
  "low_risk_count": 9,
  "items": [
    {
      "medicine_id": "MED-002-F1",
      "medicine_name": "Amoxicillin 500 mg",
      "generic_name": "Amoxicillin Trihydrate",
      "category": "Antibiotic",
      "facility_id": "FAC-01",
      "current_stock": 24,
      "unit": "Capsules",
      "avg_daily_consumption": 14.0,
      "days_until_stockout": 1.7,
      "forecast_7_day_demand": 98,
      "suggested_reorder_qty": 144,
      "lead_time_days": 5,
      "safety_buffer_units": 42,
      "risk_level": "CRITICAL",
      "risk_reason": "Imminent stockout: Current stock covers ~1.7 days, which is less than the replenishment lead time (5 days).",
      "recommended_action": "Place expedited reorder for 144 Capsules or dispatch emergency inter-facility transfer immediately."
    }
  ],
  "model_methodology": "Weighted Moving Average (WMA) on 3-week consumption buckets with lead-time calibrated safety buffer"
}
```

### `POST /api/forecast/recalculate?facility_id=`
Reruns the forecasting algorithm and updates active inventory threshold alerts.

---

## 6. Patient Queue Management

### `GET /api/patients/queue?facility_id=&department=&status=`
Returns demonstration patient queue records.

### `POST /api/patients/queue`
Issues a new anonymous patient token (e.g. `T-1045`).

### `PATCH /api/patients/queue/{id}`
Advances patient status (`Waiting` → `In Consultation` → `Completed`).

---

## 7. Bed Capacity Management

### `GET /api/beds?facility_id=&ward=`
Returns bed statuses.

### `PATCH /api/beds/{id}`
Updates bed status (`Available`, `Occupied`, `Cleaning`, `Out of service`).

---

## 8. Doctor Duty Attendance

### `GET /api/doctors?facility_id=&department=`
Returns doctor duty records.

### `PATCH /api/doctors/{id}/attendance`
Toggles doctor attendance status and records timestamp.

### `POST /api/doctors`
Adds a clinician to the facility shift roster.

---

## 9. Multi-Facility Supply Chain Transfers

### `GET /api/transfers?facility_id=`
Returns pending and historical inter-facility transfers.

### `POST /api/transfers`
Creates a pending transfer request with stock validation.

### `POST /api/transfers/{id}/approve`
Executes atomic stock movement:
1. Deducts source inventory
2. Increments destination inventory
3. Writes `TRANSFER_OUT` and `TRANSFER_IN` ledger entries
4. Marks status `Approved`
5. Resolves pending transfer alerts

### `POST /api/transfers/{id}/reject`
Rejects transfer request and closes the item.

---

## 10. Alerts & Activity Logs

### `GET /api/alerts?facility_id=&severity=&status=Active`
Returns deterministic alerts.

### `PATCH /api/alerts/{id}`
Updates alert status (`Acknowledged`, `Resolved`).

### `GET /api/activities?facility_id=&limit=50`
Returns system audit log entries.
