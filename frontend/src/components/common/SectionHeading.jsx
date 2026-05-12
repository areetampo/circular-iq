import PropTypes from 'prop-types';

import { cn } from '@/utils/cn';

/**
 * SectionHeading Component
 * Reusable section heading with icon support
 *
 * @param {Object} props - Component props
 * @param {string} props.children - Heading text
 * @param {'large'|'small'} [props.variant='large'] - 'large' or 'small'
 * @param {ReactNode} [props.icon=null] - Optional icon component
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element} Rendered SectionHeading component
 *
 * @example
 * Basic usage
 * <SectionHeading>My Section</SectionHeading>
 *
 * @example
 * With icon and small variant
 * <SectionHeading variant="small" icon={<Icon />}>Subsection</SectionHeading>
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
    <div className={cn('mb-6 flex items-center gap-2', className)} {...props}>
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
