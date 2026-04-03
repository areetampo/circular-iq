import { Switch } from '@heroui/react';
import PropTypes from 'prop-types';

import { cn } from '@/utils/cn';

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
  variant = 'default', // card color variant
  size = 'md',
  // allow callers to override which switch theme should be applied; if
  // omitted we'll infer from the card variant (emerald -> public,
  // blue -> benchmarks).
  switchVariant,
  trailing = null,
  className = '',
  disabled = false,
  ...rest
}) {
  const variants = {
    emerald: {
      selected:
        'bg-linear-to-br from-[var(--success-soft)] to-[var(--info-soft)] border-[var(--success)] shadow-sm',
      unselected:
        'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--success)] hover:bg-[var(--success-soft)]/50',
      iconSelected: 'text-[var(--success)]',
      iconUnselected: 'text-muted group-hover/toggle:text-[var(--success)]',
    },
    blue: {
      selected:
        'bg-linear-to-br from-[var(--info-soft)] to-[var(--accent-soft)] border-[var(--info)] shadow-sm',
      unselected:
        'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--info)] hover:bg-[var(--info-soft)]/50',
      iconSelected: 'text-[var(--info)]',
      iconUnselected: 'text-muted group-hover/toggle:text-[var(--info)]',
    },
    default: {
      selected: 'bg-[var(--surface)] border-[var(--border)] shadow-sm',
      unselected:
        'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--foreground)]/20 hover:bg-[var(--surface-raised)]/50',
      iconSelected: 'text-foreground',
      iconUnselected: 'text-muted',
    },
  };

  const theme = variants[variant] || variants.default;
  const selected = !!isSelected;

  // determine switch variant based on card color unless explicitly set
  const switchVariantMap = {
    emerald: 'public',
    blue: 'benchmarks',
    default: 'default',
  };
  const finalSwitchVariant = switchVariant || switchVariantMap[variant] || 'default';

  return (
    <Switch
      isSelected={isSelected}
      onChange={onChange}
      isDisabled={disabled}
      size={size}
      className={cn(
        'w-full group/toggle flex items-center justify-between gap-2 sm:gap-3 p-2 sm:p-4 rounded-xl border transition-all duration-200 ease-out cursor-pointer min-h-14 sm:min-h-16',
        'will-change-colors will-change-shadow',
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
                  'shrink-0 transition-all duration-200 ease-out',
                  'will-change-transform',
                  'group-hover/toggle:scale-[1.18] group-hover/toggle:-rotate-[8deg] group-hover/toggle:drop-shadow-md',
                  sel ? theme.iconSelected : theme.iconUnselected,
                )}
                aria-hidden="true"
              >
                {icon}
              </span>
            )}

            <div className="flex-1 min-w-0">
              <div className="text-sm sm:text-base font-semibold text-foreground truncate">
                {title}
              </div>
              <div className="flex items-center gap-0.5">
                {description && (
                  <div className="text-xs sm:text-sm text-muted whitespace-normal">
                    {description}
                  </div>
                )}
                {trailing && <>{trailing}</>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Switch.Control />
            <Switch.Thumb />
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
  switchVariant: PropTypes.oneOf(['default', 'public', 'benchmarks']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  trailing: PropTypes.node,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};
