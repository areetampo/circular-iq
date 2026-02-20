import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from '@heroui/react';
import { Copy, Check } from 'lucide-react';
import Button from './Button';
import { copyToClipboard } from '@/utils/ui';

/**
 * CopyButton
 * - Unified copy + tooltip behavior used across the app
 * - Supports controlled (isCopied + onCopiedChange) and uncontrolled mode
 * - Keeps Tooltip.Content lean (no custom classes) so it matches other tooltips
 */
export default function CopyButton({
  text,
  onPress,
  isCopied: controlledIsCopied,
  onCopiedChange,
  disabled = false,
  tooltip = 'Copy',
  copiedTooltip = 'Copied!',
  variant = 'info-soft',
  className,
  size = 'md',
  ...props
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);
  const isControlled = controlledIsCopied !== undefined;
  const effectiveCopied = isControlled ? controlledIsCopied : copied;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const setTransientCopied = () => {
    if (!isControlled) setCopied(true);
    if (onCopiedChange) onCopiedChange(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!isControlled) setCopied(false);
      if (onCopiedChange) onCopiedChange(false);
      timerRef.current = null;
    }, 1400);
  };

  const handleClick = async (ev) => {
    if (disabled) return;

    // If parent wants to handle the press (and copying), delegate to it.
    if (onPress) {
      try {
        const result = onPress(ev);
        // allow parent to manage copied state (controlled) or call onCopiedChange
        return result;
      } catch {
        // swallow - copy UI is non-blocking
        return;
      }
    }

    // Uncontrolled: perform copy ourselves
    if (text) {
      const ok = await copyToClipboard(text);
      if (!ok) return;
      setTransientCopied();
    }
  };

  return (
    <Tooltip delay={0} placement="top">
      <Tooltip.Trigger>
        <Button
          variant={variant}
          size={size}
          onPress={handleClick}
          isDisabled={disabled}
          disabled={disabled}
          title={effectiveCopied ? copiedTooltip : tooltip}
          aria-label={effectiveCopied ? copiedTooltip : tooltip}
          className={className}
          {...props}
        >
          {effectiveCopied ? <Check className="text-emerald-600" size={16} /> : <Copy size={16} />}
        </Button>
      </Tooltip.Trigger>

      <Tooltip.Content showArrow placement="top">
        <Tooltip.Arrow />
        <span>{effectiveCopied ? copiedTooltip : tooltip}</span>
      </Tooltip.Content>
    </Tooltip>
  );
}

CopyButton.propTypes = {
  /** Text to copy when the button is clicked (uncontrolled mode) */
  text: PropTypes.string,
  /** Optional handler when the button is pressed (controlled mode recommended for parent-managed state) */
  onPress: PropTypes.func,
  /** Controlled copied state (if provided the component won't manage its own transient timer) */
  isCopied: PropTypes.bool,
  /** Notified when copied state changes (both controlled and uncontrolled) */
  onCopiedChange: PropTypes.func,
  disabled: PropTypes.bool,
  tooltip: PropTypes.string,
  copiedTooltip: PropTypes.string,
  variant: PropTypes.string,
  className: PropTypes.string,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl']),
};

CopyButton.defaultProps = {
  tooltip: 'Copy',
  copiedTooltip: 'Copied!',
  variant: 'info-soft',
  size: 'md',
};
