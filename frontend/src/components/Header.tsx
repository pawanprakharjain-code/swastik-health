import React from 'react';
import { Menu, Building2, Download, AlertTriangle } from 'lucide-react';
import { Facility } from '../types';

interface HeaderProps {
  pageTitle: string;
  facilities: Facility[];
  selectedFacility: string;
  onSelectFacility: (id: string) => void;
  onOpenMobileMenu: () => void;
  onExportCSV: () => void;
  activeAlertCount?: number;
  onAlertsClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  pageTitle,
  facilities,
  selectedFacility,
  onSelectFacility,
  onOpenMobileMenu,
  onExportCSV,
  activeAlertCount = 0,
  onAlertsClick
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 focus:outline-none"
          aria-label="Open sidebar navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="text-[11px] font-semibold text-slate-400 tracking-tight">
            SehatFlow AI / <span className="text-slate-600">{pageTitle}</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            {pageTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Facility Selector */}
        <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200/80 rounded-xl px-2.5 sm:px-3 py-1.5">
          <Building2 className="w-4 h-4 text-teal-600 shrink-0 hidden sm:block" />
          <select
            value={selectedFacility}
            onChange={(e) => onSelectFacility(e.target.value)}
            className="bg-transparent text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
          >
            <option value="ALL">🌐 District Network (All Facilities)</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.facility_type})
              </option>
            ))}
          </select>
        </div>

        {/* Priority Alerts Pill Button */}
        {activeAlertCount > 0 && (
          <button
            onClick={onAlertsClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition shadow-2xs"
            title="View priority alerts"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>{activeAlertCount} Alert{activeAlertCount > 1 ? 's' : ''}</span>
          </button>
        )}

        {/* Live System Indicator */}
        <div className="hidden md:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>PROTOTYPE ONLINE</span>
        </div>

        {/* Export CSV button */}
        <button
          onClick={onExportCSV}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export CSV</span>
        </button>
      </div>
    </header>
  );
};
