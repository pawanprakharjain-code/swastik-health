import React, { useState } from 'react';
import {
  Users,
  Plus,
  Clock,
  CheckCircle,
  ArrowRight,
  Filter,
  AlertCircle,
  ShieldCheck,
  Building
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { PatientQueueItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';

interface PatientFlowPageProps {
  queue: PatientQueueItem[];
  onRegisterPatient: (data: Partial<PatientQueueItem>) => Promise<void>;
  onUpdateStatus: (id: string, status: 'Waiting' | 'In Consultation' | 'Completed') => Promise<void>;
  selectedFacility: string;
}

export const PatientFlowPage: React.FC<PatientFlowPageProps> = ({
  queue,
  onRegisterPatient,
  onUpdateStatus,
  selectedFacility
}) => {
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const [registerForm, setRegisterForm] = useState<{
    department: string;
    priority: 'Routine' | 'Urgent' | 'Emergency';
    assigned_service_area: string;
  }>({
    department: 'General OPD',
    priority: 'Routine',
    assigned_service_area: 'OPD Room 1'
  });

  const departments = ['All', 'General OPD', 'Emergency', 'Paediatrics', 'Gynaecology & Obstetrics', 'Dental'];

  const filteredQueue = queue.filter((p) => {
    const matchesDept = departmentFilter === 'All' || p.department === departmentFilter;
    const matchesStatus = statusFilter === 'All' || p.queue_status === statusFilter;
    return matchesDept && matchesStatus;
  });

  const waitingCount = queue.filter((p) => p.queue_status === 'Waiting').length;
  const inConsultCount = queue.filter((p) => p.queue_status === 'In Consultation').length;
  const completedCount = queue.filter((p) => p.queue_status === 'Completed').length;
  const avgWait = Math.round(
    queue.reduce((acc, p) => acc + p.estimated_wait_minutes, 0) / Math.max(1, queue.length)
  );

  const hourlyData = [
    { hour: '08:00', arrivals: 12 },
    { hour: '09:00', arrivals: 26 },
    { hour: '10:00', arrivals: 38 },
    { hour: '11:00', arrivals: 34 },
    { hour: '12:00', arrivals: 22 },
    { hour: '13:00', arrivals: 14 },
    { hour: '14:00', arrivals: 19 },
    { hour: '15:00', arrivals: 25 },
    { hour: '16:00', arrivals: 18 }
  ];

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onRegisterPatient({
      ...registerForm,
      facility_id: selectedFacility === 'ALL' ? 'FAC-01' : selectedFacility
    });
    setIsRegisterOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Patient Queue & Flow Management
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Anonymous Tokens
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time queue tracking and wait-time estimation. Anonymous demonstration tokens only.
          </p>
        </div>

        <button
          onClick={() => setIsRegisterOpen(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Token</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patients Waiting</span>
          <div className="text-3xl font-black text-amber-600 mt-2">{waitingCount}</div>
          <p className="text-xs text-slate-500 mt-1">Awaiting clinician consultation</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Consultation</span>
          <div className="text-3xl font-black text-blue-600 mt-2">{inConsultCount}</div>
          <p className="text-xs text-slate-500 mt-1">Active doctor examinations</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Consultations Completed</span>
          <div className="text-3xl font-black text-emerald-600 mt-2">{completedCount}</div>
          <p className="text-xs text-slate-500 mt-1">Dispensed & discharged today</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Wait Time</span>
          <div className="text-3xl font-black text-slate-900 mt-2">~{avgWait} min</div>
          <p className="text-xs text-slate-500 mt-1">Calibrated from queue depth</p>
        </div>
      </div>

      {/* Hourly Flow Chart & Notice */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Hourly Patient Arrival Curve</h3>
              <p className="text-xs text-slate-500">Peak arrival hours identify staffing bottlenecks</p>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
              Peak: 10:00 - 11:00
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorArrivals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0e9f8e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0e9f8e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#101b2d',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="arrivals" stroke="#0e9f8e" strokeWidth={2} fillOpacity={1} fill="url(#colorArrivals)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Clinical Safety & Privacy Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-teal-700 font-bold text-sm mb-2">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              <span>Privacy & Synthetic Guarantee</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              In accordance with ethical healthcare standards, this demonstration platform uses <strong>strictly anonymized tokens</strong> (e.g. T-1021). No names, telephone numbers, Aadhaar numbers, or medical records are stored.
            </p>
            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 font-medium">
              ⚠️ Triage priority remains solely with certified clinical officers. SehatFlow does not provide autonomous diagnostic decisions.
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
            Average consultation duration: ~12 minutes
          </div>
        </div>
      </div>

      {/* Filter and Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Queue Filters:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d === 'All' ? 'All Departments' : d}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Queue Statuses</option>
              <option value="Waiting">Waiting</option>
              <option value="In Consultation">In Consultation</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <span className="text-xs font-bold text-slate-500">
            {filteredQueue.length} demonstration tokens listed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">Token #</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Service Room</th>
                <th className="py-3 px-4">Arrival Time</th>
                <th className="py-3 px-4">Priority Level</th>
                <th className="py-3 px-4">Estimated Wait</th>
                <th className="py-3 px-4">Queue Status</th>
                <th className="py-3 px-4 text-right">Advance Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQueue.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                    {item.token}
                  </td>

                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {item.department}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-600">
                    {item.assigned_service_area}
                  </td>

                  <td className="py-3.5 px-4 text-slate-500">
                    {new Date(item.arrival_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </td>

                  <td className="py-3.5 px-4">
                    <StatusBadge status={item.priority} size="sm" />
                  </td>

                  <td className="py-3.5 px-4 font-bold text-slate-700">
                    {item.queue_status === 'Completed' ? '-' : `~${item.estimated_wait_minutes} min`}
                  </td>

                  <td className="py-3.5 px-4">
                    <StatusBadge status={item.queue_status} size="sm" />
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {item.queue_status === 'Waiting' && (
                      <button
                        onClick={() => onUpdateStatus(item.id, 'In Consultation')}
                        className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition"
                      >
                        Call to Doctor →
                      </button>
                    )}
                    {item.queue_status === 'In Consultation' && (
                      <button
                        onClick={() => onUpdateStatus(item.id, 'Completed')}
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs transition"
                      >
                        Complete Visit ✓
                      </button>
                    )}
                    {item.queue_status === 'Completed' && (
                      <span className="text-slate-400 font-medium text-[11px]">Discharged</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Token Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Issue Anonymous Demonstration Patient Token"
        description="Simulate OPD patient intake with anonymous ID token."
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Department *</label>
            <select
              value={registerForm.department}
              onChange={(e) => setRegisterForm({ ...registerForm, department: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="General OPD">General OPD</option>
              <option value="Emergency">Emergency</option>
              <option value="Paediatrics">Paediatrics</option>
              <option value="Gynaecology & Obstetrics">Gynaecology & Obstetrics</option>
              <option value="Dental">Dental</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Consultation Room *</label>
            <input
              type="text"
              required
              value={registerForm.assigned_service_area}
              onChange={(e) => setRegisterForm({ ...registerForm, assigned_service_area: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Triage Priority Category *</label>
            <select
              value={registerForm.priority}
              onChange={(e) => setRegisterForm({ ...registerForm, priority: e.target.value as 'Routine' | 'Urgent' | 'Emergency' })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="Routine">Routine (Regular Turn)</option>
              <option value="Urgent">Urgent (Expedited)</option>
              <option value="Emergency">Emergency (Immediate Intervention)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
            >
              Issue Token
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
