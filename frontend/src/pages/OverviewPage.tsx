import React from 'react';
import {
  Pill,
  AlertTriangle,
  BedDouble,
  Stethoscope,
  Users,
  Truck,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Sparkles,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { DashboardSummary, Bed, Doctor, Alert } from '../types';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { NavPage } from '../components/Sidebar';

interface OverviewPageProps {
  summary: DashboardSummary | null;
  beds: Bed[];
  doctors: Doctor[];
  alerts: Alert[];
  onNavigate: (page: NavPage) => void;
  onToggleBed: (bed: Bed) => void;
  onToggleDoctor: (doc: Doctor) => void;
  onAcknowledgeAlert: (alertId: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  summary,
  beds,
  doctors,
  alerts,
  onNavigate,
  onToggleBed,
  onToggleDoctor,
  onAcknowledgeAlert,
  onRefresh,
  isLoading
}) => {
  const dateStr = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mb-3" />
        <p className="font-semibold text-sm">Loading health operations telemetry...</p>
      </div>
    );
  }

  const activeAlerts = alerts.filter(a => a.status === 'Active');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Operational Command Center
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              Live Facility Pulse
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitoring <strong className="text-slate-800">{summary.facility_name}</strong>. Proactive decision support for supplies and patient flow.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{dateStr}</span>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Refresh telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Medicines Monitored"
          value={summary.total_medicines}
          subtitle={`${summary.medicines_needing_attention} require review (low/expiring)`}
          icon={Pill}
          variant={summary.stockout_risks > 0 ? 'danger' : 'teal'}
          badge={summary.stockout_risks > 0 ? `${summary.stockout_risks} Stockout Risk` : 'Optimal'}
        />

        <StatCard
          title="Bed Capacity"
          value={summary.available_beds}
          subValue={`/ ${summary.total_beds}`}
          subtitle={`${summary.bed_occupancy_rate}% occupied · ${summary.cleaning_beds} in cleaning`}
          icon={BedDouble}
          variant={summary.bed_occupancy_rate > 85 ? 'warning' : 'success'}
          badge={`${summary.available_beds} Available`}
        />

        <StatCard
          title="Doctors On Duty"
          value={summary.doctors_present}
          subValue={`/ ${summary.doctors_rostered}`}
          subtitle={`${summary.doctors_absent > 0 ? `${summary.doctors_absent} doctor(s) off duty / leave` : 'Full medical coverage'}`}
          icon={Stethoscope}
          variant={summary.doctors_absent > 1 ? 'warning' : 'default'}
          badge={`${Math.round((summary.doctors_present / Math.max(1, summary.doctors_rostered)) * 100)}% Coverage`}
        />

        <StatCard
          title="Patients Today"
          value={summary.total_patients_today}
          subtitle={`~${summary.average_wait_minutes} min avg consultation wait`}
          icon={Users}
          variant={summary.patients_waiting > 5 ? 'warning' : 'default'}
          badge={`${summary.patients_waiting} Waiting`}
        />
      </div>

      {/* Charts & Priority Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Consumption & Forecast Trends Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Weekly Medicine Consumption vs Restock</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                  Telemetry Units
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Synthetic multi-day throughput tracking formulation dispensing and arrivals.
              </p>
            </div>
            <button
              onClick={() => onNavigate('forecast')}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>AI Forecast</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.consumption_trend}>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
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
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="consumed" name="Dispensed (Units)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="restocked" name="Replenished (Units)" fill="#0e9f8e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AI Decision Support Insight Box */}
          <div className="mt-4 p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/60 flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-teal-600 text-white shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-teal-900">Proactive Demand Recommendation</span>
              <p className="text-xs text-teal-800 mt-0.5 leading-relaxed">
                Antimicrobial consumption (Amoxicillin 500mg) has outpaced replenishment rate. Recommended buffer reorder of ~50 units or initiate inter-facility transfer from CHC Balrampur before stockout in ~1.7 days.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Priority Action Centre */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Priority Action Center</h3>
              <p className="text-xs text-slate-500">Autonomous alert triggers</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              {activeAlerts.length} Active
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-96 pr-1">
            {activeAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                <p className="text-xs font-bold text-slate-700">All Metrics Operational</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  No active low-stock, capacity, or staffing breaches detected.
                </p>
              </div>
            ) : (
              activeAlerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900 leading-tight">
                      {alert.title}
                    </span>
                    <StatusBadge status={alert.severity} size="sm" />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                    {alert.description}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px]">
                    <span className="text-slate-500 font-medium italic">
                      Action: {alert.recommended_action.slice(0, 48)}...
                    </span>
                    <button
                      onClick={() => onAcknowledgeAlert(alert.id)}
                      className="text-xs font-bold text-teal-600 hover:text-teal-700 underline"
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-auto">
            <button
              onClick={() => onNavigate('supply-chain')}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Open Supply Chain & Transfers</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Bottom Row: Bed Status Map & Doctor Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bed Status Map */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Interactive Ward Bed Status</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {beds.length} Beds
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Click any bed tile to cycle status: <span className="text-emerald-700 font-semibold">Available</span> → <span className="text-rose-700 font-semibold">Occupied</span> → <span className="text-amber-700 font-semibold">Cleaning</span>.
              </p>
            </div>
            <button
              onClick={() => onNavigate('beds')}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>Manage Beds</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bed Grid (sample first 18 beds) */}
          <div className="grid grid-cols-6 sm:grid-cols-6 gap-2">
            {beds.slice(0, 18).map((bed) => {
              const statusColor =
                bed.status === 'Available'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : bed.status === 'Occupied'
                  ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                  : bed.status === 'Cleaning'
                  ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  : 'bg-slate-100 text-slate-500 border-slate-200';

              return (
                <button
                  key={bed.id}
                  onClick={() => onToggleBed(bed)}
                  title={`${bed.bed_number} (${bed.ward}): ${bed.status}. Click to cycle.`}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${statusColor}`}
                >
                  <span className="text-xs font-black">{bed.bed_number}</span>
                  <span className="text-[9px] font-bold tracking-tighter truncate w-full">
                    {bed.status}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-100 text-[11px] font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Occupied
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Cleaning
            </span>
          </div>
        </div>

        {/* Doctor Duty Roster */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Doctor Duty Roster</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {doctors.filter((d) => d.is_present).length} / {doctors.length} Present
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Click attendance pill to toggle doctor shift status.
              </p>
            </div>
            <button
              onClick={() => onNavigate('doctors')}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>View Roster</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {doctors.slice(0, 5).map((doc) => (
              <div key={doc.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 font-bold text-xs text-slate-700 flex items-center justify-center">
                    {doc.name.split(' ').slice(-1)[0][0]}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{doc.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {doc.department} · {doc.shift.split(' ')[0]}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onToggleDoctor(doc)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${
                    doc.is_present
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  {doc.is_present ? '● On Duty' : '○ Off Duty'}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Audit trail auto-logged on attendance changes.</span>
            <button
              onClick={() => onNavigate('patient-flow')}
              className="text-teal-600 font-bold hover:underline"
            >
              Check OPD Queues →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
