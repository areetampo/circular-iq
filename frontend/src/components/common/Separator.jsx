/** Horizontal or vertical rule sized as a percentage of its container. */

import PropTypes from 'prop-types';

import { cn } from '@/utils/cn';

const variants = {
  primary: 'bg-(--color-border-ui)',
  secondary: 'bg-taupe-400',
};

/**
 * Renders a horizontal or vertical separator with percentage-based length and configurable thickness.
 */
export default function Separator({
  variant = 'primary',
  orientation = 'horizontal',
  wrapperCn,
  separatorCn,
  pct = 100,
  thickness = 1.5,
  ...props
}) {
  const variantCn = variants[variant] || variants.primary;

  return (
    <div
      {...props}
      className={cn(
        'flex items-center justify-center',
        // Vertical separators need parent flex height so their percentage length can resolve.
        orientation === 'horizontal' ? 'w-full' : 'h-auto shrink-0 self-stretch',
        wrapperCn,
      )}
    >
      <div
        style={{
          ...(orientation === 'horizontal' && { width: `${pct}%`, height: `${thickness}px` }),
          // Fallback height keeps vertical rules visible in compact flex rows.
          ...(orientation === 'vertical' && {
            height: `${pct}%`,
            width: `${thickness}px`,
            minHeight: '0.5em',
          }),
        }}
        className={cn('rounded-full', variantCn, separatorCn)}
      />
    </div>
  );
}

Separator.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'default']),
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  wrapperCn: PropTypes.string,
  separatorCn: PropTypes.string,
  pct: PropTypes.number,
  thickness: PropTypes.number,
};
