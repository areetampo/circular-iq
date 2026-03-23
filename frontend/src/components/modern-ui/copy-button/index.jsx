import { Check, Copy } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
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
    <motion.button
      onClick={handleClick}
      className={`group relative rounded-md p-1.5 text-zinc-400 transition-all duration-150 ease-out will-change-colors ${className}`}
      aria-label="Copy command"
      whileHover={!disabled ? { backgroundColor: 'rgba(255, 255, 255, 0.05)' } : {}}
      whileTap={!disabled ? { scale: 0.92 } : {}}
      disabled={disabled}
      {...props}
    >
      <AnimatePresence mode="wait">
        {hasCopied ? (
          <motion.div
            key="check"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
          >
            <Check className="h-4 w-4 transition-colors duration-150" color="#006045" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="cursor-pointer"
          >
            <Copy className="h-4 w-4 transition-colors duration-150" color="#006045" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
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
