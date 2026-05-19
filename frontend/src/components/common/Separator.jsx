/**
 * @module Separator
 * @description Horizontal rule divider aligned to the design system spacing scale.
 */

import PropTypes from 'prop-types';

import { cn } from '@/utils/cn';

const variants = {
  primary: 'bg-(--color-border-ui)',
  secondary: 'bg-taupe-400',
};

/**
 * Separator component with configurable percentage for horizontal/vertical orientation
 *
 * @param {Object} props - Component props
 * @param {'primary'|'secondary'} [props.variant='primary'] - Separator variant (primary, secondary)
 * @param {'horizontal'|'vertical'} [props.orientation='horizontal'] - Separator orientation (horizontal, vertical)
 * @param {string} [props.wrapperCn] - Wrapper class names
 * @param {string} [props.separatorCn] - Separator class names
 * @param {number} [props.pct=100] - Percentage of container to fill (0-100)
 * @param {number} [props.thickness=1.5] - Thickness of separator in pixels (default: 1.5)
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element} Rendered Separator component
 *
 * @example
 * Basic horizontal separator
 * <Separator />
 *
 * @example
 * Custom variant and percentage
 * <Separator variant="secondary" pct={50} />
 *
 * @example
 * Vertical separator
 * <Separator orientation="vertical" thickness={2} />
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
        // 'self-stretch' ensures it fills the height of the flex row
        // 'h-auto' allows it to be governed by the percentage style
        orientation === 'horizontal' ? 'w-full' : 'h-auto shrink-0 self-stretch',
        wrapperCn,
      )}
    >
      <div
        style={{
          ...(orientation === 'horizontal' && { width: `${pct}%`, height: `${thickness}px` }),
          // We use min-height '0.5em' as a fallback so it's never 0px
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
