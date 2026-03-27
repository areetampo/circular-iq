import { Copy } from 'lucide-react';
import PropTypes from 'prop-types';
import { useCallback, useState } from 'react';

/**
 * CopyButton Component
 * Animated copy-to-clipboard button with feedback animation
 * Shows check icon briefly after successful copy
 */
export default function CopyButton({ value = '', disabled = false, className = '', ...props }) {
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (disabled) return;
    try {
      await navigator.clipboard.writeText(value);
      setHasCopied(true);
      // Reset after 2 seconds
      const timeout = setTimeout(() => setHasCopied(false), 2000);
      return () => clearTimeout(timeout);
    } catch {
      // ignore
    }
  }, [disabled, value]);

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      handleCopy();
    },
    [handleCopy],
  );

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md
             transition-colors hover:bg-[var(--accent-soft)]
             disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
        color: 'var(--muted)',
        border: '1px solid var(--border)',
      }}
      title="Copy assessment ID"
      disabled={disabled}
      {...props}
    >
      <Copy size={12} />
      <span>ID</span>
    </button>
  );
}

CopyButton.propTypes = {
  /** Text value to copy to clipboard */
  value: PropTypes.string,
  /** Disable the button */
  disabled: PropTypes.bool,
  /** Additional CSS classes */
  className: PropTypes.string,
};
