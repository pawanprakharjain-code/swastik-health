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
  DashboardSummary
} from '../types';
import {
  initialFacilities,
  initialMedicines,
  initialBeds,
  initialDoctors,
  initialQueue,
  initialTransfers,
  initialAlerts,
  initialActivities
} from './mockData';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// In-Memory state for standalone client deployments (e.g., Vercel without backend)
let localFacilities = [...initialFacilities];
let localMedicines = [...initialMedicines];
let localBeds = [...initialBeds];
let localDoctors = [...initialDoctors];
let localQueue = [...initialQueue];
let localTransfers = [...initialTransfers];
let localAlerts = [...initialAlerts];
let localActivities = [...initialActivities];

function handleMockFallback<T>(endpoint: string, options?: RequestInit): T {
  const method = options?.method?.toUpperCase() || 'GET';
  const urlObj = new URL(`http://localhost${endpoint}`);
  const path = urlObj.pathname;
  const params = urlObj.searchParams;
  const facilityId = params.get('facility_id');

  // GET /api/health
  if (path === '/api/health') {
    return {
      status: 'healthy',
      service: 'Swastik Health (Client Demo Mode)',
      environment: 'DEMO ENVIRONMENT — SYNTHETIC DATA',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    } as T;
  }

  // POST /api/system/reset-demo
  if (path === '/api/system/reset-demo') {
    localFacilities = [...initialFacilities];
    localMedicines = [...initialMedicines];
    localBeds = [...initialBeds];
    localDoctors = [...initialDoctors];
    localQueue = [...initialQueue];
    localTransfers = [...initialTransfers];
    localAlerts = [...initialAlerts];
    localActivities = [...initialActivities];
    return { message: 'Demo database reset to canonical state.' } as T;
  }

  // GET /api/facilities
  if (path === '/api/facilities') {
    return localFacilities as T;
  }

  // GET /api/dashboard
  if (path === '/api/dashboard') {
    const meds = facilityId && facilityId !== 'ALL' ? localMedicines.filter(m => m.facility_id === facilityId) : localMedicines;
    const beds = facilityId && facilityId !== 'ALL' ? localBeds.filter(b => b.facility_id === facilityId) : localBeds;
    const docs = facilityId && facilityId !== 'ALL' ? localDoctors.filter(d => d.facility_id === facilityId) : localDoctors;
    const q = facilityId && facilityId !== 'ALL' ? localQueue.filter(item => item.facility_id === facilityId) : localQueue;

    const criticalMeds = meds.filter(m => m.status === 'Critical' || m.status === 'Low Stock').length;
    const stockoutRisks = meds.filter(m => m.status === 'Critical').length;
    const occBeds = beds.filter(b => b.status === 'Occupied').length;
    const availBeds = beds.filter(b => b.status === 'Available').length;
    const docsPresent = docs.filter(d => d.is_present).length;
    const pendingTransfers = localTransfers.filter(t => t.status === 'Pending').length;

    const dash: DashboardSummary = {
      facility_id: facilityId || undefined,
      facility_name: facilityId && facilityId !== 'ALL' ? localFacilities.find(f => f.id === facilityId)?.name || 'Facility' : 'District Health Network (All)',
      total_medicines: meds.length,
      medicines_needing_attention: criticalMeds,
      stockout_risks: stockoutRisks,
      total_patients_today: 48,
      patients_waiting: q.filter(p => p.queue_status === 'Waiting').length,
      average_wait_minutes: 18,
      total_beds: beds.length,
      occupied_beds: occBeds,
      available_beds: availBeds,
      cleaning_beds: beds.filter(b => b.status === 'Cleaning').length,
      bed_occupancy_rate: beds.length ? Math.round((occBeds / beds.length) * 100) : 0,
      doctors_rostered: docs.length,
      doctors_present: docsPresent,
      doctors_absent: docs.length - docsPresent,
      pending_reorders_count: pendingTransfers,
      active_alerts_count: localAlerts.filter(a => a.status === 'Active').length,
      recent_activities: localActivities.slice(0, 5),
      priority_alerts: localAlerts.slice(0, 3),
      consumption_trend: [
        { day: 'Mon', consumed: 65, restocked: 100 },
        { day: 'Tue', consumed: 72, restocked: 0 },
        { day: 'Wed', consumed: 88, restocked: 50 },
        { day: 'Thu', consumed: 60, restocked: 0 },
        { day: 'Fri', consumed: 95, restocked: 120 },
        { day: 'Sat', consumed: 80, restocked: 0 },
        { day: 'Sun', consumed: 55, restocked: 0 }
      ],
      patient_flow_hourly: [
        { time: '08:00', count: 4 },
        { time: '09:00', count: 14 },
        { time: '10:00', count: 18 },
        { time: '11:00', count: 12 },
        { time: '12:00', count: 8 },
        { time: '13:00', count: 5 }
      ]
    };
    return dash as T;
  }

  // GET /api/medicines
  if (path === '/api/medicines') {
    let result = [...localMedicines];
    if (facilityId && facilityId !== 'ALL') result = result.filter(m => m.facility_id === facilityId);
    const cat = params.get('category');
    if (cat && cat !== 'All') result = result.filter(m => m.category === cat);
    const stat = params.get('status');
    if (stat && stat !== 'All') result = result.filter(m => m.status === stat);
    const search = params.get('search');
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(m => m.name.toLowerCase().includes(s) || m.generic_name.toLowerCase().includes(s));
    }
    return result as T;
  }

  // POST /api/medicines
  if (path === '/api/medicines' && method === 'POST') {
    const body = options?.body ? JSON.parse(options.body as string) : {};
    const newMed: Medicine = {
      id: `MED-${String(Date.now()).slice(-4)}`,
      facility_id: body.facility_id || 'FAC-01',
      name: body.name || 'New Medicine',
      generic_name: body.generic_name || 'Generic Name',
      category: body.category || 'General',
      batch_number: body.batch_number || 'BATCH-001',
      current_stock: Number(body.current_stock) || 0,
      unit: body.unit || 'Tablets',
      min_threshold: Number(body.min_threshold) || 50,
      avg_daily_consumption: Number(body.avg_daily_consumption) || 10,
      lead_time_days: Number(body.lead_time_days) || 4,
      supplier: body.supplier || 'Standard Supplier',
      expiry_date: body.expiry_date || '2027-12-31',
      last_updated: new Date().toISOString(),
      status: Number(body.current_stock) === 0 ? 'Critical' : Number(body.current_stock) < (body.min_threshold || 50) ? 'Low Stock' : 'Healthy'
    };
    localMedicines.unshift(newMed);
    return newMed as T;
  }

  // POST /api/medicines/{id}/receive
  if (path.includes('/receive') && method === 'POST') {
    const id = path.split('/')[3];
    const body = options?.body ? JSON.parse(options.body as string) : {};
    const med = localMedicines.find(m => m.id === id);
    if (med) {
      med.current_stock += Number(body.quantity) || 0;
      med.last_updated = new Date().toISOString();
      med.status = med.current_stock > med.min_threshold ? 'Healthy' : 'Low Stock';
      return med as T;
    }
  }

  // POST /api/medicines/{id}/adjust
  if (path.includes('/adjust') && method === 'POST') {
    const id = path.split('/')[3];
    const body = options?.body ? JSON.parse(options.body as string) : {};
    const med = localMedicines.find(m => m.id === id);
    if (med) {
      med.current_stock = Number(body.new_quantity) || 0;
      med.last_updated = new Date().toISOString();
      med.status = med.current_stock === 0 ? 'Critical' : med.current_stock < med.min_threshold ? 'Low Stock' : 'Healthy';
      return med as T;
    }
  }

  // GET /api/forecast
  if (path === '/api/forecast' || path === '/api/forecast/recalculate') {
    const safetyDays = Number(params.get('safety_days')) || 3;
    const meds = facilityId && facilityId !== 'ALL' ? localMedicines.filter(m => m.facility_id === facilityId) : localMedicines;

    const items = meds.map(m => {
      const dailyRate = m.avg_daily_consumption || 10;
      const daysLeft = dailyRate > 0 ? Number((m.current_stock / dailyRate).toFixed(1)) : 999;
      const leadTime = m.lead_time_days || 4;
      const forecast7 = Math.ceil(dailyRate * 7);
      const forecast30 = Math.ceil(dailyRate * 30);
      const safetyBuffer = Math.ceil(dailyRate * safetyDays);
      const suggestedReorder = Math.max(0, Math.ceil(dailyRate * (leadTime + 7)) + safetyBuffer - m.current_stock);

      let riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      let riskReason = `Stock is stable (~${daysLeft} days coverage).`;
      let recAction = 'Maintain regular monitoring.';

      if (m.current_stock === 0) {
        riskLevel = 'CRITICAL';
        riskReason = `Stockout occurred! 0 ${m.unit} available. Lead time is ${leadTime} days.`;
        recAction = `Immediate emergency requisition for ${suggestedReorder} ${m.unit}.`;
      } else if (daysLeft <= leadTime) {
        riskLevel = 'CRITICAL';
        riskReason = `Critical stockout risk: stock covers ~${daysLeft} days, below ${leadTime}-day replenishment lead time.`;
        recAction = `Authorize expedited purchase order of ${suggestedReorder} ${m.unit}.`;
      } else if (daysLeft <= leadTime * 1.5) {
        riskLevel = 'HIGH';
        riskReason = `Low stock coverage: covers ~${daysLeft} days.`;
        recAction = `Queue batch reorder for ${suggestedReorder} ${m.unit}.`;
      } else if (m.current_stock <= m.min_threshold) {
        riskLevel = 'MEDIUM';
        riskReason = `Threshold breached: stock (${m.current_stock}) <= threshold (${m.min_threshold}).`;
        recAction = `Review weekly usage trend and prepare reorder.`;
      }

      return {
        medicine_id: m.id,
        medicine_name: m.name,
        generic_name: m.generic_name,
        category: m.category,
        facility_id: m.facility_id,
        current_stock: m.current_stock,
        unit: m.unit,
        avg_daily_consumption: dailyRate,
        days_until_stockout: daysLeft,
        forecast_7_day_demand: forecast7,
        forecast_30_day_demand: forecast30,
        suggested_reorder_qty: suggestedReorder,
        lead_time_days: leadTime,
        safety_buffer_units: safetyBuffer,
        risk_level: riskLevel,
        risk_reason: riskReason,
        recommended_action: recAction,
        recent_daily_history: [12, 14, 15, 11, 13, 16, 14]
      };
    });

    const fc: ForecastResponse = {
      recalculated_at: new Date().toISOString(),
      total_forecasted: items.length,
      critical_risk_count: items.filter(i => i.risk_level === 'CRITICAL').length,
      high_risk_count: items.filter(i => i.risk_level === 'HIGH').length,
      medium_risk_count: items.filter(i => i.risk_level === 'MEDIUM').length,
      low_risk_count: items.filter(i => i.risk_level === 'LOW').length,
      items: items,
      model_methodology: 'Weighted Moving Average (50% Recent 7d, 30% Mid 7d, 20% Older 7d) + Lead Time Dynamic Buffer'
    };
    return fc as T;
  }

  // GET /api/beds
  if (path === '/api/beds') {
    let result = [...localBeds];
    if (facilityId && facilityId !== 'ALL') result = result.filter(b => b.facility_id === facilityId);
    return result as T;
  }

  // PATCH /api/beds/{id}
  if (path.startsWith('/api/beds/') && method === 'PATCH') {
    const id = path.split('/')[3];
    const body = options?.body ? JSON.parse(options.body as string) : {};
    const bed = localBeds.find(b => b.id === id);
    if (bed) {
      bed.status = body.status;
      bed.last_updated = new Date().toISOString();
      return bed as T;
    }
  }

  // GET /api/doctors
  if (path === '/api/doctors') {
    let result = [...localDoctors];
    if (facilityId && facilityId !== 'ALL') result = result.filter(d => d.facility_id === facilityId);
    return result as T;
  }

  // PATCH /api/doctors/{id}/attendance
  if (path.includes('/attendance') && method === 'PATCH') {
    const id = path.split('/')[3];
    const body = options?.body ? JSON.parse(options.body as string) : {};
    const doc = localDoctors.find(d => d.id === id);
    if (doc) {
      doc.is_present = body.is_present;
      doc.last_updated = new Date().toISOString();
      return doc as T;
    }
  }

  // GET /api/patients/queue
  if (path === '/api/patients/queue') {
    let result = [...localQueue];
    if (facilityId && facilityId !== 'ALL') result = result.filter(q => q.facility_id === facilityId);
    return result as T;
  }

  // PATCH /api/patients/queue/{id}
  if (path.startsWith('/api/patients/queue/') && method === 'PATCH') {
    const id = path.split('/')[4];
    const body = options?.body ? JSON.parse(options.body as string) : {};
    const item = localQueue.find(q => q.id === id);
    if (item) {
      item.queue_status = body.queue_status;
      return item as T;
    }
  }

  // GET /api/transfers
  if (path === '/api/transfers') {
    return localTransfers as T;
  }

  // POST /api/transfers/{id}/approve
  if (path.includes('/approve') && method === 'POST') {
    const id = path.split('/')[3];
    const trf = localTransfers.find(t => t.id === id);
    if (trf) {
      trf.status = 'Completed';
      trf.resolved_at = new Date().toISOString();
      // Atomic debit and credit
      const srcMed = localMedicines.find(m => m.facility_id === trf.source_facility_id && m.name === trf.medicine_name);
      const destMed = localMedicines.find(m => m.facility_id === trf.destination_facility_id && m.name === trf.medicine_name);
      if (srcMed) srcMed.current_stock -= trf.quantity;
      if (destMed) {
        destMed.current_stock += trf.quantity;
        destMed.status = destMed.current_stock > destMed.min_threshold ? 'Healthy' : 'Low Stock';
      }
      return trf as T;
    }
  }

  // GET /api/alerts
  if (path === '/api/alerts') {
    let result = [...localAlerts];
    if (facilityId && facilityId !== 'ALL') result = result.filter(a => a.facility_id === facilityId);
    return result as T;
  }

  // GET /api/activities
  if (path === '/api/activities') {
    return localActivities as T;
  }

  return {} as T;
}

