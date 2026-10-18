import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = status.toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (norm.includes('critical') || norm.includes('expired') || norm.includes('absent') || norm.includes('occupied') || norm.includes('emergency')) {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (norm.includes('low') || norm.includes('warning') || norm.includes('cleaning') || norm.includes('urgent') || norm.includes('pending') || norm.includes('watch')) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (norm.includes('healthy') || norm.includes('available') || norm.includes('present') || norm.includes('approved') || norm.includes('completed') || norm.includes('routine')) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (norm.includes('in consultation') || norm.includes('info')) {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-semibold rounded-md border ${padding} ${colorClasses} tracking-tight`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {status}
    </span>
  );
};
