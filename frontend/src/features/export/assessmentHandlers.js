import { toast } from '@heroui/react';
import { useNavigate } from 'react-router-dom';

import { useExportState } from '@/hooks/useExportState';

// Feature toggles for development/debugging
const ENABLE_PDF_DOWNLOAD = true;
const ENABLE_CSV_DOWNLOAD = true;
const ENABLE_REEVALUATE = true;

/**
 * Custom hook for creating assessment action handlers for PDF download, CSV download, and re-evaluation
 * Uses useExportState and useNavigate internally for complete independence
 * @returns {Object} - Handler functions
 */
export function useAssessmentHandlers() {
  // Get navigation and export functions from hooks
  const navigate = useNavigate();
  const { isExporting, isExportingPDF, isExportingCSV, executeExport } = useExportState();
  /**
   * Handles PDF download for an assessment
   * @param {Object} assessment - Assessment data
   * @param {Object} scoringResult - Scoring result data
   */
  const handleDownloadPDF = async (assessment, scoringResult) => {
    logger.info('handleDownloadPDF');
    logger.info('location', window.location.href);
    logger.info('assessment', assessment);
    logger.info('scoringResult', scoringResult);

    if (!ENABLE_PDF_DOWNLOAD) {
      toast.danger('PDF download functionality is currently unavailable', { timeout: 4000 });
      return;
    }

    if (!scoringResult) {
      throw new Error('No result data available to export');
    }

    await executeExport(
      () =>
        import('./exportPDF').then(({ exportAssessmentPDF }) =>
          exportAssessmentPDF(assessment, { elementId: 'results-content' }),
        ),
      'PDF',
    );
  };

  /**
   * Handles CSV download for an assessment
   * @param {Object} assessment - Assessment data
   * @param {Object} scoringResult - Scoring result data
   */
  const handleDownloadCSV = async (assessment, scoringResult) => {
    logger.info('handleDownloadCSV');
    logger.info('location', window.location.href);
    logger.info('assessment', assessment);
    logger.info('scoringResult', scoringResult);

    if (!ENABLE_CSV_DOWNLOAD) {
      toast.danger('CSV download functionality is currently unavailable', { timeout: 4000 });
      return;
    }

    if (!scoringResult) {
      throw new Error('No result data available to export');
    }

    await executeExport(
      () =>
        import('./exportCSV').then(({ exportAssessmentCSV }) => exportAssessmentCSV(assessment)),
      'CSV',
    );
  };

  /**
   * Handles re-evaluation navigation for an assessment
   * @param {Object} assessment - Assessment data (contains all needed information)
   */
  const handleReevaluate = async (assessment) => {
    logger.info('handleReevaluate');
    logger.info('location', window.location.href);
    logger.info('assessment', assessment);

    if (!ENABLE_REEVALUATE) {
      toast.danger('Re-evaluation functionality is currently unavailable', { timeout: 4000 });
      return;
    }

    // Extract form data from assessment for re-evaluation
    const formData = {
      businessProblem: assessment.business_problem || assessment.businessProblem || '',
      businessSolution: assessment.business_solution || assessment.businessSolution || '',
      evaluation_parameters:
        assessment.evaluation_parameters || assessment.evaluationParameters || {},
      businessContext: assessment.business_context || assessment.businessContext || {},
    };

    // Use navigate if available, otherwise use window.location
    if (navigate) {
      navigate('/', {
        state: {
          formData,
        },
      });
    } else {
      // Fallback: use window.location with state in sessionStorage
      sessionStorage.setItem('reevaluateFormData', JSON.stringify(formData));
      window.location.href = '/';
    }
  };

  /**
   * Wrapper for PDF download with toast error handling
   * @param {Object} assessment - Assessment data
   * @param {Object} scoringResult - Scoring result data
   */
  const handleDownloadPDFWithErrorHandling = async (assessment, scoringResult) => {
    try {
      await handleDownloadPDF(assessment, scoringResult);
    } catch (error) {
      logger.warn('PDF download failed:', error);
      toast.danger('PDF download functionality is currently unavailable', { timeout: 4000 });
    }
  };

  /**
   * Wrapper for CSV download with toast error handling
   * @param {Object} assessment - Assessment data
   * @param {Object} scoringResult - Scoring result data
   */
  const handleDownloadCSVWithErrorHandling = async (assessment, scoringResult) => {
    try {
      await handleDownloadCSV(assessment, scoringResult);
    } catch (error) {
      logger.warn('CSV download failed:', error);
      toast.danger('CSV download functionality is currently unavailable', { timeout: 4000 });
    }
  };

  return {
    handleDownloadPDF,
    handleDownloadCSV,
    handleReevaluate,
    handleDownloadPDFWithErrorHandling,
    handleDownloadCSVWithErrorHandling,
    isExporting,
    isExportingPDF,
    isExportingCSV,
  };
}

/**
 * Default export for backward compatibility
 */
export default useAssessmentHandlers;
