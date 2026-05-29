/** Page section title with optional leading icon; large and small typography variants. */

import PropTypes from 'prop-types';

import { cn } from '@/utils/cn';

/**
 * Renders a section heading with optional leading icon and size-specific typography.
 */
export default function SectionHeading({
  children,
  variant = 'large',
  icon = null,
  className = '',
  ...props
}) {
  const baseClasses =
    variant === 'large'
      ? 'font-sans uppercase pl-2 text-[1.25rem] font-medium text-(--foreground) tracking-[-0.02em]'
      : 'text-sm uppercase tracking-widest text-(--foreground) font-semibold font-sans';

  return (
    <div {...props} className={cn('mb-6 flex items-center gap-2', className)}>
      {icon && <div className="shrink-0">{icon}</div>}
      <h3 className={baseClasses}>{children}</h3>
    </div>
  );
}

SectionHeading.propTypes = {
  /** Heading text content */
  children: PropTypes.node.isRequired,
  /** Heading variant: 'large' for main sections, 'small' for component sections */
  variant: PropTypes.oneOf(['large', 'small']),
  /** Optional icon component to display before heading */
  icon: PropTypes.node,
  /** Additional CSS classes */
  className: PropTypes.string,
};
