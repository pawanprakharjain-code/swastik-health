import React, { useState } from 'react';
import {
  BedDouble,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Filter,
  Layers,
  Building
} from 'lucide-react';
import { Bed } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface BedManagementPageProps {
  beds: Bed[];
  onUpdateBedStatus: (bedId: string, status: string) => Promise<void>;
  selectedFacility: string;
}

export const BedManagementPage: React.FC<BedManagementPageProps> = ({
  beds,
  onUpdateBedStatus,
  selectedFacility
}) => {
  const [wardFilter, setWardFilter] = useState('All');

  const wards = ['All', ...Array.from(new Set(beds.map((b) => b.ward)))];

  const filteredBeds = beds.filter((b) => {
    return wardFilter === 'All' || b.ward === wardFilter;
  });

  const totalBeds = beds.length;
  const availableBeds = beds.filter((b) => b.status === 'Available').length;
  const occupiedBeds = beds.filter((b) => b.status === 'Occupied').length;
  const cleaningBeds = beds.filter((b) => b.status === 'Cleaning').length;
  const outOfServiceBeds = beds.filter((b) => b.status === 'Out of service').length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const cycleStatus = async (bed: Bed) => {
    const cycleMap: Record<string, string> = {
      Available: 'Occupied',
      Occupied: 'Cleaning',
      Cleaning: 'Available',
      'Out of service': 'Cleaning'
    };
    const nextStatus = cycleMap[bed.status] || 'Available';
    await onUpdateBedStatus(bed.id, nextStatus);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Hospital Ward Bed Management
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              Interactive Capacity Map
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time ward occupancy, sanitation turnover, and admission routing. Tap any bed to cycle status.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
          <span>Overall Occupancy:</span>
          <span className={`text-sm ${occupancyRate > 80 ? 'text-rose-600' : 'text-emerald-700'}`}>
            {occupancyRate}%
          </span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Beds</span>
          <div className="text-3xl font-black text-emerald-600 mt-2">{availableBeds}</div>
          <p className="text-xs text-slate-500 mt-1">Ready for patient admission</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Occupied Beds</span>
          <div className="text-3xl font-black text-rose-600 mt-2">{occupiedBeds}</div>
          <p className="text-xs text-slate-500 mt-1">Inpatient admissions active</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cleaning / Sanitizing</span>
          <div className="text-3xl font-black text-amber-600 mt-2">{cleaningBeds}</div>
          <p className="text-xs text-slate-500 mt-1">Turnaround in progress</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Facility Beds</span>
          <div className="text-3xl font-black text-slate-900 mt-2">{totalBeds}</div>
          <p className="text-xs text-slate-500 mt-1">{outOfServiceBeds} out of service</p>
        </div>
      </div>

      {/* Low Capacity Warning Banner */}
      {availableBeds <= 4 && totalBeds > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-rose-900">Bed Shortage Alert: Low Admission Buffer</div>
            <p className="text-xs text-rose-700 mt-0.5">
              Only {availableBeds} bed(s) currently available. Prioritize sanitizing the {cleaningBeds} cleaning bed(s) or coordinate with district hospital for emergency diversion.
            </p>
          </div>
        </div>
      )}

      {/* Ward Filter */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <Filter className="w-4 h-4 text-slate-500 ml-2" />
        <span className="text-xs font-bold text-slate-600">Filter Ward:</span>
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {wards.map((w) => (
            <button
              key={w}
              onClick={() => setWardFilter(w)}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                wardFilter === w
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {w === 'All' ? 'All Wards' : w}
            </button>
          ))}
        </div>
      </div>

      {/* Bed Map Matrix */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">Ward Bed Layout</h3>
          <span className="text-xs text-slate-500">
            Clicking a bed updates status in persistent database
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredBeds.map((bed) => {
            const isAvail = bed.status === 'Available';
            const isOcc = bed.status === 'Occupied';
            const isClean = bed.status === 'Cleaning';

            const cardClasses = isAvail
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 hover:bg-emerald-100/90'
              : isOcc
              ? 'bg-rose-50/80 border-rose-200 text-rose-900 hover:bg-rose-100/90'
              : isClean
              ? 'bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-100/90'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200';

            return (
              <button
                key={bed.id}
                onClick={() => cycleStatus(bed)}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between h-28 ${cardClasses}`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-base font-black">{bed.bed_number}</span>
                  <BedDouble className="w-4 h-4 opacity-70" />
                </div>

                <div>
                  <div className="text-[10px] font-semibold opacity-80 truncate">{bed.ward}</div>
                  <div className="text-xs font-extrabold mt-1">{bed.status}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" /> Available (Admissible)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500" /> Occupied (Patient Admitted)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" /> Cleaning (Disinfecting)
          </span>
        </div>
      </div>
    </div>
  );
};
