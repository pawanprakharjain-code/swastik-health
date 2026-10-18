import math
from datetime import date, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from . import models, schemas

def calculate_medicine_forecast(
    medicine: models.Medicine,
    history_records: List[models.ConsumptionHistory],
    pending_incoming_transfer_qty: int = 0,
    lead_time_override: Optional[int] = None,
    safety_stock_days: float = 3.0,
    planning_horizon_days: int = 7
) -> schemas.ForecastItem:
    lead_time = lead_time_override or medicine.lead_time_days or 4
    current_stock = max(0, medicine.current_stock)

    # Calculate average daily consumption from history or medicine field
    daily_values = [h.quantity_consumed for h in history_records] if history_records else []
    
    if len(daily_values) >= 7:
        recent_7 = daily_values[-7:]
        avg_recent = sum(recent_7) / 7.0

        if len(daily_values) >= 14:
            mid_7 = daily_values[-14:-7]
            avg_mid = sum(mid_7) / 7.0
        else:
            avg_mid = avg_recent

        if len(daily_values) >= 21:
            old_7 = daily_values[-21:-14]
            avg_old = sum(old_7) / 7.0
        else:
            avg_old = avg_mid

        weighted_daily_rate = (avg_recent * 0.50) + (avg_mid * 0.30) + (avg_old * 0.20)
        has_adequate_history = True
    elif len(daily_values) > 0:
        weighted_daily_rate = sum(daily_values) / float(len(daily_values))
        has_adequate_history = True
    else:
        weighted_daily_rate = float(medicine.avg_daily_consumption) if medicine.avg_daily_consumption is not None else 0.0
        has_adequate_history = False

    daily_rate = max(0.0, round(weighted_daily_rate, 2))
    
    # Calculate days until stockout
    if daily_rate > 0.01:
        days_until_stockout = round(current_stock / daily_rate, 1)
    else:
        days_until_stockout = 999.0 # Zero consumption means no stockout

    # Demands
    forecast_7_day = math.ceil(daily_rate * 7)
    forecast_30_day = math.ceil(daily_rate * 30)

    # Safety buffer
    safety_buffer = math.ceil(daily_rate * float(safety_stock_days))

    # Suggested reorder quantity
    gross_requirement = math.ceil(daily_rate * (lead_time + planning_horizon_days)) + safety_buffer
    effective_inventory = current_stock + pending_incoming_transfer_qty
    suggested_reorder = max(0, gross_requirement - effective_inventory)

    # Risk level assessment
    if daily_rate <= 0.01:
        risk_level = "LOW"
        risk_reason = f"Negligible/zero consumption recorded. Current inventory of {current_stock} {medicine.unit} is secure."
        recommended_action = "Maintain regular surveillance. No reorder required."
    elif current_stock == 0:
        risk_level = "CRITICAL"
        risk_reason = f"Stockout occurred: 0 {medicine.unit} remaining. Replenishment lead time is {lead_time} days."
        recommended_action = f"Initiate immediate emergency stock requisition of {suggested_reorder} {medicine.unit} or request urgent inter-facility transfer."
    elif days_until_stockout <= lead_time:
        risk_level = "CRITICAL"
        risk_reason = f"Imminent stockout: Current stock covers ~{days_until_stockout} days, which is less than the replenishment lead time ({lead_time} days)."
        recommended_action = f"Place expedited reorder for {suggested_reorder} {medicine.unit} or dispatch emergency inter-facility transfer immediately."
    elif days_until_stockout <= (lead_time * 1.5):
        risk_level = "HIGH"
        risk_reason = f"Low stock coverage: Inventory covers ~{days_until_stockout} days (buffer below safety threshold of {lead_time * 1.5:.1f} days)."
        recommended_action = f"Create purchase requisition for {suggested_reorder} {medicine.unit} to prevent supply disruption."
    elif current_stock <= medicine.min_threshold:
        risk_level = "MEDIUM"
        risk_reason = f"Threshold breached: Current stock ({current_stock} {medicine.unit}) is at or below reorder threshold ({medicine.min_threshold} {medicine.unit})."
        recommended_action = f"Review weekly consumption trend and queue batch reorder for {suggested_reorder} {medicine.unit}."
    else:
        risk_level = "LOW"
        risk_reason = f"Stock healthy: Inventory covers ~{days_until_stockout} days at current usage rate ({daily_rate} {medicine.unit}/day)."
        recommended_action = "Maintain regular monitoring schedule. No immediate reorder required."

    if not has_adequate_history and daily_rate > 0.01:
        risk_reason += " (Note: Estimate calibrated on baseline facility rate due to limited consumption data)."

    return schemas.ForecastItem(
        medicine_id=medicine.id,
        medicine_name=medicine.name,
        generic_name=medicine.generic_name,
        category=medicine.category,
        facility_id=medicine.facility_id,
        current_stock=current_stock,
        unit=medicine.unit,
        avg_daily_consumption=daily_rate,
        days_until_stockout=days_until_stockout,
        forecast_7_day_demand=forecast_7_day,
        forecast_30_day_demand=forecast_30_day,
        suggested_reorder_qty=suggested_reorder,
        lead_time_days=lead_time,
        safety_buffer_units=safety_buffer,
        risk_level=risk_level,
        risk_reason=risk_reason,
        recommended_action=recommended_action,
        recent_daily_history=daily_values[-14:] if daily_values else []
    )


