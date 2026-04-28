import PropTypes from 'prop-types';

import { cn } from '@/utils/cn';

const variants = {
  primary: 'bg-(--color-border-ui)',
  secondary: 'bg-(--color-danger-soft-ui)',
};

/**
 * Separator component with configurable percentage for horizontal/vertical orientation
 * @param {Object} props
 * @param {string} props.variant - Separator variant (primary, secondary)
 * @param {string} props.orientation - Separator orientation (horizontal, vertical)
 * @param {string} props.wrapperCn - Wrapper class names
 * @param {string} props.separatorCn - Separator class names
 * @param {number} props.pct - Percentage of the container to fill (0-100)
 * @param {number} props.thickness - Thickness of the separator in pixels (default: 1.5)
 */
export default function Separator({
  variant = 'primary',
  orientation = 'horizontal',
  wrapperCn,
  separatorCn,
  pct = 100,
  thickness = 1.5,
}) {
  const variantCn = variants[variant] || variants.primary;

  return (
    <div
      className={cn(
        'flex items-center justify-center',
        orientation === 'horizontal' ? 'w-full' : 'shrink-0',
        wrapperCn,
      )}
    >
      <div
        style={{
          ...(orientation === 'horizontal' && { width: `${pct}%`, height: `${thickness}px` }),
          ...(orientation === 'vertical' && { height: '1em', width: `${thickness}px` }),
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
