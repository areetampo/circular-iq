// Local implementation of the CopyButton component.
// We originally attempted to pull this from a fictional `@modern-core/ui`
// package via the CLI command in the design doc, but the package isn't
// published/available.  Instead we provide our own lightweight version
// here under `modern-ui` so imports continue to look like:
//
//   import { CopyButton } from '@/components/modern-ui/copy-button';
//
// This keeps the API stable while avoiding external dependencies.

import { Check, Copy } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useState } from 'react';

export default function CopyButton({ value, disabled = false, className = '', ...props }) {
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = async () => {
    if (disabled) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // ignore
    }
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <motion.button
      onClick={(e) => {
        e.stopPropagation();
        handleCopy();
      }}
      className={`group relative rounded-md p-1.5 text-zinc-400 ${className}`}
      aria-label="Copy command"
      whileHover={
        {
          // backgroundColor: 'rgba(255, 255, 255, 0.1)',
          // color: '#ffffff',
        }
      }
      whileTap={{ scale: 0.9 }}
      disabled={disabled}
      {...props}
    >
      <AnimatePresence mode="wait">
        {hasCopied ? (
          <motion.div
            key="check"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Check className="h-4 w-4" color="#006045" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="cursor-pointer"
          >
            <Copy className="h-4 w-4" color="#006045" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
