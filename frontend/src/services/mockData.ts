import {
  Facility,
  Medicine,
  StockMovement,
  PatientQueueItem,
  Bed,
  Doctor,
  StockTransfer,
  Alert,
  ActivityLog,
  ForecastResponse,
  ForecastItem,
  DashboardSummary
} from '../types';

export const initialFacilities: Facility[] = [
  {
    id: 'FAC-01',
    name: 'PHC Ramgarh',
    facility_type: 'Primary Health Centre',
    district: 'Greenfield Rural',
    state: 'Demo State',
    contact_phone: '+91 98765 11001',
    total_beds: 20,
    created_at: new Date().toISOString()
  },
  {
    id: 'FAC-02',
    name: 'CHC Balrampur',
    facility_type: 'Community Health Centre',
    district: 'Greenfield Central',
    state: 'Demo State',
    contact_phone: '+91 98765 22002',
    total_beds: 40,
    created_at: new Date().toISOString()
  },
  {
    id: 'FAC-03',
    name: 'District Hospital Greenfield',
    facility_type: 'District Hospital',
    district: 'Greenfield Metro',
    state: 'Demo State',
    contact_phone: '+91 98765 33003',
    total_beds: 100,
    created_at: new Date().toISOString()
  },
  {
    id: 'FAC-04',
    name: 'PHC Shivpuri',
    facility_type: 'Primary Health Centre',
    district: 'Greenfield North',
    state: 'Demo State',
    contact_phone: '+91 98765 44004',
    total_beds: 15,
    created_at: new Date().toISOString()
  }
];

export const initialMedicines: Medicine[] = [
  {
    id: 'MED-001',
    facility_id: 'FAC-01',
    name: 'Paracetamol 500 mg',
    generic_name: 'Acetaminophen',
    category: 'Analgesic & Antipyretic',
    batch_number: 'PCM-2026-A1',
    current_stock: 420,
    unit: 'Tablets',
    min_threshold: 120,
    avg_daily_consumption: 35.0,
    lead_time_days: 4,
    supplier: 'State Medical Supply Corp',
    expiry_date: '2027-11-20',
    last_updated: new Date().toISOString(),
    status: 'Healthy',
    days_until_stockout: 12.0
  },
  {
    id: 'MED-002',
    facility_id: 'FAC-01',
    name: 'Amoxicillin 500 mg',
    generic_name: 'Amoxicillin Trihydrate',
    category: 'Antibiotic',
    batch_number: 'AMX-2026-B4',
    current_stock: 24,
    unit: 'Capsules',
    min_threshold: 80,
    avg_daily_consumption: 14.0,
    lead_time_days: 5,
    supplier: 'National Essential Pharma',
    expiry_date: '2027-07-25',
    last_updated: new Date().toISOString(),
    status: 'Critical',
    days_until_stockout: 1.7
  },
  {
    id: 'MED-003',
    facility_id: 'FAC-01',
    name: 'ORS Powder Sachets',
    generic_name: 'Oral Rehydration Salts',
    category: 'Electrolyte & Rehydration',
    batch_number: 'ORS-2026-C9',
    current_stock: 180,
    unit: 'Sachets',
    min_threshold: 60,
    avg_daily_consumption: 18.0,
    lead_time_days: 3,
    supplier: 'Apex Healthcare Ltd',
    expiry_date: new Date(Date.now() + 22 * 86400000).toISOString().slice(0, 10),
    last_updated: new Date().toISOString(),
    status: 'Near Expiry',
    days_until_stockout: 10.0,
    is_near_expiry: true
  },
  {
    id: 'MED-004',
    facility_id: 'FAC-01',
    name: 'Azithromycin 250 mg',
    generic_name: 'Azithromycin',
    category: 'Antibiotic',
    batch_number: 'AZT-2026-D2',
    current_stock: 0,
    unit: 'Tablets',
    min_threshold: 50,
    avg_daily_consumption: 10.0,
    lead_time_days: 4,
    supplier: 'Apex Healthcare Ltd',
    expiry_date: '2027-09-01',
    last_updated: new Date().toISOString(),
    status: 'Critical',
    days_until_stockout: 0
  },
  {
    id: 'MED-005',
    facility_id: 'FAC-01',
    name: 'Metformin 500 mg',
    generic_name: 'Metformin Hydrochloride',
    category: 'Antidiabetic',
    batch_number: 'MET-2026-E5',
    current_stock: 70,
    unit: 'Tablets',
    min_threshold: 75,
    avg_daily_consumption: 15.0,
    lead_time_days: 4,
    supplier: 'State Medical Supply Corp',
    expiry_date: '2027-10-15',
    last_updated: new Date().toISOString(),
    status: 'Low Stock',
    days_until_stockout: 4.7
  },
  {
    id: 'MED-006',
    facility_id: 'FAC-01',
    name: 'Cetirizine 10 mg',
    generic_name: 'Cetirizine Dihydrochloride',
    category: 'Antihistamine',
    batch_number: 'CTZ-2026-F1',
    current_stock: 310,
    unit: 'Tablets',
    min_threshold: 80,
    avg_daily_consumption: 12.0,
    lead_time_days: 3,
    supplier: 'National Essential Pharma',
    expiry_date: '2028-02-28',
    last_updated: new Date().toISOString(),
    status: 'Healthy',
    days_until_stockout: 25.8
  },
  {
    id: 'MED-007',
    facility_id: 'FAC-01',
    name: 'Salbutamol Inhaler 100 mcg',
    generic_name: 'Albuterol / Salbutamol',
    category: 'Respiratory Bronchodilator',
    batch_number: 'SLB-2026-G3',
    current_stock: 18,
    unit: 'Canisters',
    min_threshold: 30,
    avg_daily_consumption: 4.5,
    lead_time_days: 6,
    supplier: 'National Essential Pharma',
    expiry_date: '2027-05-10',
    last_updated: new Date().toISOString(),
    status: 'Low Stock',
    days_until_stockout: 4.0
  },
  {
    id: 'MED-002-CHC',
    facility_id: 'FAC-02',
    name: 'Amoxicillin 500 mg',
    generic_name: 'Amoxicillin Trihydrate',
    category: 'Antibiotic',
    batch_number: 'AMX-2026-B8',
    current_stock: 450,
    unit: 'Capsules',
    min_threshold: 100,
    avg_daily_consumption: 20.0,
    lead_time_days: 5,
    supplier: 'National Essential Pharma',
    expiry_date: '2027-07-25',
    last_updated: new Date().toISOString(),
    status: 'Healthy',
    days_until_stockout: 22.5
  }
];

