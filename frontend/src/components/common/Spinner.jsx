/**
 * Spinner Component
 * Reusable loading spinner component with customizable size and color
 *
 * @param {Object} props - Component props
 * @param {number} [props.size=16] - Size of spinner in pixels
 * @param {string} [props.color='var(--color-checkbox)'] - Color of spinner
 * @param {string} [props.className] - HTML classes
 * @param {Object.<string, any>} props - Additional attributes to spread to element
 * @returns {JSX.Element} Rendered Spinner component
 *
 * @example
 * Basic usage
 * <Spinner />
 *
 * @example
 * Custom size and color
 * <Spinner size={24} color="#ff0000" />
 */

import { Ring2 } from 'ldrs/react';
import 'ldrs/react/Ring2.css';
import PropTypes from 'prop-types';

// import { cn } from '@/utils/cn';

//* example usage with checkbox
/* <Checkbox
  isSelected={selected}
  onChange={change}
  isDisabled={disabled}
  ...
>
  {disabled ? (
    <Spinner />
  ) : (
    <Checkbox.Control>
      <Checkbox.Indicator />
    </Checkbox.Control>
  )}
  <Checkbox.Content>
    <Label>
    </Label>
  </Checkbox.Content>
</Checkbox> */

//* check components/common/button for another usage example

export default function Spinner({
  size = 16,
  color = 'var(--color-checkbox)',
  className,
  ...props
}) {
  return (
    //* custom
    // <div className="flex items-center justify-center">
    //   <div
    //     className={cn(
    //       'animate-spin rounded-full border-2 border-(--color-checkbox-hover)/50 border-t-(--color-checkbox-hover)',
    //       className,
    //       sizeClasses[size],
    //     )}
    //     style={{ animation: 'spin 0.7s linear infinite' }}
    //   />
    // </div>

    //* from ldrs
    //? removing div since it makes the icon shift position
    // <div className={cn('bg-red-200 ', className)}>
    <Ring2 size={size} stroke="2" speed="0.8" color={color} {...props} />
    // </div>
  );
}

Spinner.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
  className: PropTypes.string,
};
