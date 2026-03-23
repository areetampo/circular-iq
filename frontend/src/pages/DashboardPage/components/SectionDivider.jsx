import { cn } from '@/utils/cn';
import PropTypes from 'prop-types';

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

function SectionDivider({ icon: Icon, title, subtitle, accent = 'emerald' }) {
  const barColor =
    {
      emerald: '#10b981',
      blue: '#3b82f6',
      indigo: '#6366f1',
      purple: '#8b5cf6',
      amber: '#f59e0b',
      cyan: '#06b6d4',
    }[accent] ?? '#94a3b8';
  const iconCls = ICON_CLS[accent] ?? 'bg-slate-100 text-slate-600';
  return (
    <div className="flex items-center gap-4 mb-5">
      <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: barColor }} />
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', iconCls)}
          >
            <Icon size={15} strokeWidth={2} />
          </div>
        )}
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5 leading-tight">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

SectionDivider.propTypes = {
  /** Icon component to display in the header */
  icon: PropTypes.elementType,
  /** Main title text for the section */
  title: PropTypes.string.isRequired,
  /** Optional subtitle text (shown below title) */
  subtitle: PropTypes.string,
  /** Color accent for icon and divider bar: 'emerald', 'blue', 'indigo', 'purple', 'amber', 'cyan' */
  accent: PropTypes.string,
};

export { SectionDivider };
export default SectionDivider;
