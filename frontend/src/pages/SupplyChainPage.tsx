import React, { useState } from 'react';
import {
  Truck,
  Plus,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Building2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Send
} from 'lucide-react';
import { StockTransfer, Facility, Medicine } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';

interface SupplyChainPageProps {
  transfers: StockTransfer[];
  facilities: Facility[];
  medicines: Medicine[];
  onRequestTransfer: (data: {
    medicine_id: string;
    source_facility_id: string;
    destination_facility_id: string;
    quantity: number;
    notes?: string;
  }) => Promise<void>;
  onApproveTransfer: (id: string) => Promise<void>;
  onRejectTransfer: (id: string) => Promise<void>;
  selectedFacility: string;
}

export const SupplyChainPage: React.FC<SupplyChainPageProps> = ({
  transfers,
  facilities,
  medicines,
  onRequestTransfer,
  onApproveTransfer,
  onRejectTransfer,
  selectedFacility
}) => {
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  const [form, setForm] = useState({
    source_facility_id: 'FAC-02',
    destination_facility_id: selectedFacility === 'ALL' ? 'FAC-01' : selectedFacility,
    medicine_id: '',
    quantity: 50,
    notes: 'Urgent redistribution to alleviate stockout risk'
  });

  // Filter medicines available at chosen source facility
  const sourceMedicines = medicines.filter(
    (m) => m.facility_id === form.source_facility_id && m.current_stock > 0
  );

  const selectedSourceMed = medicines.find(
    (m) => m.id === form.medicine_id && m.facility_id === form.source_facility_id
  );

  const pendingTransfers = transfers.filter((t) => t.status === 'Pending');
  const completedTransfers = transfers.filter((t) => t.status !== 'Pending');

  const filteredTransfers = transfers.filter((t) => {
    return statusFilter === 'All' || t.status === statusFilter;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.medicine_id) return;
    await onRequestTransfer({
      medicine_id: form.medicine_id,
      source_facility_id: form.source_facility_id,
      destination_facility_id: form.destination_facility_id,
      quantity: Number(form.quantity),
      notes: form.notes
    });
    setIsRequestOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Multi-Facility Supply Chain & Redistribution
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              Inter-facility Transfers
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Redistribute medicine stock between Primary Health Centres, Community Health Centres, and District Hospitals.
          </p>
        </div>

        <button
          onClick={() => setIsRequestOpen(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Transfer Request</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Connected Facilities</span>
          <div className="text-3xl font-black text-slate-900 mt-2">{facilities.length}</div>
          <p className="text-xs text-slate-500 mt-1">District network nodes</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-amber-200 shadow-2xs bg-amber-50/20">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Awaiting Authorization</span>
          <div className="text-3xl font-black text-amber-700 mt-2">{pendingTransfers.length}</div>
          <p className="text-xs text-amber-700 mt-1">Pending approval to move stock</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transfers Dispatched</span>
          <div className="text-3xl font-black text-emerald-600 mt-2">
            {transfers.filter((t) => t.status === 'Approved').length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Atomic inventory settlement</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Units Moved</span>
          <div className="text-3xl font-black text-teal-700 mt-2">
            {transfers
              .filter((t) => t.status === 'Approved')
              .reduce((s, t) => s + t.quantity, 0)
              .toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">Zero-waste redistribution</p>
        </div>
      </div>

      {/* Facilities Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {facilities.map((fac) => {
          const facMeds = medicines.filter((m) => m.facility_id === fac.id);
          const totalStock = facMeds.reduce((acc, m) => acc + m.current_stock, 0);
          const lowCount = facMeds.filter((m) => m.current_stock <= m.min_threshold).length;

          return (
            <div key={fac.id} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{fac.name}</h4>
                  <span className="text-[11px] text-teal-700 font-semibold">{fac.facility_type}</span>
                </div>
                <Building2 className="w-4 h-4 text-slate-400" />
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Total Units: {totalStock.toLocaleString()}</span>
                {lowCount > 0 ? (
                  <span className="text-rose-600 font-bold">{lowCount} Low Stock</span>
                ) : (
                  <span className="text-emerald-700 font-bold">Stable</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Transfer Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter transfer requests by status"
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Transfers</option>
              <option value="Pending">Pending Approval</option>
              <option value="Approved">Approved & Completed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <span className="text-xs font-bold text-slate-500">
            {filteredTransfers.length} inter-facility records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">Transfer ID</th>
                <th className="py-3 px-4">Medicine Formulation</th>
                <th className="py-3 px-4">Source Facility</th>
                <th className="py-3 px-4">Destination Facility</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Requested On</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action / Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Truck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No transfer requests found.</p>
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((trf) => (
                  <tr key={trf.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {trf.id}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{trf.medicine_name}</div>
                      <div className="text-[11px] text-slate-400">{trf.notes}</div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {trf.source_facility_name || trf.source_facility_id}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {trf.destination_facility_name || trf.destination_facility_id}
                    </td>

                    <td className="py-3.5 px-4 font-black text-sm text-slate-900">
                      {trf.quantity} units
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(trf.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={trf.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {trf.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onApproveTransfer(trf.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition shadow-2xs"
                          >
                            Authorize Transfer ✓
                          </button>
                          <button
                            onClick={() => onRejectTransfer(trf.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          {trf.status === 'Approved' ? `Approved by ${trf.approved_by || 'Coordinator'}` : 'Closed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------- MODAL: NEW TRANSFER REQUEST ----------------- */}
      <Modal
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
        title="Create Inter-Facility Stock Transfer Request"
        description="Select source facility with available stock and target destination health center."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Source Facility (Dispatches Stock) *</label>
            <select
              value={form.source_facility_id}
              onChange={(e) => setForm({ ...form, source_facility_id: e.target.value, medicine_id: '' })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
            >
              {facilities.map((f) => (
                <option key={f.id} value={f.id} disabled={f.id === form.destination_facility_id}>
                  {f.name} ({f.facility_type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Destination Facility (Receives Stock) *</label>
            <select
              value={form.destination_facility_id}
              onChange={(e) => setForm({ ...form, destination_facility_id: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
            >
              {facilities.map((f) => (
                <option key={f.id} value={f.id} disabled={f.id === form.source_facility_id}>
                  {f.name} ({f.facility_type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Medicine from Source *</label>
            <select
              required
              value={form.medicine_id}
              onChange={(e) => setForm({ ...form, medicine_id: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="">-- Choose available medicine --</option>
              {sourceMedicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.current_stock} {m.unit} on hand)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Transfer Quantity *</label>
            <input
              type="number"
              min="1"
              max={selectedSourceMed ? selectedSourceMed.current_stock : 9999}
              required
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
            />
            {selectedSourceMed && (
              <span className="text-[11px] text-slate-500 mt-1 block">
                Available at source: {selectedSourceMed.current_stock} {selectedSourceMed.unit}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Justification / Notes</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRequestOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!form.medicine_id}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold disabled:opacity-50"
            >
              Submit Transfer Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
