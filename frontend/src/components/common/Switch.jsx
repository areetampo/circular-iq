import { Switch as HeroSwitch } from '@heroui/react';
import { Check, Lock, LockOpen, X } from 'lucide-react';
import PropTypes from 'prop-types';
import React, { createContext, useContext, useMemo } from 'react';

import { ResponsiveSizeWrapper } from '@/components/common';
import { cn } from '@/utils/cn';

// our own context allows subcomponents to know which variant and
// what pixel icon size should be used.  the responsive wrapper only
// gives the computed size to the immediate HeroSwitch element, so we
// expose it here via context so Icon/Control wrappers can consume it.
const SwitchContext = createContext({
  variant: 'default',
  iconSize: 14,
  theme: {},
});

// variant themes for the two special cases we care about plus a default
const VARIANT_THEMES = {
  default: {
    iconOn: Check,
    iconOff: X,
    controlSelectedClass: '',
    controlUnselectedClass: 'bg-slate-200',
    iconOnClass: 'text-slate-700',
    iconOffClass: 'text-slate-500',
  },
  public: {
    iconOn: LockOpen,
    iconOff: Lock,
    controlSelectedClass: 'bg-emerald-500/80',
    controlUnselectedClass: 'bg-slate-200',
    iconOnClass: 'text-emerald-600 opacity-100',
    iconOffClass: 'text-slate-500 opacity-70',
  },
  benchmarks: {
    iconOn: Check,
    iconOff: X,
    controlSelectedClass: 'bg-blue-500/80',
    controlUnselectedClass: 'bg-slate-200',
    iconOnClass: 'text-blue-600 opacity-100',
    iconOffClass: 'text-slate-500 opacity-70',
  },
};

function computeIconSize(size) {
  // match the logic previously spelled out in ChoiceCardSwitch comments
  if (size === 'sm') return 10;
  if (size === 'md') return 16;
  if (size === 'lg') return 17;
  return 14; // fallback for unexpected sizes
}

const Switch = React.forwardRef(function Switch(
  { size = 'sm xxs:md sm:lg', variant = 'default', children, ...props },
  ref,
) {
  // derive current selection value: prefer controlled prop, fallback to
  // defaultSelected (uncontrolled) if provided.  we don't track selection
  // ourselves; our consumer pattern always passes isSelected as needed.
  const internalSelected = props.defaultSelected || false;
  const isSelectedValue = props.isSelected != null ? props.isSelected : internalSelected;

  return (
    <ResponsiveSizeWrapper size={size}>
      {(computedSize) => {
        const iconSize = computeIconSize(computedSize);
        const theme = VARIANT_THEMES[variant] || VARIANT_THEMES.default;
        const contextValue = useMemo(
          () => ({ variant, iconSize, theme, isSelected: isSelectedValue }),
          [variant, iconSize, theme, isSelectedValue],
        );

        return (
          <SwitchContext.Provider value={contextValue}>
            {/* forward ref so parent components can access the underlying input */}
            <HeroSwitch ref={ref} size={computedSize} {...props}>
              {children}
            </HeroSwitch>
          </SwitchContext.Provider>
        );
      }}
    </ResponsiveSizeWrapper>
  );
});

// wrappers that automatically apply variant-specific styling/icons
Switch.Control = React.forwardRef(function Control({ className = '', ...props }, ref) {
  const { theme, isSelected } = useContext(SwitchContext);
  const appliedClass = isSelected ? theme.controlSelectedClass : theme.controlUnselectedClass || '';
  return <HeroSwitch.Control ref={ref} className={cn(appliedClass, className)} {...props} />;
});

Switch.Thumb = HeroSwitch.Thumb;

Switch.Icon = React.forwardRef(function Icon({ children, className = '', ...props }, ref) {
  const { theme, iconSize, isSelected } = useContext(SwitchContext);

  // if user supplied their own children, just forward them unchanged
  if (children) {
    return (
      <HeroSwitch.Icon ref={ref} className={className} {...props}>
        {children}
      </HeroSwitch.Icon>
    );
  }

  // otherwise render the appropriate icon based on current selection
  const IconComp = isSelected ? theme.iconOn : theme.iconOff;
  const colorClass = isSelected ? theme.iconOnClass : theme.iconOffClass;
  return (
    <HeroSwitch.Icon ref={ref} className={className} {...props}>
      <IconComp size={iconSize} className={colorClass} />
    </HeroSwitch.Icon>
  );
});

Switch.propTypes = {
  // responsive size string (same semantics as before)
  size: PropTypes.string,
  // theme variants offered by this wrapper (defaults to "default")
  variant: PropTypes.oneOf(['default', 'public', 'benchmarks']),

  // props forwarded to HeroSwitch
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
