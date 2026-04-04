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
              ? 'border-(--color-accent) text-(--color-accent) bg-(--color-accent-light)'
              : 'border-[rgba(180,160,130,0.25)] text-(--color-text-muted) bg-transparent hover:border-(--color-accent) hover:text-(--color-accent)'
          } border transition-all duration-200 cursor-pointer`,
        };

      case 'tag':
        return {
          variant: 'flat',
          radius: 'sm',
          size: 'sm',
          className:
            'font-medium text-xs bg-(--color-accent-light) text-(--color-text-primary) border-[rgba(180,160,130,0.3)] border transition-all duration-200',
        };

      case 'info':
        return {
          variant: 'flat',
          radius: 'sm',
          size: 'sm',
          className: `font-medium text-xs bg-(--color-accent-light) text-(--color-text-primary) border-[rgba(180,160,130,0.3)] border transition-all duration-200 ${
            color === 'success'
              ? 'border-(--color-success) text-(--color-success)'
              : color === 'warning'
                ? 'border-(--color-warning) text-(--color-warning)'
                : color === 'danger'
                  ? 'border-(--color-error) text-(--color-error)'
                  : ''
          }`,
        };

      case 'status':
        return {
          variant: 'flat',
          radius: 'sm',
          size: 'sm',
          className:
            'font-semibold text-xs tracking-wider uppercase bg-(--color-accent-light) text-(--color-text-primary) border-[rgba(180,160,130,0.3)] border transition-all duration-200',
        };

      case 'match':
        return {
          variant: 'flat',
          radius: 'full',
          size: 'sm',
          className: `font-mono text-xs border transition-all duration-200 ${
            color === 'strong'
              ? 'bg-[#d4f1d4] text-[#2d5016] border-[#d4f1d4]'
              : color === 'decent'
                ? 'bg-[#f5e6d3] text-[#92400e] border-[#f5e6d3]'
                : color === 'weak'
                  ? 'bg-[#fef2f2] text-[#dc2626] border-[#fef2f2]'
                  : 'bg-(--color-accent-light) text-(--color-text-primary) border-[rgba(180,160,130,0.3)]'
          }`,
        };

      default:
        return {
          variant: 'flat',
          radius: 'sm',
          size: 'sm',
          className:
            'bg-accent-400 text-(--color-text-primary) border-[rgba(180,160,130,0.3)] border transition-all duration-200',
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
