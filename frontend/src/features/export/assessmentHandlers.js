import { toast } from '@heroui/react';
import { useNavigate } from 'react-router-dom';

import { useExportState } from '@/hooks';

/**
 * Normalizes business context values to match form option values.
 * Handles conversion between display values and form option values for consistency.
 *
 * @param {string} field - Business context key such as `annual_volume_estimate`.
 * @param {string|null|undefined} value - Saved display value or already-normalized form value.
 * @returns {string|null|undefined} Form option value expected by the landing-page controls, or the original empty value.
 *
 * @private
 */
const normalizeBusinessContextValue = (field, value) => {
  if (!value) return value;

  // Business Model Type: convert underscores to hyphens
  if (field === 'business_model_type') {
    return value.replace(/_/g, '-');
  }

  // Material Complexity: convert underscores to hyphens
  if (field === 'material_complexity') {
    return value.replace(/_/g, '-');
  }

  // Annual Volume Estimate: map display values to option values
  if (field === 'annual_volume_estimate') {
    const volumeMappings = {
      '>100 tonnes': 'over-100-tonnes',
      '< 1 tonne': 'under-1-tonne',
      '1-10 tonnes': '1-10-tonnes',
      '10-100 tonnes': '10-100-tonnes',
      // Handle any values that are already in correct format
      'over-100-tonnes': 'over-100-tonnes',
      'under-1-tonne': 'under-1-tonne',
      '1-10-tonnes': '1-10-tonnes',
      '10-100-tonnes': '10-100-tonnes',
      'digital-intangible': 'digital-intangible',
    };
    return volumeMappings[value] || value;
  }

  // Other fields (operational_stage, target_geography) should be passed through as-is
  return value;
};

// Feature toggles for development/debugging
const ENABLE_PDF_DOWNLOAD = true;
const ENABLE_CSV_DOWNLOAD = true;
const ENABLE_REEVALUATE = true;

/**
 * PDF/CSV download and re-evaluate navigation handlers; uses `useExportState` and `useNavigate`.
 *
 * @returns {{
 *   handleDownloadPDF: (assessment: Record<string, unknown>, scoringResult: Record<string, unknown>) => Promise<void>,
 *   handleDownloadCSV: (assessment: Record<string, unknown>, scoringResult: Record<string, unknown>) => Promise<void>,
 *   handleReevaluate: (assessment: Record<string, unknown>) => Promise<void>,
 *   handleDownloadPDFWithErrorHandling: (assessment: Record<string, unknown>, scoringResult: Record<string, unknown>) => Promise<void>,
 *   handleDownloadCSVWithErrorHandling: (assessment: Record<string, unknown>, scoringResult: Record<string, unknown>) => Promise<void>,
 *   isExporting: boolean,
 *   isExportingPDF: boolean,
 *   isExportingCSV: boolean
 * }} Download/navigation handlers plus export loading flags for result views.
 */
export default function useAssessmentHandlers() {
  // Get navigation and export functions from hooks
  const navigate = useNavigate();
  const { isExporting, isExportingPDF, isExportingCSV, executeExport } = useExportState();

  /**
   * Handles PDF download for an assessment.
   *
   * @param {Record<string, unknown>} assessment - Assessment data used by the PDF exporter.
   * @param {Record<string, unknown>} scoringResult - Scoring result data; must be present before export starts.
   * @throws {Error} If no scoring result is available to export.
   */
  const handleDownloadPDF = async (assessment, scoringResult) => {
    if (!ENABLE_PDF_DOWNLOAD) {
      toast.danger('PDF download functionality is currently unavailable', { timeout: 4000 });
      return;
    }

    if (!scoringResult) {
      throw new Error('No result data available to export');
    }

    await executeExport(
      () =>
        import('./exportPDF').then(({ exportAssessmentPDF }) => exportAssessmentPDF(assessment)),
      'PDF',
    );
  };

  /**
   * Handles CSV download for an assessment.
   *
   * @param {Record<string, unknown>} assessment - Assessment data used by the CSV exporter.
   * @param {Record<string, unknown>} scoringResult - Scoring result data; must be present before export starts.
   * @throws {Error} If no scoring result is available to export.
   */
  const handleDownloadCSV = async (assessment, scoringResult) => {
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
   * Handles re-evaluation navigation for an assessment.
   *
   * @param {Record<string, unknown>} assessment - Assessment data containing saved inputs, result aliases, and business context.
   */
  const handleReevaluate = async (assessment) => {
    if (!ENABLE_REEVALUATE) {
      toast.danger('Re-evaluation functionality is currently unavailable', { timeout: 3500 });
      return;
    }

    // Extract business context with proper field mapping
    const rawBusinessContext = assessment.business_context || assessment.businessContext || {};

    // Normalize all business context values to match form option values
    const businessContextData = {
      ...rawBusinessContext,
      business_model_type: normalizeBusinessContextValue(
        'business_model_type',
        rawBusinessContext.business_model_type,
      ),
      operational_stage: normalizeBusinessContextValue(
        'operational_stage',
        rawBusinessContext.operational_stage,
      ),
      target_geography: normalizeBusinessContextValue(
        'target_geography',
        rawBusinessContext.target_geography,
      ),
      annual_volume_estimate: normalizeBusinessContextValue(
        'annual_volume_estimate',
        rawBusinessContext.annual_volume_estimate,
      ),
      material_complexity: normalizeBusinessContextValue(
        'material_complexity',
        rawBusinessContext.material_complexity,
      ),
      // Boolean field doesn't need normalization
      has_existing_partnerships: rawBusinessContext.has_existing_partnerships,
    };

    // Extract form data from assessment for re-evaluation
    const formData = {
      businessProblem: assessment.business_problem || assessment.businessProblem || '',
      businessSolution: assessment.business_solution || assessment.businessSolution || '',
      evaluation_parameters:
        assessment.evaluation_parameters || assessment.evaluationParameters || {},
      businessContext: businessContextData,
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
   * Wrapper for PDF download with toast error handling.
   *
   * @param {Record<string, unknown>} assessment - Assessment data passed to the PDF exporter.
   * @param {Record<string, unknown>} scoringResult - Scoring result data used as the export availability guard.
   */
  const handleDownloadPDFWithErrorHandling = async (assessment, scoringResult) => {
    try {
      await handleDownloadPDF(assessment, scoringResult);
    } catch (error) {
      logger.warn('[EXPORT:PDF_DOWNLOAD_FAILED]', error);
      toast.danger('PDF download functionality is currently unavailable', { timeout: 4000 });
    }
  };

  /**
   * Wrapper for CSV download with toast error handling.
   * Catches errors and displays a user-friendly toast message.
   *
   * @param {Record<string, unknown>} assessment - Assessment data containing metadata and result fields for CSV export.
   * @param {Record<string, unknown>} scoringResult - Scoring result data from the API used as the export availability guard.
   */
  const handleDownloadCSVWithErrorHandling = async (assessment, scoringResult) => {
    try {
      await handleDownloadCSV(assessment, scoringResult);
    } catch (error) {
      logger.warn('[EXPORT:CSV_DOWNLOAD_FAILED]', error);
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
