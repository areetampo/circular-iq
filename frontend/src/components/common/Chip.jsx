import { Chip as HeroChip } from '@heroui/react';
import PropTypes from 'prop-types';

/**
 * Custom Chip component wrapping HeroUI Chip with UI-48 variants
 * Variants: filter, tag, info, status
 */
export function Chip({ variant = 'tag', color, children, className, onClick, active, ...props }) {
  // Map UI-48 variants to HeroUI props
  const getChipProps = () => {
    switch (variant) {
      case 'filter':
        return {
          variant: 'flat',
          radius: 'full',
          size: 'sm',
          className: 'font-medium',
          color: active ? 'primary' : 'default',
        };

      case 'tag':
        return {
          variant: 'flat',
          radius: 'sm',
          size: 'sm',
          className: 'font-medium text-xs',
        };

      case 'info':
        return {
          variant: 'flat',
          radius: 'sm',
          size: 'sm',
          className: 'font-medium text-xs',
          color: color || 'default',
        };

      case 'status':
        return {
          variant: 'flat',
          radius: 'sm',
          size: 'sm',
          className: 'font-semibold text-xs tracking-wider uppercase',
        };

      default:
        return {
          variant: 'flat',
          radius: 'sm',
          size: 'sm',
        };
    }
  };

  const chipProps = getChipProps();

  return (
    <HeroChip {...chipProps} {...props} className={className} onClick={onClick}>
      {children}
    </HeroChip>
  );
}

Chip.propTypes = {
  variant: PropTypes.oneOf(['filter', 'tag', 'info', 'status']),
  color: PropTypes.oneOf(['default', 'accent', 'success', 'warning', 'danger']),
  children: PropTypes.node,
  className: PropTypes.string,
  onClick: PropTypes.func,
  active: PropTypes.bool, // for filter variant
};

export default Chip;
