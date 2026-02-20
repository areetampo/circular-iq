import React from 'react';
import PropTypes from 'prop-types';
import { Check, Globe, Globe2, Lock, LockOpen, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Switch } from '@/components/common';

/**
 * ChoiceCardSwitch — visual choice card that toggles an embedded HeroUI Switch.
 * - Wraps `@heroui/react` Switch (no custom switch implementation)
 * - Click anywhere on the card to toggle
 * - Preserves previous API (drop-in replacement)
 */
export default function ChoiceCardSwitch({
  isSelected = false,
  onChange = () => {},
  title = '',
  description = '',
  icon = null,
  variant = 'default',
  size = 'md',
  trailing = null,
  className = '',
  disabled = false,
  ...rest
}) {
  const variants = {
    emerald: {
      selected: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300 shadow-sm',
      unselected: 'bg-slate-50 border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50',
      iconSelected: 'text-emerald-600',
      iconUnselected: 'text-slate-600 group-hover/toggle:text-emerald-600',
    },
    blue: {
      selected: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 shadow-sm',
      unselected: 'bg-slate-50 border-slate-200 hover:border-blue-200 hover:bg-blue-50/50',
      iconSelected: 'text-blue-600',
      iconUnselected: 'text-slate-600 group-hover/toggle:text-blue-600',
    },
    default: {
      selected: 'bg-slate-50 border-slate-200 shadow-sm',
      unselected: 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-50/50',
      iconSelected: 'text-slate-700',
      iconUnselected: 'text-slate-600',
    },
  };

  const theme = variants[variant] || variants.default;
  const selected = !!isSelected;

  // icons map following HeroUI `With Icons` pattern — choose by title/variant
  const icons = {
    public: { off: Lock, on: LockOpen, selectedControlClass: 'bg-emerald-500/80' },
    benchmarks: { off: X, on: Check, selectedControlClass: 'bg-blue-500/80' },
    default: {
      off: X,
      on: Check,
      selectedControlClass:
        variant === 'emerald' ? 'bg-emerald-500/80' : variant === 'blue' ? 'bg-blue-500/80' : '',
    },
  };

  const isPublicCard = typeof title === 'string' && /public/i.test(title);
  const isGlobalBenchmarksCard = typeof title === 'string' && /benchmark|global/i.test(title);
  const iconKey = isPublicCard ? 'public' : isGlobalBenchmarksCard ? 'benchmarks' : 'default';
  const ThumbOn = icons[iconKey].on;
  const ThumbOff = icons[iconKey].off;
  const selectedControlClass = icons[iconKey].selectedControlClass || '';

  // compute numeric icon size based on `size` prop (use largest breakpoint)
  // const iconSize = size === 'sm' ? 12 : size === 'lg' ? 20 : 14; // md -> 16px (lg:w-4), lg -> 20px (lg:w-5)

  return (
    <Switch
      isSelected={isSelected}
      onChange={onChange}
      isDisabled={disabled}
      // size={size} //ResponsiveSizeWrapper used in components/common/Switch to auto-adjust size based on screen
      className={cn(
        'w-full group/toggle flex items-center justify-between gap-2 sm:gap-3 p-2 sm:p-4 rounded-xl border transition-all duration-300 cursor-pointer min-h-14 sm:min-h-16',
        selected ? theme.selected : theme.unselected,
        className,
      )}
      {...rest}
    >
      {({ isSelected: sel }) => (
        <>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {icon && (
              <span
                className={cn(
                  'shrink-0 transition-transform duration-300',
                  'group-hover/toggle:scale-[1.18] group-hover/toggle:-rotate-[8deg] group-hover/toggle:drop-shadow-md',
                  sel ? theme.iconSelected : theme.iconUnselected,
                )}
                aria-hidden="true"
              >
                {icon}
              </span>
            )}

            <div className="flex-1 min-w-0">
              <div className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                {title}
              </div>
              {description && (
                <div className="text-xs sm:text-sm text-slate-600 whitespace-normal">
                  {description}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Switch.Control className={sel ? selectedControlClass : ''}>
              <Switch.Thumb>
                <Switch.Icon>
                  {sel ? (
                    <ThumbOn size={15} className={`${theme.iconSelected} opacity-100`} />
                  ) : (
                    <ThumbOff size={15} className="text-slate-500 opacity-70" />
                  )}
                </Switch.Icon>
              </Switch.Thumb>
            </Switch.Control>

            {trailing && <div className="ml-2">{trailing}</div>}
          </div>
        </>
      )}
    </Switch>
  );
}

ChoiceCardSwitch.propTypes = {
  isSelected: PropTypes.bool,
  onChange: PropTypes.func,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  icon: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'emerald', 'blue']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  trailing: PropTypes.node,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};
