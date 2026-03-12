import { useState } from 'react';
import { toast } from '@heroui/react';

/**
 * Custom hook for managing export operations with loading state and error handling
 * Provides consistent UX for all export functions throughout the app
 *
 * @returns {Object} Export state and handlers
 */
export function useExportState() {
  const [isExporting, setIsExporting] = useState(false);
  // toasts are shown directly via HeroUI's toast helper

  /**
   * Execute an export function with proper state management
   * @param {Function} exportFn - The export function to execute
   * @param {string} operationType - 'CSV' or 'PDF' for user feedback
   * @param {*} args - Arguments to pass to export function
   */
  const executeExport = async (exportFn, operationType = 'CSV', ...args) => {
    setIsExporting(true);
    try {
      const result = await exportFn(...args);
      // mimic previous wrapper behaviour: success=3000ms, error/danger=4000ms
      if (result.success) {
        toast.success(result.message || `${operationType} exported successfully`, {
          timeout: 3000,
        });
      } else {
        toast.danger(result.message || `${operationType} exported successfully`, { timeout: 4000 });
      }
      return result;
    } catch (error) {
      const errorMsg = error.message || `Failed to export ${operationType}`;
      toast.danger(errorMsg, { timeout: 4000 });
      return { success: false, message: errorMsg };
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    executeExport,
  };
}
