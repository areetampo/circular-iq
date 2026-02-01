import { toast } from 'sonner';

/**
 * Custom wrapper to provide addToast interface with Sonner
 * @returns {Object} { addToast, toast }
 */
export function useToast() {
  const addToast = (message, variant = 'default') => {
    // Handle different toast variants with Sonner
    if (typeof message === 'string') {
      switch (variant) {
        case 'success':
          toast.success(message);
          break;
        case 'error':
        case 'destructive':
          toast.error(message);
          break;
        case 'info':
          toast.info(message);
          break;
        case 'warning':
          toast.warning(message);
          break;
        default:
          toast(message);
      }
    } else if (typeof message === 'object' && message.title) {
      // Handle object format with title and description
      const variant = message.variant || 'default';
      const toastMessage = message.description || message.title;

      switch (variant) {
        case 'success':
          toast.success(message.title, { description: message.description });
          break;
        case 'error':
        case 'destructive':
          toast.error(message.title, { description: message.description });
          break;
        case 'info':
          toast.info(message.title, { description: message.description });
          break;
        case 'warning':
          toast.warning(message.title, { description: message.description });
          break;
        default:
          toast(message.title, { description: message.description });
      }
    }
  };

  return {
    addToast,
    toast,
  };
}
