import { useToast as useBaseToast } from './use-toast';

/**
 * Custom wrapper around the base useToast hook to provide addToast interface
 * @returns {Object} { addToast, toast, dismiss, toasts }
 */
export function useToast() {
  const { toast, ...rest } = useBaseToast();

  const addToast = (props) => {
    // If props is an object with title/description structure
    if (typeof props === 'object' && props.title) {
      toast(props);
    } else if (typeof props === 'string') {
      // Handle string message for backward compatibility
      // addToast(message, variant) format
      toast({
        title: props,
        variant: rest?.[1] || 'default',
      });
    }
  };

  return {
    addToast,
    toast,
    ...rest,
  };
}
