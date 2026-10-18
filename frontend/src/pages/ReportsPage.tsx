import React, { useState } from 'react';
import {
  FileBarChart,
  Download,
  Printer,
  Calendar,
  Building2,
  CheckCircle,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import { Medicine, Bed, Doctor, PatientQueueItem, StockTransfer, ActivityLog } from '../types';

interface ReportsPageProps {
  medicines: Medicine[];
  beds: Bed[];
  doctors: Doctor[];
  queue: PatientQueueItem[];
  transfers: StockTransfer[];
  activities: ActivityLog[];
  selectedFacility: string;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  medicines,
  beds,
  doctors,
  queue,
  transfers,
  activities,
  selectedFacility
}) => {
  const [activeReport, setActiveReport] = useState<
    'inventory' | 'forecast' | 'beds' | 'doctors' | 'queue' | 'transfers' | 'audit'
  >('inventory');

  const exportCSV = (type: string) => {
    let rows: string[][] = [];
    let filename = `sehatflow-${type}-${new Date().toISOString().slice(0, 10)}.csv`;

    if (type === 'inventory') {
      rows = [
        ['ID', 'Medicine Name', 'Generic Name', 'Category', 'Current Stock', 'Unit', 'Reorder Level', 'Daily Usage', 'Expiry Date', 'Status'],
        ...medicines.map((m) => [
          m.id,
          m.name,
          m.generic_name,
          m.category,
          String(m.current_stock),
          m.unit,
          String(m.min_threshold),
          String(m.avg_daily_consumption),
          m.expiry_date,
          m.status
        ])
      ];
    } else if (type === 'beds') {
      rows = [
        ['Bed ID', 'Bed Number', 'Facility', 'Ward', 'Status', 'Last Updated'],
        ...beds.map((b) => [b.id, b.bed_number, b.facility_id, b.ward, b.status, b.last_updated])
      ];
    } else if (type === 'doctors') {
      rows = [
        ['Doctor ID', 'Name', 'Department', 'Facility', 'Shift', 'Duty Status'],
        ...doctors.map((d) => [d.id, d.name, d.department, d.facility_id, d.shift, d.is_present ? 'Present' : 'Absent'])
      ];
    } else if (type === 'queue') {
      rows = [
        ['Token', 'Facility', 'Department', 'Service Area', 'Arrival Time', 'Queue Status', 'Priority', 'Est Wait (mins)'],
        ...queue.map((q) => [q.token, q.facility_id, q.department, q.assigned_service_area, q.arrival_time, q.queue_status, q.priority, String(q.estimated_wait_minutes)])
      ];
    } else if (type === 'transfers') {
      rows = [
        ['Transfer ID', 'Medicine', 'Source Facility', 'Destination Facility', 'Quantity', 'Status', 'Notes', 'Date'],
        ...transfers.map((t) => [t.id, t.medicine_name, t.source_facility_id, t.destination_facility_id, String(t.quantity), t.status, t.notes || '', t.created_at])
      ];
    } else if (type === 'audit') {
      rows = [
        ['Log ID', 'Facility', 'Action Type', 'Description', 'User Role', 'Timestamp'],
        ...activities.map((a) => [String(a.id), a.facility_id || 'Global', a.action_type, a.description, a.user_role, a.timestamp])
      ];
    }

    const csvContent = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs no-print">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Reports, Audit & Analytics
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              CSV Export & Printable Dossier
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Generate verifiable operational reports for district health officers and supply coordinators.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => exportCSV(activeReport)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Export Active CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-print">
        {[
          { id: 'inventory', label: 'Medicine Inventory & Stock' },
          { id: 'forecast', label: 'Demand Forecast & Risks' },
          { id: 'beds', label: 'Bed Capacity & Occupancy' },
          { id: 'doctors', label: 'Doctor Shift Attendance' },
          { id: 'queue', label: 'Patient Queue Flow' },
          { id: 'transfers', label: 'Inter-Facility Transfers' },
          { id: 'audit', label: 'Activity Audit Trail' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeReport === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Preview Container */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
        {/* Printable Header */}
        <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-teal-700 uppercase tracking-wider">
              SehatFlow AI · Official Operational Report
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1 capitalize">
              {activeReport.replace('-', ' ')} Summary
            </h3>
            <p className="text-xs text-slate-500">
              Scope: {selectedFacility === 'ALL' ? 'District-Wide Network' : selectedFacility} · Generated on{' '}
              {new Date().toLocaleString('en-IN')}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              SYNTHETIC HACKATHON DEMO DATA
            </span>
          </div>
        </div>

        {/* Content Table based on Active Report */}
        <div className="overflow-x-auto">
          {activeReport === 'inventory' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Medicine</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Stock</th>
                  <th className="py-2.5 px-3">Reorder Threshold</th>
                  <th className="py-2.5 px-3">Run-Rate</th>
                  <th className="py-2.5 px-3">Expiry</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicines.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{m.id}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{m.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{m.category}</td>
                    <td className="py-2.5 px-3 font-black">{m.current_stock} {m.unit}</td>
                    <td className="py-2.5 px-3 text-slate-600">{m.min_threshold} {m.unit}</td>
                    <td className="py-2.5 px-3">~{m.avg_daily_consumption}/day</td>
                    <td className="py-2.5 px-3 text-slate-600">{m.expiry_date}</td>
                    <td className="py-2.5 px-3 font-bold">{m.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'forecast' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Medicine</th>
                  <th className="py-2.5 px-3">Current Stock</th>
                  <th className="py-2.5 px-3">Daily Run-rate</th>
                  <th className="py-2.5 px-3">Days Remaining</th>
                  <th className="py-2.5 px-3">7-Day Projected</th>
                  <th className="py-2.5 px-3">Suggested Reorder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicines.map((m) => {
                  const days = m.days_until_stockout || 999;
                  const req = Math.max(0, Math.ceil(m.avg_daily_consumption * 10 - m.current_stock));
                  return (
                    <tr key={m.id}>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{m.name}</td>
                      <td className="py-2.5 px-3 font-black">{m.current_stock} {m.unit}</td>
                      <td className="py-2.5 px-3">~{m.avg_daily_consumption}/day</td>
                      <td className="py-2.5 px-3 font-bold">{days < 900 ? `~${days} days` : 'Secure'}</td>
                      <td className="py-2.5 px-3">{Math.ceil(m.avg_daily_consumption * 7)} {m.unit}</td>
                      <td className="py-2.5 px-3 font-black text-rose-600">{req} {m.unit}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {activeReport === 'beds' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Bed ID</th>
                  <th className="py-2.5 px-3">Bed Number</th>
                  <th className="py-2.5 px-3">Ward / Unit</th>
                  <th className="py-2.5 px-3">Facility</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {beds.map((b) => (
                  <tr key={b.id}>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{b.id}</td>
                    <td className="py-2.5 px-3 font-black text-slate-900">{b.bed_number}</td>
                    <td className="py-2.5 px-3 text-slate-700">{b.ward}</td>
                    <td className="py-2.5 px-3 text-slate-600">{b.facility_id}</td>
                    <td className="py-2.5 px-3 font-bold">{b.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'doctors' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Staff ID</th>
                  <th className="py-2.5 px-3">Doctor Name</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Shift</th>
                  <th className="py-2.5 px-3">Facility</th>
                  <th className="py-2.5 px-3">Duty Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors.map((d) => (
                  <tr key={d.id}>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{d.id}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{d.name}</td>
                    <td className="py-2.5 px-3 text-slate-700">{d.department}</td>
                    <td className="py-2.5 px-3 text-slate-600">{d.shift}</td>
                    <td className="py-2.5 px-3 text-slate-600">{d.facility_id}</td>
                    <td className="py-2.5 px-3 font-bold">{d.is_present ? 'Present (On Duty)' : 'Absent / Leave'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'queue' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Token #</th>
                  <th className="py-2.5 px-3">Facility</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Service Area</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Wait (mins)</th>
                  <th className="py-2.5 px-3">Queue Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.map((q) => (
                  <tr key={q.id}>
                    <td className="py-2.5 px-3 font-mono font-black text-slate-900">{q.token}</td>
                    <td className="py-2.5 px-3 text-slate-600">{q.facility_id}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{q.department}</td>
                    <td className="py-2.5 px-3 text-slate-600">{q.assigned_service_area}</td>
                    <td className="py-2.5 px-3 font-bold">{q.priority}</td>
                    <td className="py-2.5 px-3 font-semibold">{q.estimated_wait_minutes} min</td>
                    <td className="py-2.5 px-3 font-bold">{q.queue_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'transfers' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Transfer ID</th>
                  <th className="py-2.5 px-3">Medicine</th>
                  <th className="py-2.5 px-3">Source Facility</th>
                  <th className="py-2.5 px-3">Destination Facility</th>
                  <th className="py-2.5 px-3">Quantity</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Requested By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{t.id}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{t.medicine_name}</td>
                    <td className="py-2.5 px-3 text-slate-700">{t.source_facility_id}</td>
                    <td className="py-2.5 px-3 text-slate-700">{t.destination_facility_id}</td>
                    <td className="py-2.5 px-3 font-black">{t.quantity} units</td>
                    <td className="py-2.5 px-3 font-bold">{t.status}</td>
                    <td className="py-2.5 px-3 text-slate-600">{t.requested_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'audit' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Facility</th>
                  <th className="py-2.5 px-3">Action Type</th>
                  <th className="py-2.5 px-3">Audit Log Description</th>
                  <th className="py-2.5 px-3">User Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activities.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{a.id}</td>
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(a.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">{a.facility_id || 'System'}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{a.action_type}</td>
                    <td className="py-2.5 px-3 text-slate-700">{a.description}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-600">{a.user_role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
