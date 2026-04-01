import { clsx } from 'clsx';
import PropTypes from 'prop-types';

/**
 * Variant styles for luxury minimal chip system
 * Based on UI 39-42 specifications
 */
const variantStyles = {
  // Industry filter chips on MyAssessments
  filter:
    'bg-transparent border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] text-xs px-3 py-1 rounded-md cursor-pointer hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors',
  'filter-active':
    'bg-[var(--color-accent)] border border-[var(--color-accent)] text-white text-xs px-3 py-1 rounded-md cursor-pointer',

  // Informational tags in drawers/cards
  tag: 'bg-[var(--color-accent-light)] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-[11px] px-2 py-0.5 rounded-md',

  // Score/metric display
  score:
    'bg-transparent border border-[var(--color-border)] text-[var(--color-text-secondary)] text-[11px] px-2 py-0.5 rounded-md font-mono',

  // Status (UNRATED, PUBLIC etc)
  status:
    'bg-transparent border border-[var(--color-border-strong)] text-[var(--color-text-muted)] text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider',

  // Category labels
  category:
    'bg-[var(--color-accent-light)] text-[var(--color-accent)] text-[11px] px-2 py-0.5 rounded-md',

  // Default fallback
  default:
    'bg-[var(--color-accent-light)] text-[var(--color-text-secondary)] text-xs px-2 py-0.5 rounded-md',
};

/**
 * Custom Chip component with luxury minimal variant system
 * Replaces old complex variant system with new simplified one
 *
 * @param {Object} props - Chip props
 * @param {string} props.variant - Chip variant (filter, filter-active, tag, score, status, category)
 * @param {ReactNode} props.children - Chip content
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Click handler
 */
export function Chip({ variant = 'tag', children, className, onClick, ...props }) {
  const baseClasses = 'inline-flex items-center font-[var(--font-body)]';

  return (
    <span
      className={clsx(
        baseClasses,
        variantStyles[variant] || variantStyles.default,
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </span>
  );
}

Chip.propTypes = {
  variant: PropTypes.oneOf([
    'filter',
    'filter-active',
    'tag',
    'score',
    'status',
    'category',
    'default',
  ]),
  children: PropTypes.node,
  className: PropTypes.string,
  onClick: PropTypes.func,
};

export default Chip;
