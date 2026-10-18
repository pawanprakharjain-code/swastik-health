from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, date

# Facility Schemas
class FacilityBase(BaseModel):
    name: str
    facility_type: str
    district: str
    state: str = "Demo State"
    contact_phone: str = "+91 98765 43210"
    total_beds: int = 30

class FacilityCreate(FacilityBase):
    id: str

class FacilityOut(FacilityBase):
    id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# Stock Movement Schemas
class StockMovementBase(BaseModel):
    movement_type: str
    quantity: int
    reason: str
    reference_id: Optional[str] = None

class StockMovementOut(BaseModel):
    id: int
    medicine_id: str
    facility_id: str
    movement_type: str
    quantity: int
    previous_stock: int
    new_stock: int
    reason: str
    reference_id: Optional[str] = None
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)


# Stock Operations
class StockReceiptRequest(BaseModel):
    quantity: int = Field(gt=0, description="Quantity to add must be positive")
    batch_number: Optional[str] = None
    supplier: Optional[str] = None
    reason: str = "Stock delivery receipt"

class StockAdjustmentRequest(BaseModel):
    new_quantity: int = Field(ge=0, description="New stock quantity cannot be negative")
    reason: str = Field(min_length=3, description="Audit reason for stock adjustment")


# Medicine Schemas
class MedicineBase(BaseModel):
    facility_id: str
    name: str
    generic_name: str
    category: str
    batch_number: str
    current_stock: int = Field(ge=0, description="Stock cannot be negative")
    unit: str = "Units"
    min_threshold: int = Field(ge=0, description="Threshold cannot be negative")
    avg_daily_consumption: float = Field(ge=0.0)
    lead_time_days: int = Field(default=4, ge=1)
    supplier: str = "State Central Medical Supplies"
    expiry_date: date

class MedicineCreate(MedicineBase):
    id: Optional[str] = None

class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    generic_name: Optional[str] = None
    category: Optional[str] = None
    batch_number: Optional[str] = None
    unit: Optional[str] = None
    min_threshold: Optional[int] = Field(default=None, ge=0)
    avg_daily_consumption: Optional[float] = Field(default=None, ge=0.0)
    lead_time_days: Optional[int] = Field(default=None, ge=1)
    supplier: Optional[str] = None
    expiry_date: Optional[date] = None

class MedicineOut(MedicineBase):
    id: str
    last_updated: datetime
    status: str = "Healthy"
    days_until_stockout: Optional[float] = None
    is_near_expiry: bool = False
    model_config = ConfigDict(from_attributes=True)


# Patient Queue Schemas
class PatientQueueBase(BaseModel):
    facility_id: str
    department: str = "General OPD"
    priority: str = "Routine"
    assigned_service_area: str = "Room 1"

class PatientQueueCreate(PatientQueueBase):
    token: Optional[str] = None

class PatientQueueStatusUpdate(BaseModel):
    queue_status: str
    assigned_service_area: Optional[str] = None

class PatientQueueOut(BaseModel):
    id: str
    token: str
    facility_id: str
    department: str
    arrival_time: datetime
    queue_status: str
    priority: str
    assigned_service_area: str
    estimated_wait_minutes: int
    completed_time: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


# Bed Schemas
class BedUpdate(BaseModel):
    status: str

class BedOut(BaseModel):
    id: str
    facility_id: str
    bed_number: str
    ward: str
    status: str
    last_updated: datetime
    model_config = ConfigDict(from_attributes=True)


# Doctor Schemas
class DoctorBase(BaseModel):
    facility_id: str
    name: str
    department: str
    shift: str = "Morning (08:00–14:00)"
    is_present: bool = True
    notes: Optional[str] = None

class DoctorCreate(DoctorBase):
    id: Optional[str] = None

class DoctorAttendanceUpdate(BaseModel):
    is_present: bool
    notes: Optional[str] = None

class DoctorOut(DoctorBase):
    id: str
    last_updated: datetime
    model_config = ConfigDict(from_attributes=True)


# Stock Transfer Schemas
class StockTransferCreate(BaseModel):
    medicine_id: str
    source_facility_id: str
    destination_facility_id: str
    quantity: int = Field(gt=0, description="Transfer quantity must be greater than 0")
    notes: Optional[str] = None
    requested_by: str = "Facility Pharmacist"

class StockTransferOut(BaseModel):
    id: str
    medicine_id: str
    medicine_name: str
    source_facility_id: str
    source_facility_name: Optional[str] = None
    destination_facility_id: str
    destination_facility_name: Optional[str] = None
    quantity: int
    status: str
    notes: Optional[str] = None
    requested_by: str
    approved_by: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


# Alert Schemas
class AlertUpdate(BaseModel):
    status: str

class AlertOut(BaseModel):
    id: str
    facility_id: str
    facility_name: Optional[str] = None
    category: str
    severity: str
    title: str
    description: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    recommended_action: str
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


# Activity Log Schemas
class ActivityLogOut(BaseModel):
    id: int
    facility_id: Optional[str] = None
    action_type: str
    description: str
    user_role: str
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)


# AI Demand Forecasting Schemas
class ForecastItem(BaseModel):
    medicine_id: str
    medicine_name: str
    generic_name: str
    category: str
    facility_id: str
    current_stock: int
    unit: str
    avg_daily_consumption: float
    days_until_stockout: float
    forecast_7_day_demand: int
    forecast_30_day_demand: int
    suggested_reorder_qty: int
    lead_time_days: int
    safety_buffer_units: int
    risk_level: str
    risk_reason: str
    recommended_action: str
    recent_daily_history: List[int] = []

class ForecastRecalculateResponse(BaseModel):
    recalculated_at: datetime
    total_forecasted: int
    critical_risk_count: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    items: List[ForecastItem]
    model_methodology: str


# Dashboard Summary Schema
class DashboardSummary(BaseModel):
    facility_id: Optional[str] = None
    facility_name: str
    total_medicines: int
    medicines_needing_attention: int
    stockout_risks: int
    total_patients_today: int
    patients_waiting: int
    average_wait_minutes: int
    total_beds: int
    occupied_beds: int
    available_beds: int
    cleaning_beds: int
    bed_occupancy_rate: float
    doctors_rostered: int
    doctors_present: int
    doctors_absent: int
    pending_reorders_count: int
    active_alerts_count: int
    recent_activities: List[ActivityLogOut]
    priority_alerts: List[AlertOut]
    consumption_trend: List[Dict[str, Any]]
    patient_flow_hourly: List[Dict[str, Any]]