export const initialBeds: Bed[] = [
  { id: 'BED-101', facility_id: 'FAC-01', bed_number: 'GW-01', ward: 'General Ward', status: 'Available', last_updated: new Date().toISOString() },
  { id: 'BED-102', facility_id: 'FAC-01', bed_number: 'GW-02', ward: 'General Ward', status: 'Occupied', last_updated: new Date().toISOString() },
  { id: 'BED-103', facility_id: 'FAC-01', bed_number: 'GW-03', ward: 'General Ward', status: 'Available', last_updated: new Date().toISOString() },
  { id: 'BED-104', facility_id: 'FAC-01', bed_number: 'GW-04', ward: 'General Ward', status: 'Cleaning', last_updated: new Date().toISOString() },
  { id: 'BED-105', facility_id: 'FAC-01', bed_number: 'GW-05', ward: 'General Ward', status: 'Available', last_updated: new Date().toISOString() },
  { id: 'BED-106', facility_id: 'FAC-01', bed_number: 'GW-06', ward: 'General Ward', status: 'Occupied', last_updated: new Date().toISOString() },
  { id: 'BED-107', facility_id: 'FAC-01', bed_number: 'EM-01', ward: 'Emergency Ward', status: 'Occupied', last_updated: new Date().toISOString() },
  { id: 'BED-108', facility_id: 'FAC-01', bed_number: 'EM-02', ward: 'Emergency Ward', status: 'Available', last_updated: new Date().toISOString() },
  { id: 'BED-109', facility_id: 'FAC-01', bed_number: 'ICU-01', ward: 'ICU', status: 'Occupied', last_updated: new Date().toISOString() },
  { id: 'BED-110', facility_id: 'FAC-01', bed_number: 'ICU-02', ward: 'ICU', status: 'Available', last_updated: new Date().toISOString() }
];

export const initialDoctors: Doctor[] = [
  { id: 'DOC-01', facility_id: 'FAC-01', name: 'Dr. Ramesh Sharma', department: 'General Medicine', shift: 'Morning (08:00–14:00)', is_present: true, last_updated: new Date().toISOString() },
  { id: 'DOC-02', facility_id: 'FAC-01', name: 'Dr. Sunita Patel', department: 'Pediatrics', shift: 'Morning (08:00–14:00)', is_present: true, last_updated: new Date().toISOString() },
  { id: 'DOC-03', facility_id: 'FAC-01', name: 'Dr. Arvind Verma', department: 'Emergency Care', shift: 'Evening (14:00–20:00)', is_present: false, last_updated: new Date().toISOString() },
  { id: 'DOC-04', facility_id: 'FAC-01', name: 'Dr. Meera Joshi', department: 'Obstetrics & Gynecology', shift: 'Morning (08:00–14:00)', is_present: true, last_updated: new Date().toISOString() },
  { id: 'DOC-05', facility_id: 'FAC-01', name: 'Dr. Vikas Kumar', department: 'General Surgery', shift: 'Night (20:00–08:00)', is_present: false, last_updated: new Date().toISOString() }
];