def generate_alerts_from_inventory(db: Session, facility_id: Optional[str] = None):
    today = date.today()
    query = db.query(models.Medicine)
    if facility_id:
        query = query.filter(models.Medicine.facility_id == facility_id)
    medicines = query.all()

    for med in medicines:
        # 1. Critical Stockout or Low stock
        if med.current_stock == 0:
            alert_id = f"ALT-ZERO-{med.id}"
            existing = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
            if not existing or existing.status == "Resolved":
                db.merge(models.Alert(
                    id=alert_id,
                    facility_id=med.facility_id,
                    category="STOCK_SHORTAGE",
                    severity="CRITICAL",
                    title=f"Stockout: {med.name}",
                    description=f"{med.name} is completely out of stock at {med.facility_id}. Immediate replenishment needed.",
                    entity_type="medicine",
                    entity_id=med.id,
                    recommended_action=f"Order emergency batch or request inter-facility transfer.",
                    status="Active"
                ))
        elif med.current_stock <= med.min_threshold:
            alert_id = f"ALT-LOW-{med.id}"
            existing = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
            if not existing:
                db.add(models.Alert(
                    id=alert_id,
                    facility_id=med.facility_id,
                    category="LOW_INVENTORY",
                    severity="CRITICAL" if med.current_stock <= (med.min_threshold * 0.5) else "WARNING",
                    title=f"Low Stock: {med.name}",
                    description=f"{med.name} stock ({med.current_stock} {med.unit}) is at or below threshold ({med.min_threshold}).",
                    entity_type="medicine",
                    entity_id=med.id,
                    recommended_action=f"Initiate restock order or check nearby facility inventory for transfer.",
                    status="Active"
                ))
        else:
            for old_id in [f"ALT-ZERO-{med.id}", f"ALT-LOW-{med.id}"]:
                old_alert = db.query(models.Alert).filter(models.Alert.id == old_id, models.Alert.status == "Active").first()
                if old_alert:
                    old_alert.status = "Resolved"

        # 2. Near-expiry check (< 60 days)
        days_to_expiry = (med.expiry_date - today).days
        if days_to_expiry < 0:
            alert_id = f"ALT-EXP-{med.id}"
            db.merge(models.Alert(
                id=alert_id,
                facility_id=med.facility_id,
                category="NEAR_EXPIRY",
                severity="CRITICAL",
                title=f"Expired Stock: {med.name}",
                description=f"{med.name} expired on {med.expiry_date} ({abs(days_to_expiry)} days ago). Quarantine remaining {med.current_stock} {med.unit}.",
                entity_type="medicine",
                entity_id=med.id,
                recommended_action="Quarantine expired batch and adjust stock with reason 'EXPIRED'.",
                status="Active"
            ))
        elif days_to_expiry <= 60:
            alert_id = f"ALT-NEAREXP-{med.id}"
            existing = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
            if not existing:
                db.add(models.Alert(
                    id=alert_id,
                    facility_id=med.facility_id,
                    category="NEAR_EXPIRY",
                    severity="WARNING",
                    title=f"Near-Expiry: {med.name}",
                    description=f"Batch {med.batch_number} of {med.name} expires in {days_to_expiry} days ({med.expiry_date}).",
                    entity_type="medicine",
                    entity_id=med.id,
                    recommended_action="Prioritize dispensing according to FIFO/FEFO rules or transfer to higher-demand facility.",
                    status="Active"
                ))

    db.commit()
