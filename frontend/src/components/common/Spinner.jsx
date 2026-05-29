/** Lightweight Ring2 loading indicator for buttons, checkboxes, and inline states. */

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

/**
 * Renders the ldrs Ring2 indicator with configurable size and color.
 */
export default function Spinner({
  size = 16,
  color = 'var(--color-dark-brown)',
  className,
  ...props
}) {
  return (
    //* custom
    // <div className="flex items-center justify-center">
    //   <div
    //     className={cn(
    //       'animate-spin rounded-full border-2 border-(--color-dark-brown-hover)/50 border-t-(--color-dark-brown-hover)',
    //       className,
    //       sizeClasses[size],
    //     )}
    //     style={{ animation: 'spin 0.7s linear infinite' }}
    //   />
    // </div>

    //* from ldrs
    //? removing div since it makes the icon shift position
    // <div className={cn('bg-red-200 ', className)}>
    <Ring2 {...props} size={size} stroke="2" speed="0.8" color={color} />
    // </div>
  );
}

Spinner.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
  className: PropTypes.string,
};
