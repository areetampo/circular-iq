import React from 'react';
import PropTypes from 'prop-types';
import { Switch as HeroSwitch } from '@heroui/react';
import { ResponsiveSizeWrapper } from '@/components/common';

// Wrapper around HeroUI Switch that automatically adjusts size responsively
// and re-exports all of HeroUI's subcomponents so callers can compose as
// they would with the original component.
const Switch = React.forwardRef(function Switch({ size = 'md sm:lg', ...props }, ref) {
  // we support passing a size prop, which can be either a single value
  // (sm/md/lg) or a responsive string like "md sm:lg".  The
  // ResponsiveSizeWrapper will parse it and inject the correct size
  // into the HeroSwitch.  All remaining props are forwarded.
  return (
    <ResponsiveSizeWrapper size={size}>
      {/* forward ref so parent components can access the underlying input */}
      <HeroSwitch ref={ref} {...props} />
    </ResponsiveSizeWrapper>
  );
});

// expose the static slots/components from the original HeroUI Switch
// (only the parts that actually exist on the source component)
Switch.Control = HeroSwitch.Control;
Switch.Thumb = HeroSwitch.Thumb;
Switch.Icon = HeroSwitch.Icon;
// `Content` isn't exposed as a static property by the upstream component
// (usage typically just places arbitrary children or uses render props), so
// we don't re-export it here.

Switch.propTypes = {
  // most props are passed straight through to the underlying HeroUI Switch
  // we include the common ones here for documentation / runtime warnings
  // size can be a single value ('sm','md','lg') or a responsive
  // string like 'md sm:lg'.  It controls the switch size passed to
  // the underlying HeroUI component via ResponsiveSizeWrapper.
  size: PropTypes.string,
  isSelected: PropTypes.bool,
  defaultSelected: PropTypes.bool,
  isDisabled: PropTypes.bool,
  name: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onPress: PropTypes.func,
  children: PropTypes.node,
  render: PropTypes.func,
  className: PropTypes.string,
};

export default Switch;
