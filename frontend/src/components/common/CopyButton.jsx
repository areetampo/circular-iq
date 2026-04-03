import { Check, Copy } from 'lucide-react';
import PropTypes from 'prop-types';
import { useCallback, useState } from 'react';

/**
 * CopyButton Component
 * Simple copy icon with stroke animation or box with description
 *
 * @param {string} value - Text value to copy to clipboard
 * @param {boolean} disabled - Disable the button
 * @param {string} className - Additional CSS classes
 * @param {string} description - Optional description text for box mode
 */
export default function CopyButton({
  value = '',
  disabled = false,
  className = '',
  description = '',
  noBorder = false,
  ...props
}) {
  const [hasCopied, setHasCopied] = useState(false);

  const handleClick = useCallback(async () => {
    if (disabled || !value) return;
    try {
      await navigator.clipboard.writeText(value);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }, [value, disabled]);

  // Simple icon mode (no description)
  if (!description) {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center justify-center w-8 h-8 rounded-md
               transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        disabled={disabled}
        {...props}
      >
        <div className="relative w-4 h-4">
          <Copy
            size={16}
            className={`absolute inset-0 transition-opacity duration-100 ${
              hasCopied ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <Check
            size={16}
            className={`absolute inset-0 transition-opacity duration-100 ${
              hasCopied ? 'opacity-100 delay-75' : 'opacity-0'
            }`}
          />
        </div>
      </button>
    );
  }

  // Box mode with description
  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all duration-200
             disabled:opacity-50 disabled:cursor-not-allowed ${
               noBorder ? '' : 'border'
             } ${className}`}
      style={!noBorder ? { borderColor: 'rgba(0, 0, 0, 0.2)' } : {}}
      disabled={disabled}
      {...props}
    >
      <div className="relative w-4 h-4">
        <Copy
          size={16}
          className={`absolute inset-0 transition-opacity duration-100 ${
            hasCopied ? 'opacity-0' : 'opacity-100'
          }`}
        />
        <Check
          size={16}
          className={`absolute inset-0 transition-opacity duration-100 ${
            hasCopied ? 'opacity-100 delay-75' : 'opacity-0'
          }`}
        />
      </div>
      <span className="text-sm text-(--text-primary)">{description}</span>
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
  /** Optional description text for box mode */
  description: PropTypes.string,
  /** Remove border from box mode */
  noBorder: PropTypes.bool,
};
