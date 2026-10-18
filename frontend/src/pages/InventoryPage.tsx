import React, { useState } from 'react';
import {
  Pill,
  Plus,
  Search,
  Filter,
  History,
  AlertTriangle,
  RotateCcw,
  Check,
  Calendar,
  Layers,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { Medicine, StockMovement } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';

interface InventoryPageProps {
  medicines: Medicine[];
  onAddMedicine: (data: any) => Promise<void>;
  onReceiveStock: (id: string, data: { quantity: number; batch_number?: string; supplier?: string; reason?: string }) => Promise<void>;
  onAdjustStock: (id: string, data: { new_quantity: number; reason: string }) => Promise<void>;
  onFetchMovements: (id: string) => Promise<StockMovement[]>;
  selectedFacility: string;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
  medicines,
  onAddMedicine,
  onReceiveStock,
  onAdjustStock,
  onFetchMovements,
  selectedFacility
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [restockMed, setRestockMed] = useState<Medicine | null>(null);
  const [adjustMed, setAdjustMed] = useState<Medicine | null>(null);
  const [historyMed, setHistoryMed] = useState<Medicine | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  // Form states
  const [addForm, setAddForm] = useState({
    name: '',
    generic_name: '',
    category: 'Analgesic & Antipyretic',
    batch_number: '',
    current_stock: 100,
    unit: 'Tablets',
    min_threshold: 40,
    avg_daily_consumption: 5.0,
    lead_time_days: 4,
    supplier: 'State Central Medical Supplies Depot',
    expiry_date: ''
  });

  const [restockForm, setRestockForm] = useState({
    quantity: 50,
    batch_number: '',
    supplier: 'State Central Depot',
    reason: 'Standard replenishment batch'
  });

  const [adjustForm, setAdjustForm] = useState({
    new_quantity: 0,
    reason: 'Physical count reconciliation'
  });

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(medicines.map((m) => m.category)))];

  // Filtering
  const filteredMeds = medicines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.generic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.batch_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || m.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Near Expiry' ? m.is_near_expiry : m.status === statusFilter);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Handlers
  const handleOpenRestock = (m: Medicine) => {
    setRestockMed(m);
    setRestockForm({
      quantity: m.min_threshold,
      batch_number: m.batch_number,
      supplier: m.supplier,
      reason: 'Standard replenishment batch'
    });
  };

  const handleOpenAdjust = (m: Medicine) => {
    setAdjustMed(m);
    setAdjustForm({
      new_quantity: m.current_stock,
      reason: 'Physical stock reconciliation audit'
    });
  };

  const handleOpenHistory = async (m: Medicine) => {
    setHistoryMed(m);
    setLoadingMovements(true);
    try {
      const data = await onFetchMovements(m.id);
      setMovements(data);
    } catch {
      setMovements([]);
    } finally {
      setLoadingMovements(false);
    }
  };

  const submitAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddMedicine({
      ...addForm,
      facility_id: selectedFacility === 'ALL' ? 'FAC-01' : selectedFacility,
      current_stock: Number(addForm.current_stock),
      min_threshold: Number(addForm.min_threshold),
      avg_daily_consumption: Number(addForm.avg_daily_consumption),
      lead_time_days: Number(addForm.lead_time_days)
    });
    setIsAddModalOpen(false);
    setAddForm({
      name: '',
      generic_name: '',
      category: 'Analgesic & Antipyretic',
      batch_number: '',
      current_stock: 100,
      unit: 'Tablets',
      min_threshold: 40,
      avg_daily_consumption: 5.0,
      lead_time_days: 4,
      supplier: 'State Central Medical Supplies Depot',
      expiry_date: ''
    });
  };

  const submitRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockMed) return;
    await onReceiveStock(restockMed.id, {
      quantity: Number(restockForm.quantity),
      batch_number: restockForm.batch_number,
      supplier: restockForm.supplier,
      reason: restockForm.reason
    });
    setRestockMed(null);
  };

  const submitAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustMed) return;
    await onAdjustStock(adjustMed.id, {
      new_quantity: Number(adjustForm.new_quantity),
      reason: adjustForm.reason
    });
    setAdjustMed(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Medicine Stock Register & Ledger
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Maintain accurate pharmacy quantities, batches, expiration dates, and movement histories.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Medicine</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by brand name, generic formulation, or batch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Stock Statuses</option>
              <option value="Critical">Critical (Out of Stock)</option>
              <option value="Low Stock">Low Stock (≤ Threshold)</option>
              <option value="Watch">Watch Buffer</option>
              <option value="Healthy">Healthy Stock</option>
              <option value="Near Expiry">Near Expiry (≤ 60 Days)</option>
            </select>
          </div>

          <span className="text-xs text-slate-500 font-semibold px-2">
            Showing {filteredMeds.length} of {medicines.length}
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">Medicine & Generic Formulation</th>
                <th className="py-3 px-4">Facility</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Reorder Level</th>
                <th className="py-3 px-4">Daily Run-rate</th>
                <th className="py-3 px-4">Stockout Horizon</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMeds.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Pill className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No matching medicine records found.</p>
                    <p className="text-[11px] text-slate-400">Try adjusting your filters or search query.</p>
                  </td>
                </tr>
              ) : (
                filteredMeds.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{m.name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {m.generic_name} · <span className="text-teal-700 font-semibold">{m.category}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Batch: {m.batch_number}</div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-600">
                      {m.facility_id}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-sm font-extrabold ${m.current_stock <= m.min_threshold ? 'text-rose-600' : 'text-slate-900'}`}>
                        {m.current_stock.toLocaleString()}
                      </span>{' '}
                      <span className="text-[11px] text-slate-500 font-semibold">{m.unit}</span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-600">
                      {m.min_threshold} {m.unit}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      ~{m.avg_daily_consumption} / day
                    </td>

                    <td className="py-3.5 px-4">
                      {m.days_until_stockout && m.days_until_stockout < 900 ? (
                        <span
                          className={`font-extrabold ${
                            m.days_until_stockout <= m.lead_time_days
                              ? 'text-rose-600'
                              : m.days_until_stockout <= m.lead_time_days * 1.5
                              ? 'text-amber-600'
                              : 'text-slate-700'
                          }`}
                        >
                          ~{m.days_until_stockout} days
                        </span>
                      ) : (
                        <span className="text-slate-400">Sufficient</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{m.expiry_date}</div>
                      {m.is_near_expiry && (
                        <div className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="w-3 h-3 text-rose-500" />
                          <span>Near Expiry</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={m.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenRestock(m)}
                          className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-[11px] transition"
                        >
                          + Restock
                        </button>
                        <button
                          onClick={() => handleOpenAdjust(m)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => handleOpenHistory(m)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          title="View stock movement ledger"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------- MODAL: REGISTER MEDICINE ----------------- */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Medicine Formulation"
        description="Add a demonstration medicine with batch tracking and reorder parameters."
        maxWidth="lg"
      >
        <form onSubmit={submitAddMedicine} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Brand / Product Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Paracetamol 500 mg"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Generic Name / Formulation *</label>
              <input
                type="text"
                required
                placeholder="e.g. Acetaminophen"
                value={addForm.generic_name}
                onChange={(e) => setAddForm({ ...addForm, generic_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
              <select
                value={addForm.category}
                onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
              >
                <option value="Analgesic & Antipyretic">Analgesic & Antipyretic</option>
                <option value="Antibiotic">Antibiotic</option>
                <option value="Electrolyte & Rehydration">Electrolyte & Rehydration</option>
                <option value="Antidiabetic">Antidiabetic</option>
                <option value="Cardiovascular / Antihypertensive">Cardiovascular</option>
                <option value="Respiratory Bronchodilator">Respiratory</option>
                <option value="Nutritional Supplement">Nutritional Supplement</option>
                <option value="IV Fluids">IV Fluids</option>
                <option value="Antiseptic & Disinfectant">Antiseptic</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Batch Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. BAT-2024-901"
                value={addForm.batch_number}
                onChange={(e) => setAddForm({ ...addForm, batch_number: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Initial Stock Quantity *</label>
              <input
                type="number"
                min="0"
                required
                value={addForm.current_stock}
                onChange={(e) => setAddForm({ ...addForm, current_stock: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit of Measure *</label>
              <select
                value={addForm.unit}
                onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
              >
                <option value="Tablets">Tablets</option>
                <option value="Capsules">Capsules</option>
                <option value="Sachets">Sachets</option>
                <option value="Bottles">Bottles</option>
                <option value="Vials">Vials</option>
                <option value="Bags (500ml)">Bags (500ml)</option>
                <option value="Canisters">Canisters</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reorder Threshold *</label>
              <input
                type="number"
                min="0"
                required
                value={addForm.min_threshold}
                onChange={(e) => setAddForm({ ...addForm, min_threshold: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Daily Consumption</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={addForm.avg_daily_consumption}
                onChange={(e) => setAddForm({ ...addForm, avg_daily_consumption: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Replenishment Lead Time (Days)</label>
              <input
                type="number"
                min="1"
                value={addForm.lead_time_days}
                onChange={(e) => setAddForm({ ...addForm, lead_time_days: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date *</label>
              <input
                type="date"
                required
                value={addForm.expiry_date}
                onChange={(e) => setAddForm({ ...addForm, expiry_date: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs"
            >
              Save Medicine
            </button>
          </div>
        </form>
      </Modal>

      {/* ----------------- MODAL: RESTOCK ----------------- */}
      <Modal
        isOpen={!!restockMed}
        onClose={() => setRestockMed(null)}
        title={`Receive Stock — ${restockMed?.name}`}
        description={`Record incoming inventory delivery. Current stock: ${restockMed?.current_stock} ${restockMed?.unit}.`}
      >
        <form onSubmit={submitRestock} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Quantity to Receive ({restockMed?.unit}) *</label>
            <input
              type="number"
              min="1"
              required
              value={restockForm.quantity}
              onChange={(e) => setRestockForm({ ...restockForm, quantity: Number(e.target.value) })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Batch Number</label>
            <input
              type="text"
              value={restockForm.batch_number}
              onChange={(e) => setRestockForm({ ...restockForm, batch_number: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Supplier / Depot Name</label>
            <input
              type="text"
              value={restockForm.supplier}
              onChange={(e) => setRestockForm({ ...restockForm, supplier: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Note / Reason</label>
            <input
              type="text"
              value={restockForm.reason}
              onChange={(e) => setRestockForm({ ...restockForm, reason: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRestockMed(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
            >
              Confirm Delivery
            </button>
          </div>
        </form>
      </Modal>

      {/* ----------------- MODAL: ADJUST STOCK ----------------- */}
      <Modal
        isOpen={!!adjustMed}
        onClose={() => setAdjustMed(null)}
        title={`Adjust Stock — ${adjustMed?.name}`}
        description={`Record physical count reconciliation, damage quarantine, or recount correction.`}
      >
        <form onSubmit={submitAdjust} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">New Verified Stock Quantity ({adjustMed?.unit}) *</label>
            <input
              type="number"
              min="0"
              required
              value={adjustForm.new_quantity}
              onChange={(e) => setAdjustForm({ ...adjustForm, new_quantity: Number(e.target.value) })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Previous stock: {adjustMed?.current_stock} {adjustMed?.unit} (Delta:{' '}
              {adjustForm.new_quantity - (adjustMed?.current_stock || 0) > 0
                ? `+${adjustForm.new_quantity - (adjustMed?.current_stock || 0)}`
                : adjustForm.new_quantity - (adjustMed?.current_stock || 0)})
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mandatory Audit Reason *</label>
            <select
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="Physical count reconciliation">Physical count reconciliation</option>
              <option value="Damaged / broken container quarantine">Damaged / broken container quarantine</option>
              <option value="Expired stock quarantine write-off">Expired stock quarantine write-off</option>
              <option value="Dispensing recount audit correction">Dispensing recount audit correction</option>
              <option value="Returned from ward surplus">Returned from ward surplus</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAdjustMed(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
            >
              Apply Adjustment
            </button>
          </div>
        </form>
      </Modal>

      {/* ----------------- MODAL: MOVEMENTS HISTORY LEDGER ----------------- */}
      <Modal
        isOpen={!!historyMed}
        onClose={() => setHistoryMed(null)}
        title={`Stock Movement Ledger — ${historyMed?.name}`}
        description={`Immutable audit trail for ${historyMed?.id} (${historyMed?.category}).`}
        maxWidth="lg"
      >
        {loadingMovements ? (
          <div className="p-8 text-center text-slate-400">Loading ledger records...</div>
        ) : movements.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No historical stock movements logged yet.</div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {movements.map((mov) => (
              <div key={mov.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <StatusBadge status={mov.movement_type} size="sm" />
                    <span>{mov.reason}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {new Date(mov.timestamp).toLocaleString('en-IN')} {mov.reference_id && `· Ref: ${mov.reference_id}`}
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-black text-sm ${
                      mov.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                  </span>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Balance: {mov.new_stock}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};
