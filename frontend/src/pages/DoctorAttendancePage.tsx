import React, { useState } from 'react';
import {
  Stethoscope,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { Doctor } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';

interface DoctorAttendancePageProps {
  doctors: Doctor[];
  onToggleAttendance: (doc: Doctor) => Promise<void>;
  onAddDoctor: (data: Partial<Doctor>) => Promise<void>;
  selectedFacility: string;
}

export const DoctorAttendancePage: React.FC<DoctorAttendancePageProps> = ({
  doctors,
  onToggleAttendance,
  onAddDoctor,
  selectedFacility
}) => {
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [shiftFilter, setShiftFilter] = useState('All');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [addForm, setAddForm] = useState({
    name: '',
    department: 'General Medicine',
    shift: 'Morning (08:00–14:00)',
    notes: ''
  });

  const departments = ['All', ...Array.from(new Set(doctors.map((d) => d.department)))];
  const shifts = ['All', 'Morning (08:00–14:00)', 'Evening (14:00–20:00)', 'Night (20:00–08:00)'];

  const filteredDoctors = doctors.filter((d) => {
    const matchesDept = departmentFilter === 'All' || d.department === departmentFilter;
    const matchesShift = shiftFilter === 'All' || d.shift === shiftFilter;
    return matchesDept && matchesShift;
  });

  const totalDoctors = doctors.length;
  const presentDoctors = doctors.filter((d) => d.is_present).length;
  const absentDoctors = totalDoctors - presentDoctors;
  const coveragePercent = totalDoctors > 0 ? Math.round((presentDoctors / totalDoctors) * 100) : 0;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddDoctor({
      ...addForm,
      facility_id: selectedFacility === 'ALL' ? 'FAC-01' : selectedFacility,
      is_present: true
    });
    setIsAddOpen(false);
    setAddForm({
      name: '',
      department: 'General Medicine',
      shift: 'Morning (08:00–14:00)',
      notes: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Clinician Roster & Duty Attendance
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              Shift Operations
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor healthcare provider availability across specialty departments and operational shifts.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Clinician to Roster</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Rostered</span>
          <div className="text-3xl font-black text-slate-900 mt-2">{totalDoctors}</div>
          <p className="text-xs text-slate-500 mt-1">Across all medical departments</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Present On Duty</span>
          <div className="text-3xl font-black text-emerald-600 mt-2">{presentDoctors}</div>
          <p className="text-xs text-slate-500 mt-1">Actively consulting patients</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Off Duty / On Leave</span>
          <div className="text-3xl font-black text-rose-600 mt-2">{absentDoctors}</div>
          <p className="text-xs text-slate-500 mt-1">Leave or shift rotation</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Roster Coverage</span>
          <div className="text-3xl font-black text-teal-700 mt-2">{coveragePercent}%</div>
          <p className="text-xs text-slate-500 mt-1">Target threshold: ≥ 75%</p>
        </div>
      </div>

      {/* Staffing Shortage Alert */}
      {coveragePercent < 60 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-amber-900">Clinician Coverage Deficit</div>
            <p className="text-xs text-amber-800 mt-0.5">
              Current attendance coverage is {coveragePercent}%. Emergency and OPD response times may increase. Consider calling locum medical officers or extending morning shift coverage.
            </p>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Department:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              aria-label="Filter clinicians by department"
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d === 'All' ? 'All Departments' : d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <span>Shift:</span>
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              aria-label="Filter clinicians by shift"
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              {shifts.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All Shifts' : s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs font-bold text-slate-500">
          {filteredDoctors.length} staff records listed
        </span>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">Doctor / Clinician</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Shift Hours</th>
                <th className="py-3 px-4">Facility ID</th>
                <th className="py-3 px-4">Duty Status</th>
                <th className="py-3 px-4">Notes / Assignment</th>
                <th className="py-3 px-4 text-right">Toggle Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDoctors.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-sm">{doc.name}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{doc.id}</div>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {doc.department}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-600">
                    {doc.shift}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-500">
                    {doc.facility_id}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-md text-xs border ${
                        doc.is_present
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${doc.is_present ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {doc.is_present ? 'On Duty' : 'Off Duty'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 italic max-w-xs truncate">
                    {doc.notes || 'Standard shift schedule'}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onToggleAttendance(doc)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition border ${
                        doc.is_present
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {doc.is_present ? 'Mark Absent' : 'Mark Present'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Clinician Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Doctor / Clinician to Roster"
        description="Register a fictional healthcare provider for operational shift scheduling."
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Clinician Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Sunita Deshmukh"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Department *</label>
            <select
              value={addForm.department}
              onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="General Medicine">General Medicine</option>
              <option value="Paediatrics">Paediatrics</option>
              <option value="Emergency Medicine">Emergency Medicine</option>
              <option value="Gynaecology & Obstetrics">Gynaecology & Obstetrics</option>
              <option value="Dental Surgery">Dental Surgery</option>
              <option value="Orthopaedics">Orthopaedics</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Shift Schedule *</label>
            <select
              value={addForm.shift}
              onChange={(e) => setAddForm({ ...addForm, shift: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="Morning (08:00–14:00)">Morning (08:00–14:00)</option>
              <option value="Evening (14:00–20:00)">Evening (14:00–20:00)</option>
              <option value="Night (20:00–08:00)">Night (20:00–08:00)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Shift Notes / Specialty Focus</label>
            <input
              type="text"
              placeholder="e.g. Inpatient rounds and triage supervisor"
              value={addForm.notes}
              onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
            >
              Add Clinician
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
