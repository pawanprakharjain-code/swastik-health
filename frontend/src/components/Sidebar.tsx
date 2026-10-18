import React from 'react';
import {
  LayoutDashboard,
  Pill,
  TrendingUp,
  Users,
  BedDouble,
  Stethoscope,
  Truck,
  FileBarChart,
  Settings,
  ShieldCheck,
  X
} from 'lucide-react';

export type NavPage =
  | 'overview'
  | 'inventory'
  | 'forecast'
  | 'patient-flow'
  | 'beds'
  | 'doctors'
  | 'supply-chain'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentPage: NavPage;
  onSelectPage: (page: NavPage) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  alertsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  isOpenMobile,
  onCloseMobile,
  alertsCount = 0
}) => {
  const navItems: { id: NavPage; label: string; icon: any; badge?: number }[] = [
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Medicine Inventory', icon: Pill },
    { id: 'forecast', label: 'AI Demand Forecast', icon: TrendingUp },
    { id: 'patient-flow', label: 'Patient Queue Flow', icon: Users },
    { id: 'beds', label: 'Bed Management', icon: BedDouble },
    { id: 'doctors', label: 'Doctor Attendance', icon: Stethoscope },
    { id: 'supply-chain', label: 'Multi-Facility Supply', icon: Truck },
    { id: 'reports', label: 'Reports & Analytics', icon: FileBarChart },
    { id: 'settings', label: 'Settings & System', icon: Settings }
  ];

  const handleNavClick = (page: NavPage) => {
    onSelectPage(page);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#101b2d] text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-400 to-blue-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
              ✚
            </div>
            <div>
              <div className="font-extrabold text-white text-base tracking-tight leading-tight">
                Swastik <span className="text-teal-400">Health</span>
              </div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                AI-Powered Healthcare Management
              </div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Platform Modules
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-teal-500 text-white shadow-sm font-bold'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.id === 'overview' && alertsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
                    {alertsCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Demo environment pill & footer */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
            <div className="flex items-center gap-2 text-teal-400 text-xs font-bold mb-1">
              <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Demo Environment</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Synthetic healthcare data. Fully functional proactive resource logic.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
