import React from 'react';

interface StatCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'emerald' | 'navy' | 'rose' | 'amber' | 'slate';
  badge?: string;
  badgeType?: 'success' | 'danger' | 'warning' | 'neutral';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon,
  variant = 'slate',
  badge,
  badgeType = 'neutral',
  onClick
}) => {
  let iconBg = 'bg-slate-100 text-slate-700';
  let borderHover = 'hover:border-slate-300';

  if (variant === 'emerald') {
    iconBg = 'bg-emerald-100 text-emerald-700';
    borderHover = 'hover:border-emerald-300';
  } else if (variant === 'navy') {
    iconBg = 'bg-slate-900 text-emerald-400';
    borderHover = 'hover:border-slate-400';
  } else if (variant === 'rose') {
    iconBg = 'bg-rose-100 text-rose-700';
    borderHover = 'hover:border-rose-300';
  } else if (variant === 'amber') {
    iconBg = 'bg-amber-100 text-amber-700';
    borderHover = 'hover:border-amber-300';
  }

  let badgeBg = 'bg-slate-100 text-slate-600';
  if (badgeType === 'success') badgeBg = 'bg-emerald-100 text-emerald-800';
  if (badgeType === 'danger') badgeBg = 'bg-rose-100 text-rose-800';
  if (badgeType === 'warning') badgeBg = 'bg-amber-100 text-amber-800';

  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md ' + borderHover : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        <div className={`p-2.5 rounded-xl shrink-0 ${iconBg}`}>{icon}</div>
      </div>

      <div className="mt-3">
        <p className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {value}
        </p>

        {(subtitle || badge) && (
          <div className="flex items-center gap-2 mt-2">
            {badge && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md leading-none ${badgeBg}`}>
                {badge}
              </span>
            )}
            {subtitle && <span className="text-xs text-slate-500 truncate">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
