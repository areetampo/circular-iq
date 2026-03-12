import { toast } from '@heroui/react';

/**
 * Custom wrapper to provide addToast interface with HeroUI Toast
 *
 * @deprecated the codebase now uses `toast` directly from @heroui/react.
 *             This hook remains for backward compatibility but new code
 *             should import { toast } and call `toast.success(...)`,
 *             `toast.danger(...)`, etc., with explicit timeouts.
 *
 * @returns {Object} { addToast, toast }
 */
export function useToast() {
  const addToast = (message, variant = 'default') => {
    // Handle different toast variants with HeroUI
    if (typeof message === 'string') {
      switch (variant) {
        case 'success':
          toast.success(message, { timeout: 3000 });
          break;
        case 'error':
        case 'destructive':
          toast.danger(message, { timeout: 4000 });
          break;
        case 'info':
          toast.info(message, { timeout: 3000 });
          break;
        case 'warning':
          toast.warning(message, { timeout: 3500 });
          break;
        default:
          toast(message, { timeout: 3000 });
      }
    } else if (typeof message === 'object' && message.title) {
      // Handle object format with title and description
      const msgVariant = message.variant || 'default';
      const timeout =
        message.timeout || (msgVariant === 'error' || msgVariant === 'destructive' ? 4000 : 3000);

      switch (msgVariant) {
        case 'success':
          toast.success(message.title, { description: message.description, timeout });
          break;
        case 'error':
        case 'destructive':
          toast.danger(message.title, { description: message.description, timeout });
          break;
        case 'info':
          toast.info(message.title, { description: message.description, timeout });
          break;
        case 'warning':
          toast.warning(message.title, { description: message.description, timeout });
          break;
        default:
          toast(message.title, { description: message.description, timeout });
      }
    }
  };

  return {
    addToast,
    toast,
  };
}
