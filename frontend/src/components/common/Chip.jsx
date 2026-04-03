import { Chip as HeroChip } from '@heroui/react';
import PropTypes from 'prop-types';

/**
 * Custom Chip component wrapping HeroUI Chip with UI-48 variants
 * Variants: filter, tag, info, status, match
 */
export function Chip({ variant = 'tag', color, children, className, onClick, active, ...props }) {
  // Map UI-48 variants to HeroUI props with custom styling
  const getChipProps = () => {
    switch (variant) {
      case 'filter':
        return {
          variant: 'flat',
          radius: 'full',
          size: 'sm',
          className: `font-medium ${
            active
              ? 'bg-(--accent) text-(--foreground) border-(--accent)'
              : 'bg-(--color-accent-light) text-(--foreground) border-[rgba(180,160,130,0.3)]'
          } border transition-all duration-200`,
        };

      case 'tag':
        return {
          variant: 'flat',
          radius: 'sm',
          size: 'sm',
          className:
            'font-medium text-xs bg-(--color-accent-light) text-(--foreground) border-[rgba(180,160,130,0.3)] border transition-all duration-200',
        };

      case 'info':
        return {
          variant: 'flat',
          radius: 'sm',
          size: 'sm',
          className: `font-medium text-xs bg-(--color-accent-light) text-(--foreground) border-[rgba(180,160,130,0.3)] border transition-all duration-200 ${
            color === 'success'
              ? 'border-(--success) text-(--success)'
              : color === 'warning'
                ? 'border-(--warning) text-(--warning)'
                : color === 'danger'
                  ? 'border-(--danger) text-(--danger)'
                  : ''
          }`,
        };

      case 'status':
        return {
          variant: 'flat',
          radius: 'sm',
          size: 'sm',
          className:
            'font-semibold text-xs tracking-wider uppercase bg-(--color-accent-light) text-(--foreground) border-[rgba(180,160,130,0.3)] border transition-all duration-200',
        };

      case 'match':
        return {
          variant: 'flat',
          radius: 'sm',
          size: 'sm',
          className: `font-medium text-xs border transition-all duration-200 ${
            color === 'strong'
              ? 'bg-[#f0f9ff] text-[#0369a1] border-[#0369a1]'
              : color === 'decent'
                ? 'bg-[#f3f4f6] text-[#475569] border-[#475569]'
                : color === 'weak'
                  ? 'bg-[#fef2f2] text-[#a8a29e] border-[#a8a29e]'
                  : 'bg-(--color-accent-light) text-(--foreground) border-[rgba(180,160,130,0.3)]'
          }`,
        };

      default:
        return {
          variant: 'flat',
          radius: 'sm',
          size: 'sm',
          className:
            'bg-(--color-accent-light) text-(--foreground) border-[rgba(180,160,130,0.3)] border transition-all duration-200',
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
  variant: PropTypes.oneOf(['filter', 'tag', 'info', 'status', 'match']),
  color: PropTypes.oneOf([
    'default',
    'accent',
    'success',
    'warning',
    'danger',
    'strong',
    'decent',
    'weak',
  ]),
  children: PropTypes.node,
  className: PropTypes.string,
  onClick: PropTypes.func,
  active: PropTypes.bool, // for filter variant
};

export default Chip;
