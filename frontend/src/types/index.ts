export interface Facility {
  id: string;
  name: string;
  facility_type: string;
  district: string;
  state: string;
  contact_phone: string;
  total_beds: number;
  created_at: string;
}

export interface Medicine {
  id: string;
  facility_id: string;
  name: string;
  generic_name: string;
  category: string;
  batch_number: string;
  current_stock: number;
  unit: string;
  min_threshold: number;
  avg_daily_consumption: number;
  lead_time_days: number;
  supplier: string;
  expiry_date: string;
  last_updated: string;
  status: 'Critical' | 'Low Stock' | 'Watch' | 'Healthy' | 'Expired' | 'Near Expiry';
  days_until_stockout?: number;
  is_near_expiry?: boolean;
}

export interface StockMovement {
  id: number;
  medicine_id: string;
  facility_id: string;
  movement_type: 'RECEIPT' | 'ISSUE' | 'ADJUSTMENT' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  reference_id?: string;
  timestamp: string;
}

export interface PatientQueueItem {
  id: string;
  token: string;
  facility_id: string;
  department: string;
  arrival_time: string;
  queue_status: 'Waiting' | 'In Consultation' | 'Completed';
  priority: 'Routine' | 'Urgent' | 'Emergency';
  assigned_service_area: string;
  estimated_wait_minutes: number;
  completed_time?: string;
}

export interface Bed {
  id: string;
  facility_id: string;
  bed_number: string;
  ward: string;
  status: 'Available' | 'Occupied' | 'Cleaning' | 'Out of service';
  last_updated: string;
}

export interface Doctor {
  id: string;
  facility_id: string;
  name: string;
  department: string;
  shift: string;
  is_present: boolean;
  notes?: string;
  last_updated: string;
}

export interface StockTransfer {
  id: string;
  medicine_id: string;
  medicine_name: string;
  source_facility_id: string;
  source_facility_name?: string;
  destination_facility_id: string;
  destination_facility_name?: string;
  quantity: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  notes?: string;
  requested_by: string;
  approved_by?: string;
  created_at: string;
  resolved_at?: string;
}

export interface Alert {
  id: string;
  facility_id: string;
  facility_name?: string;
  category: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  entity_type?: string;
  entity_id?: string;
  recommended_action: string;
  status: 'Active' | 'Acknowledged' | 'Resolved';
  created_at: string;
  resolved_at?: string;
}

export interface ActivityLog {
  id: number;
  facility_id?: string;
  action_type: string;
  description: string;
  user_role: string;
  timestamp: string;
}

export interface ForecastItem {
  medicine_id: string;
  medicine_name: string;
  generic_name: string;
  category: string;
  facility_id: string;
  current_stock: number;
  unit: string;
  avg_daily_consumption: number;
  days_until_stockout: number;
  forecast_7_day_demand: number;
  forecast_30_day_demand: number;
  suggested_reorder_qty: number;
  lead_time_days: number;
  safety_buffer_units: number;
  risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  risk_reason: string;
  recommended_action: string;
  recent_daily_history: number[];
}

export interface ForecastResponse {
  recalculated_at: string;
  total_forecasted: number;
  critical_risk_count: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  items: ForecastItem[];
  model_methodology: string;
}

export interface DashboardSummary {
  facility_id?: string;
  facility_name: string;
  total_medicines: number;
  medicines_needing_attention: number;
  stockout_risks: number;
  total_patients_today: number;
  patients_waiting: number;
  average_wait_minutes: number;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  cleaning_beds: number;
  bed_occupancy_rate: number;
  doctors_rostered: number;
  doctors_present: number;
  doctors_absent: number;
  pending_reorders_count: number;
  active_alerts_count: number;
  recent_activities: ActivityLog[];
  priority_alerts: Alert[];
  consumption_trend: { day: string; consumed: number; restocked: number }[];
  patient_flow_hourly: { time: string; count: number }[];
}
