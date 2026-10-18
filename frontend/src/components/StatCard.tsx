import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  subValue?: string;
  icon: LucideIcon;
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'teal';
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  subValue,
  icon: Icon,
  variant = 'default',
  badge
}) => {
  const iconColors = {
    default: 'bg-slate-100 text-slate-700',
    danger: 'bg-rose-50 text-rose-600',
    warning: 'bg-amber-50 text-amber-600',
    success: 'bg-emerald-50 text-emerald-600',
    teal: 'bg-teal-50 text-teal-600'
  };

  const valueColors = {
    default: 'text-slate-900',
    danger: 'text-rose-600',
    warning: 'text-amber-600',
    success: 'text-emerald-700',
    teal: 'text-teal-700'
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">{title}</span>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              {badge}
            </span>
          )}
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColors[variant]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-extrabold tracking-tight ${valueColors[variant]}`}>
          {value}
        </span>
        {subValue && (
          <span className="text-sm font-semibold text-slate-500">
            {subValue}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
};
