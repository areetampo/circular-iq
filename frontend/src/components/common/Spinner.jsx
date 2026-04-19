/**
 * Spinner Component
 * Reusable loading spinner component
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

export default function Spinner({ size = 16, className }) {
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
    <Ring2 size={size} stroke="2" speed="0.8" color="var(--color-checkbox)" />
    // </div>
  );
}

Spinner.propTypes = {
  size: PropTypes.number,
  className: PropTypes.string,
};
