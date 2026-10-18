from datetime import datetime, date, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from .database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Facility(Base):
    __tablename__ = "facilities"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    facility_type = Column(String(50), nullable=False)
    district = Column(String(80), nullable=False)
    state = Column(String(80), default="Demo State")
    contact_phone = Column(String(30), default="+91 98765 43210")
    total_beds = Column(Integer, default=30)
    created_at = Column(DateTime, default=utcnow)

    medicines = relationship("Medicine", back_populates="facility", cascade="all, delete-orphan")
    beds = relationship("Bed", back_populates="facility", cascade="all, delete-orphan")
    doctors = relationship("Doctor", back_populates="facility", cascade="all, delete-orphan")
    patients = relationship("PatientQueue", back_populates="facility", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="facility", cascade="all, delete-orphan")


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(String(50), primary_key=True, index=True)
    facility_id = Column(String(50), ForeignKey("facilities.id"), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    generic_name = Column(String(120), nullable=False)
    category = Column(String(60), nullable=False, index=True)
    batch_number = Column(String(60), nullable=False)
    current_stock = Column(Integer, default=0)
    unit = Column(String(30), default="Units")
    min_threshold = Column(Integer, default=50)
    avg_daily_consumption = Column(Float, default=5.0)
    lead_time_days = Column(Integer, default=4)
    supplier = Column(String(120), default="State Central Medical Supplies")
    expiry_date = Column(Date, nullable=False, index=True)
    last_updated = Column(DateTime, default=utcnow, onupdate=utcnow)

    facility = relationship("Facility", back_populates="medicines")
    stock_movements = relationship("StockMovement", back_populates="medicine", cascade="all, delete-orphan")
    consumption_history = relationship("ConsumptionHistory", back_populates="medicine", cascade="all, delete-orphan")


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    medicine_id = Column(String(50), ForeignKey("medicines.id"), nullable=False, index=True)
    facility_id = Column(String(50), ForeignKey("facilities.id"), nullable=False, index=True)
    movement_type = Column(String(30), nullable=False)
    quantity = Column(Integer, nullable=False)
    previous_stock = Column(Integer, nullable=False)
    new_stock = Column(Integer, nullable=False)
    reason = Column(String(255), nullable=False)
    reference_id = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=utcnow, index=True)

    medicine = relationship("Medicine", back_populates="stock_movements")


class ConsumptionHistory(Base):
    __tablename__ = "consumption_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    medicine_id = Column(String(50), ForeignKey("medicines.id"), nullable=False, index=True)
    facility_id = Column(String(50), ForeignKey("facilities.id"), nullable=False, index=True)
    record_date = Column(Date, nullable=False, index=True)
    quantity_consumed = Column(Integer, default=0)

    medicine = relationship("Medicine", back_populates="consumption_history")


class PatientQueue(Base):
    __tablename__ = "patient_queues"

    id = Column(String(50), primary_key=True, index=True)
    token = Column(String(30), nullable=False, index=True)
    facility_id = Column(String(50), ForeignKey("facilities.id"), nullable=False, index=True)
    department = Column(String(60), nullable=False)
    arrival_time = Column(DateTime, default=utcnow)
    queue_status = Column(String(30), default="Waiting", index=True)
    priority = Column(String(30), default="Routine")
    assigned_service_area = Column(String(60), default="Room 1")
    estimated_wait_minutes = Column(Integer, default=15)
    completed_time = Column(DateTime, nullable=True)

    facility = relationship("Facility", back_populates="patients")


class Bed(Base):
    __tablename__ = "beds"

    id = Column(String(50), primary_key=True, index=True)
    facility_id = Column(String(50), ForeignKey("facilities.id"), nullable=False, index=True)
    bed_number = Column(String(20), nullable=False)
    ward = Column(String(60), nullable=False)
    status = Column(String(30), default="Available", index=True)
    last_updated = Column(DateTime, default=utcnow, onupdate=utcnow)

    facility = relationship("Facility", back_populates="beds")


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(String(50), primary_key=True, index=True)
    facility_id = Column(String(50), ForeignKey("facilities.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    department = Column(String(60), nullable=False)
    shift = Column(String(60), default="Morning (08:00–14:00)")
    is_present = Column(Boolean, default=True, index=True)
    notes = Column(String(255), nullable=True)
    last_updated = Column(DateTime, default=utcnow, onupdate=utcnow)

    facility = relationship("Facility", back_populates="doctors")


class StockTransfer(Base):
    __tablename__ = "stock_transfers"

    id = Column(String(60), primary_key=True, index=True)
    medicine_id = Column(String(50), ForeignKey("medicines.id"), nullable=False, index=True)
    medicine_name = Column(String(120), nullable=False)
    source_facility_id = Column(String(50), ForeignKey("facilities.id"), nullable=False, index=True)
    destination_facility_id = Column(String(50), ForeignKey("facilities.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    status = Column(String(30), default="Pending", index=True)
    notes = Column(Text, nullable=True)
    requested_by = Column(String(100), default="Facility Pharmacist")
    approved_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=utcnow)
    resolved_at = Column(DateTime, nullable=True)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(50), primary_key=True, index=True)
    facility_id = Column(String(50), ForeignKey("facilities.id"), nullable=False, index=True)
    category = Column(String(50), nullable=False)
    severity = Column(String(20), default="WARNING", index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(String(50), nullable=True)
    recommended_action = Column(Text, nullable=False)
    status = Column(String(30), default="Active", index=True)
    created_at = Column(DateTime, default=utcnow)
    resolved_at = Column(DateTime, nullable=True)

    facility = relationship("Facility", back_populates="alerts")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    facility_id = Column(String(50), nullable=True, index=True)
    action_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    user_role = Column(String(50), default="Healthcare Staff")
    timestamp = Column(DateTime, default=utcnow, index=True)
