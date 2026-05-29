import { toast } from '@heroui/react';
import { useState } from 'react';

/**
 * Manages CSV/PDF export loading flags and toast feedback around export operations.
 * Failed export functions are caught and converted to `{ success: false, message }`.
 *
 * @returns {{
 *   isExportingPDF: boolean,
 *   isExportingCSV: boolean,
 *   isExporting: boolean,
 *   executeExport: (
 *     exportFn: (...args: Array<unknown>) => Promise<{ success: boolean, message?: string }>,
 *     operationType?: 'CSV'|'PDF',
 *     ...args: Array<unknown>
 *   ) => Promise<{ success: boolean, message?: string }>
 * }} Export loading flags and a guarded executor that resolves with success/failure status.
 */
export default function useExportState() {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);

  const executeExport = async (exportFn, operationType = 'CSV', ...args) => {
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
        logger.warn('[EXPORT:OPERATION_FAILED]', { operationType, message: result.message });
        toast.danger(result.message || `${operationType} downloaded successfully`, {
          timeout: 4000,
        });
      }

      return result;
    } catch (error) {
      logger.warn('[EXPORT:OPERATION_FAILED]', { operationType, error });
      const genericMessage =
        operationType === 'PDF'
          ? 'PDF download functionality is currently unavailable'
          : 'CSV download functionality is currently unavailable';
      toast.danger(genericMessage, { timeout: 4000 });
      return { success: false, message: genericMessage };
    } finally {
      if (operationType === 'PDF') {
        setIsExportingPDF(false);
      } else if (operationType === 'CSV') {
        setIsExportingCSV(false);
      }
    }
  };

  // Preserve the legacy aggregate flag while newer callers use type-specific loading state.
  const isExporting = isExportingPDF || isExportingCSV;

  return {
    isExporting,
    isExportingPDF,
    isExportingCSV,
    executeExport,
  };
}