export const initialQueue: PatientQueueItem[] = [
  { id: 'Q-01', token: 'T-1021', facility_id: 'FAC-01', department: 'General OPD', arrival_time: '09:15 AM', queue_status: 'Waiting', priority: 'Routine', assigned_service_area: 'Room 101', estimated_wait_minutes: 15 },
  { id: 'Q-02', token: 'T-1022', facility_id: 'FAC-01', department: 'Pediatrics', arrival_time: '09:25 AM', queue_status: 'In Consultation', priority: 'Urgent', assigned_service_area: 'Room 103', estimated_wait_minutes: 5 },
  { id: 'Q-03', token: 'T-1023', facility_id: 'FAC-01', department: 'Emergency', arrival_time: '09:40 AM', queue_status: 'In Consultation', priority: 'Emergency', assigned_service_area: 'Trauma Bay 1', estimated_wait_minutes: 0 },
  { id: 'Q-04', token: 'T-1024', facility_id: 'FAC-01', department: 'General OPD', arrival_time: '09:48 AM', queue_status: 'Waiting', priority: 'Routine', assigned_service_area: 'Room 101', estimated_wait_minutes: 25 },
  { id: 'Q-05', token: 'T-1025', facility_id: 'FAC-01', department: 'General OPD', arrival_time: '08:50 AM', queue_status: 'Completed', priority: 'Routine', assigned_service_area: 'Room 102', estimated_wait_minutes: 0, completed_time: '09:30 AM' }
];

export const initialTransfers: StockTransfer[] = [
  {
    id: 'TRF-1001',
    medicine_id: 'MED-002',
    medicine_name: 'Amoxicillin 500 mg',
    source_facility_id: 'FAC-02',
    source_facility_name: 'CHC Balrampur',
    destination_facility_id: 'FAC-01',
    destination_facility_name: 'PHC Ramgarh',
    quantity: 50,
    status: 'Pending',
    notes: 'Emergency shortage reallocation authorized by District Supply Officer',
    requested_by: 'PHC Pharmacist',
    created_at: new Date(Date.now() - 3600000).toISOString()
  }
];

export const initialAlerts: Alert[] = [
  {
    id: 'ALT-01',
    facility_id: 'FAC-01',
    facility_name: 'PHC Ramgarh',
    category: 'Inventory',
    severity: 'CRITICAL',
    title: 'Stockout Detected: Azithromycin 250 mg',
    description: 'Current stock is 0 Tablets. Replenishment lead time is 4 days.',
    recommended_action: 'Initiate emergency inter-facility transfer from District Hospital Greenfield.',
    status: 'Active',
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'ALT-02',
    facility_id: 'FAC-01',
    facility_name: 'PHC Ramgarh',
    category: 'Inventory',
    severity: 'CRITICAL',
    title: 'Imminent Stockout Risk: Amoxicillin 500 mg',
    description: 'Stock of 24 Capsules covers ~1.7 days, below 5-day supplier lead time.',
    recommended_action: 'Authorize pending transfer TRF-1001 from CHC Balrampur.',
    status: 'Active',
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'ALT-03',
    facility_id: 'FAC-01',
    facility_name: 'PHC Ramgarh',
    category: 'Inventory',
    severity: 'WARNING',
    title: 'Near-Expiry Batch: ORS Powder Sachets',
    description: 'Batch ORS-2026-C9 (180 Sachets) expires in 22 days.',
    recommended_action: 'Prioritize dispensing or initiate redistribution to high-volume center.',
    status: 'Active',
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

export const initialActivities: ActivityLog[] = [
  { id: 1, facility_id: 'FAC-01', action_type: 'Transfer Requested', description: 'Requisition TRF-1001 created for 50 units Amoxicillin 500mg from CHC Balrampur', user_role: 'District Officer', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 2, facility_id: 'FAC-01', action_type: 'Stock Dispensed', description: 'Dispensed 10 tablets Paracetamol 500mg to Patient T-1025', user_role: 'Pharmacist', timestamp: new Date(Date.now() - 5400000).toISOString() },
  { id: 3, facility_id: 'FAC-01', action_type: 'Doctor Checked In', description: 'Dr. Sunita Patel marked ON DUTY in Pediatrics', user_role: 'Staff Coordinator', timestamp: new Date(Date.now() - 14400000).toISOString() }
];