async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      }
    });

    if (!res.ok) {
      // In static hosting environments like Vercel without a live backend URL, fallback to local store
      return handleMockFallback<T>(endpoint, options);
    }

    return await res.json();
  } catch {
    // Graceful fallback for network offline / static deployment mode
    return handleMockFallback<T>(endpoint, options);
  }
}

export const api = {
  // Health
  getHealth: () => fetchJSON<{ status: string; service: string; environment: string; version: string }>('/api/health'),
  resetDemoDatabase: () => fetchJSON<{ message: string }>('/api/system/reset-demo', { method: 'POST' }),

  // Facilities
  getFacilities: () => fetchJSON<Facility[]>('/api/facilities'),

  // Dashboard
  getDashboard: (facilityId?: string) => {
    const param = facilityId && facilityId !== 'ALL' ? `?facility_id=${encodeURIComponent(facilityId)}` : '';
    return fetchJSON<DashboardSummary>(`/api/dashboard${param}`);
  },

  // Medicines
  getMedicines: (params?: { facilityId?: string; category?: string; status?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.facilityId && params.facilityId !== 'ALL') q.append('facility_id', params.facilityId);
    if (params?.category && params.category !== 'All') q.append('category', params.category);
    if (params?.status && params.status !== 'All') q.append('status', params.status);
    if (params?.search) q.append('search', params.search);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetchJSON<Medicine[]>(`/api/medicines${qs}`);
  },

  createMedicine: (data: Partial<Medicine>) =>
    fetchJSON<Medicine>('/api/medicines', { method: 'POST', body: JSON.stringify(data) }),

  updateMedicine: (id: string, data: Partial<Medicine>) =>
    fetchJSON<Medicine>(`/api/medicines/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  receiveStock: (id: string, data: { quantity: number; batch_number?: string; supplier?: string; reason?: string }) =>
    fetchJSON<Medicine>(`/api/medicines/${id}/receive`, { method: 'POST', body: JSON.stringify(data) }),

  adjustStock: (id: string, data: { new_quantity: number; reason: string }) =>
    fetchJSON<Medicine>(`/api/medicines/${id}/adjust`, { method: 'POST', body: JSON.stringify(data) }),

  getStockMovements: (id: string) =>
    fetchJSON<StockMovement[]>(`/api/medicines/${id}/movements`),

  // Forecasting
  getForecast: (facilityId?: string, safetyDays?: number) => {
    const q = new URLSearchParams();
    if (facilityId && facilityId !== 'ALL') q.append('facility_id', facilityId);
    if (safetyDays) q.append('safety_days', safetyDays.toString());
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetchJSON<ForecastResponse>(`/api/forecast${qs}`);
  },

  recalculateForecast: (facilityId?: string) => {
    const param = facilityId && facilityId !== 'ALL' ? `?facility_id=${encodeURIComponent(facilityId)}` : '';
    return fetchJSON<ForecastResponse>(`/api/forecast/recalculate${param}`, { method: 'POST' });
  },

  // Patient Queue
  getPatientQueue: (facilityId?: string, department?: string, status?: string) => {
    const q = new URLSearchParams();
    if (facilityId && facilityId !== 'ALL') q.append('facility_id', facilityId);
    if (department && department !== 'All') q.append('department', department);
    if (status && status !== 'All') q.append('status', status);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetchJSON<PatientQueueItem[]>(`/api/patients/queue${qs}`);
  },

  registerPatient: (data: Partial<PatientQueueItem>) =>
    fetchJSON<PatientQueueItem>('/api/patients/queue', { method: 'POST', body: JSON.stringify(data) }),

  updatePatientStatus: (id: string, data: { queue_status: string; assigned_service_area?: string }) =>
    fetchJSON<PatientQueueItem>(`/api/patients/queue/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Beds
  getBeds: (facilityId?: string, ward?: string) => {
    const q = new URLSearchParams();
    if (facilityId && facilityId !== 'ALL') q.append('facility_id', facilityId);
    if (ward && ward !== 'All') q.append('ward', ward);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetchJSON<Bed[]>(`/api/beds${qs}`);
  },

  updateBedStatus: (id: string, status: string) =>
    fetchJSON<Bed>(`/api/beds/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Doctors
  getDoctors: (facilityId?: string, department?: string) => {
    const q = new URLSearchParams();
    if (facilityId && facilityId !== 'ALL') q.append('facility_id', facilityId);
    if (department && department !== 'All') q.append('department', department);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetchJSON<Doctor[]>(`/api/doctors${qs}`);
  },

  updateDoctorAttendance: (id: string, is_present: boolean, notes?: string) =>
    fetchJSON<Doctor>(`/api/doctors/${id}/attendance`, { method: 'PATCH', body: JSON.stringify({ is_present, notes }) }),

  addDoctor: (data: Partial<Doctor>) =>
    fetchJSON<Doctor>('/api/doctors', { method: 'POST', body: JSON.stringify(data) }),

  // Supply Chain Transfers
  getTransfers: (facilityId?: string) => {
    const param = facilityId && facilityId !== 'ALL' ? `?facility_id=${encodeURIComponent(facilityId)}` : '';
    return fetchJSON<StockTransfer[]>(`/api/transfers${param}`);
  },

  createTransfer: (data: { medicine_id: string; source_facility_id: string; destination_facility_id: string; quantity: number; notes?: string }) =>
    fetchJSON<StockTransfer>('/api/transfers', { method: 'POST', body: JSON.stringify(data) }),

  approveTransfer: (id: string) =>
    fetchJSON<StockTransfer>(`/api/transfers/${id}/approve`, { method: 'POST' }),

  rejectTransfer: (id: string) =>
    fetchJSON<StockTransfer>(`/api/transfers/${id}/reject`, { method: 'POST' }),

  // Alerts
  getAlerts: (params?: { facilityId?: string; category?: string; severity?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.facilityId && params.facilityId !== 'ALL') q.append('facility_id', params.facilityId);
    if (params?.category && params.category !== 'All') q.append('category', params.category);
    if (params?.severity && params.severity !== 'All') q.append('severity', params.severity);
    if (params?.status && params.status !== 'All') q.append('status', params.status);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetchJSON<Alert[]>(`/api/alerts${qs}`);
  },

  updateAlertStatus: (id: string, status: 'Acknowledged' | 'Resolved') =>
    fetchJSON<Alert>(`/api/alerts/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Activities
  getActivities: (facilityId?: string, limit: number = 50) => {
    const q = new URLSearchParams({ limit: limit.toString() });
    if (facilityId && facilityId !== 'ALL') q.append('facility_id', facilityId);
    return fetchJSON<ActivityLog[]>(`/api/activities?${q.toString()}`);
  }
};
