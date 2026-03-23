import { Skeleton } from '@heroui/react';
import PropTypes from 'prop-types';

import { cn } from '@/utils/cn';

const ICON_CLS = {
  emerald: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-blue-50   text-blue-600',
  purple: 'bg-purple-50 text-purple-600',
  amber: 'bg-amber-50  text-amber-600',
  rose: 'bg-rose-50   text-rose-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  teal: 'bg-teal-50   text-teal-600',
  cyan: 'bg-cyan-50   text-cyan-600',
};

function StatCard({ label, value, sub, icon: Icon, color = 'emerald', loading, wide }) {
  if (loading) {
    return (
      <div
        className={cn(
          'rounded-xl border border-slate-200 bg-white p-5 space-y-2.5',
          wide && 'col-span-2 sm:col-span-1',
        )}
      >
        <Skeleton className="h-2.5 w-14 rounded-full" />
        <Skeleton className="h-7 w-20 rounded" />
        {sub !== undefined && <Skeleton className="h-2.5 w-24 rounded-full" />}
      </div>
    );
  }
  const iconCls = ICON_CLS[color] ?? 'bg-slate-50 text-slate-600';
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 hover:shadow-sm transition-all duration-150',
        wide && 'col-span-2 sm:col-span-1',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 leading-tight">
            {label}
          </p>
          <p className="text-2xl font-bold text-slate-900 leading-none tabular-nums">
            {value ?? '—'}
          </p>
          {sub && <p className="text-[11px] text-slate-400 mt-1.5 leading-tight">{sub}</p>}
        </div>
        {Icon && (
          <div
            className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', iconCls)}
          >
            <Icon size={16} strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  );
}

StatCard.propTypes = {
  /** Label text displayed above the value */
  label: PropTypes.string.isRequired,
  /** Main numeric or text value to display */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Secondary text displayed below the value */
  sub: PropTypes.string,
  /** Icon component to display in the top right */
  icon: PropTypes.elementType,
  /** Color theme: 'emerald', 'blue', 'purple', 'amber', 'rose', 'indigo', 'teal', 'cyan' */
  color: PropTypes.string,
  /** Whether to show skeleton loading state */
  loading: PropTypes.bool,
  /** Whether the card should span 2 columns (on small screens) */
  wide: PropTypes.bool,
};

export { StatCard };
export default StatCard;
