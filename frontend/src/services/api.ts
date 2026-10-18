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

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

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
      let errMsg = `Request failed: ${res.status} ${res.statusText}`;
      try {
        const errData = await res.json();
        if (errData.detail) {
          errMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
        }
      } catch {
        // use default errMsg
      }
      throw new Error(errMsg);
    }

    return await res.json();
  } catch (err: any) {
    console.warn(`[Swastik Health API] Network call to ${endpoint} failed:`, err.message);
    throw err;
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
