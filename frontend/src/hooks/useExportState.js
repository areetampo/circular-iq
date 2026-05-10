import { toast } from '@heroui/react';
import { useState } from 'react';

/**
 * useExportState
 * Manages export-in-progress state and runs CSV/PDF export handlers with toasts.
 * @param {Object} options
 * @returns {Object}
 */
export default function useExportState() {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  // toasts are shown directly via HeroUI's toast helper

  /**
   * Execute an export function with proper state management
   * @param {Function} exportFn - The export function to execute
   * @param {string} operationType - 'CSV' or 'PDF' for user feedback
   * @param {*} args - Arguments to pass to export function
   */
  const executeExport = async (exportFn, operationType = 'CSV', ...args) => {
    // Set appropriate loading state based on operation type
    if (operationType === 'PDF') {
      setIsExportingPDF(true);
    } else if (operationType === 'CSV') {
      setIsExportingCSV(true);
    }

    try {
      const result = await exportFn(...args);

      if (result.success) {
        toast.success(result.message || `${operationType} downloaded successfully`, {
          timeout: 3000,
        });
      } else {
        toast.danger(result.message || `${operationType} downloaded successfully`, {
          timeout: 4000,
        });
      }

      return result;
    } catch (error) {
      logger.warn(`${operationType} export failed:`, error);
      const genericMessage =
        operationType === 'PDF'
          ? 'PDF download functionality is currently unavailable'
          : 'CSV download functionality is currently unavailable';
      toast.danger(genericMessage, { timeout: 4000 });
      return { success: false, message: genericMessage };
    } finally {
      // Clear appropriate loading state based on operation type
      if (operationType === 'PDF') {
        setIsExportingPDF(false);
      } else if (operationType === 'CSV') {
        setIsExportingCSV(false);
      }
    }
  };

  // Legacy isExporting for backward compatibility (true if either export is active)
  const isExporting = isExportingPDF || isExportingCSV;

  return {
    isExporting,
    isExportingPDF,
    isExportingCSV,
    executeExport,
  };
}
