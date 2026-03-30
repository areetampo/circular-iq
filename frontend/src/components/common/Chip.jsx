import { clsx } from 'clsx';
import PropTypes from 'prop-types';

/**
 * Chip — concern-based chip component replacing HeroUI Chip site-wide.
 *
 * variant:
 *   'default'          neutral warm border, surface bg (metadata, secondary info)
 *   'accent'           accent-soft bg (tier labels, CE categories)
 *   'success'          success-soft bg (strengths, good status, strategy)
 *   'warning'          warning-soft bg (gaps, medium severity)
 *   'danger'           danger-soft bg (high severity, errors)
 *   'info'             info-soft bg (similarity %, informational)
 *   'muted'            no bg, muted text + border (subtle labels)
 *   'industry'         filter chip — bordered, hover accent (My Assessments)
 *   'industry-active'  filter chip — active state, accent fill
 *   'score'            monospace bordered (numeric score display)
 */
const variantStyles = {
  default: 'bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)]',
  accent: 'bg-[var(--accent-soft)] text-[var(--accent-soft-fg)] border border-[var(--accent)]/20',
  success: 'bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/20',
  warning: 'bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)]/20',
  danger: 'bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/20',
  info: 'bg-[var(--info-soft)] text-[var(--info)] border border-[var(--info)]/20',
  muted: 'bg-transparent text-[var(--muted)] border border-[var(--border)]',
  industry:
    'bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-soft-fg)] transition-colors duration-150 cursor-pointer select-none',
  'industry-active':
    'bg-[var(--accent)] text-white border border-[var(--accent)] cursor-pointer select-none',
  score:
    'bg-transparent text-[var(--foreground)] border border-[var(--border)] font-mono tabular-nums',
};

const sizeStyles = {
  xs: 'px-1.5 py-0.5 text-[10px] font-semibold rounded-md',
  sm: 'px-2 py-0.5 text-[11px] font-medium rounded-md',
  md: 'px-2.5 py-1 text-xs font-medium rounded-md',
};

export function Chip({
  variant = 'default',
  size = 'sm',
  children,
  className,
  onClick,
  style,
  ...props
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center whitespace-nowrap leading-none',
        variantStyles[variant] ?? variantStyles.default,
        sizeStyles[size] ?? sizeStyles.sm,
        onClick && 'cursor-pointer',
        className,
      )}
      style={style}
      onClick={onClick}
      {...props}
    >
      {children}
    </span>
  );
}

Chip.propTypes = {
  variant: PropTypes.oneOf([
    'default',
    'accent',
    'success',
    'warning',
    'danger',
    'info',
    'muted',
    'industry',
    'industry-active',
    'score',
  ]),
  size: PropTypes.oneOf(['xs', 'sm', 'md']),
  children: PropTypes.node,
  className: PropTypes.string,
  onClick: PropTypes.func,
  style: PropTypes.object,
};

export default Chip;
