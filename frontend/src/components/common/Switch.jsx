import { Switch as HeroSwitch, Label } from '@heroui/react';
import { BarChart3, Check, Globe, Lock, X } from 'lucide-react';
import PropTypes from 'prop-types';
import { createContext, useContext } from 'react';

import { cn } from '@/utils/cn';

// Switch context for variant, icon size, and theme
const SwitchContext = createContext({
  variant: 'default',
  iconSize: 16,
  theme: null,
});

// variant themes for UI-48 specifications
const VARIANT_THEMES = {
  default: {
    iconOn: Check,
    iconOff: X,
    controlSelectedClass: 'bg-[var(--color-accent)]',
    controlUnselectedClass: 'bg-[rgba(180,160,130,0.3)]',
    iconOnClass: 'text-white',
    iconOffClass: 'text-[var(--color-text-muted)]',
  },
  public: {
    iconOn: Globe,
    iconOff: Lock,
    controlSelectedClass: 'bg-[#4a7c59]', // muted green when on
    controlUnselectedClass: 'bg-[rgba(180,160,130,0.3)]',
    iconOnClass: 'text-white',
    iconOffClass: 'text-[var(--color-text-muted)]',
  },
  benchmark: {
    iconOn: BarChart3,
    iconOff: X,
    controlSelectedClass: 'bg-[#5a7a9a]', // muted steel blue when on
    controlUnselectedClass: 'bg-[rgba(180,160,130,0.3)]',
    iconOnClass: 'text-white',
    iconOffClass: 'text-[var(--color-text-muted)]',
  },
};

export function Switch({
  variant = 'default',
  size = 'md',
  iconSize = 16,
  children,
  className = '',
  ...props
}) {
  const theme = VARIANT_THEMES[variant] || VARIANT_THEMES.default;
  const contextValue = {
    variant,
    iconSize,
    theme,
  };

  return (
    <SwitchContext.Provider value={contextValue}>
      <HeroSwitch size={size} className={cn('switch', className)} {...props}>
        {children}
      </HeroSwitch>
    </SwitchContext.Provider>
  );
}

// Subcomponents using HeroUI v3 structure
Switch.Control = HeroSwitch.Control;
Switch.Thumb = HeroSwitch.Thumb;

Switch.Content = function Content({ children, className = '', ...props }) {
  return (
    <HeroSwitch.Content className={cn('', className)} {...props}>
      {children}
    </HeroSwitch.Content>
  );
};

Switch.Label = function SwitchLabel({ children, className = '', ...props }) {
  return (
    <Label
      className={cn(
        'text-(--color-text-secondary) font-(--font-body)',
        'flex items-center gap-1',
        className,
      )}
      {...props}
    >
      {children}
    </Label>
  );
};

Switch.Icon = function Icon({ children, className = '', ...props }) {
  const { theme, iconSize, isSelected } = useContext(SwitchContext);

  // if user supplied their own children, just forward them unchanged
  if (children) {
    return (
      <HeroSwitch.Icon
        className={cn('transition-all duration-150 ease-out will-change-transform', className)}
        {...props}
      >
        {children}
      </HeroSwitch.Icon>
    );
  }

  // otherwise render the appropriate icon based on current selection
  const IconComp = isSelected ? theme.iconOn : theme.iconOff;
  const colorClass = isSelected ? theme.iconOnClass : theme.iconOffClass;

  return (
    <HeroSwitch.Icon
      className={cn('transition-all duration-150 ease-out will-change-colors', className)}
      {...props}
    >
      <IconComp size={iconSize} className={cn(colorClass, 'transition-colors duration-150')} />
    </HeroSwitch.Icon>
  );
};

Switch.propTypes = {
  variant: PropTypes.oneOf(['default', 'public', 'benchmark']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  iconSize: PropTypes.number,
  children: PropTypes.node,
  className: PropTypes.string,

  // props forwarded to HeroSwitch
  isSelected: PropTypes.bool,
  defaultSelected: PropTypes.bool,
  isDisabled: PropTypes.bool,
  name: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onPress: PropTypes.func,
  render: PropTypes.func,
};

export default Switch;
