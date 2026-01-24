import { useState } from 'react';
import { useToast } from './useToast';

/**
 * Custom hook for managing export operations with loading state and error handling
 * Provides consistent UX for all export functions throughout the app
 *
 * @returns {Object} Export state and handlers
 */
export function useExportState() {
  const [isExporting, setIsExporting] = useState(false);
  const { addToast } = useToast();

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
      addToast(
        result.message || `${operationType} exported successfully`,
        result.success ? 'success' : 'error',
      );
      return result;
    } catch (error) {
      const errorMsg = error.message || `Failed to export ${operationType}`;
      addToast(errorMsg, 'error');
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
