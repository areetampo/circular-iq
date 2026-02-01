/**
 * CSV Export Functions
 * Handles exporting assessment and comparison data to CSV format
 *
 * Location: src/features/export/exportCSV.js
 */

import { categoryMapping, validKeys } from '@/constants/evaluationData';

/**
 * Escapes special characters in CSV values for Excel compatibility
 * Handles commas, quotes, newlines, tabs, and special characters
 * @param {string} value - The value to escape
 * @returns {string} Escaped value safe for Excel
 */
function escapeCSV(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // Remove any existing UTF-8 BOM
  const cleanValue = stringValue.replace(/^\uFEFF/, '');

  // Excel-compatible escaping: wrap in quotes if contains special chars
  if (
    cleanValue.includes(',') ||
    cleanValue.includes('"') ||
    cleanValue.includes('\n') ||
    cleanValue.includes('\r') ||
    cleanValue.includes('\t')
  ) {
    // Double any quotes and wrap in quotes
    return `"${cleanValue.replace(/"/g, '""')}"`;
  }

  return cleanValue;
}

/**
 * Triggers a CSV file download in the browser with UTF-8 BOM for Excel
 * @param {string} csvContent - CSV content string
 * @param {string} filename - Desired filename for download
 * @returns {Blob} Downloadable CSV Blob
 */
function downloadCSV(csvContent, filename) {
  // Add UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);

  return blob;
}

/**
 * Formats a date string to readable format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Exports assessments to CSV as a comparison matrix
 * @param {Object|Array<Object>} assessments - Single assessment object or array of assessments
 * @returns {{ success: boolean, message: string, blob: Blob }}
 */
export function exportAssessmentCSV(assessments) {
  const assessmentArray = Array.isArray(assessments) ? assessments : [assessments];
  const filteredAssessments = assessmentArray.filter(Boolean);

  if (filteredAssessments.length === 0) {
    throw new Error('Assessment data is required');
  }

  const assessmentData = filteredAssessments.map((assessment, index) => {
    const result = assessment.result_json || assessment;
    const metadata = result.metadata || {};
    const name =
      assessment.title ||
      assessment.caseName ||
      assessment.projectTitle ||
      metadata.industry ||
      `Assessment ${index + 1}`;
    const createdAt = assessment.created_at || metadata.date || result.created_at || null;

    return {
      name,
      date: createdAt ? formatDate(createdAt) : 'N/A',
      metadata,
      subScores: result.sub_scores || {},
      overallScore: result.overall_score ?? 'N/A',
    };
  });

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `assessment-matrix-${dateStr}.csv`;

  const csvLines = [];

  // Metadata Section
  csvLines.push('METADATA');
  csvLines.push('');
  csvLines.push(['Metric', ...assessmentData.map((a) => escapeCSV(a.name))].join(','));
  csvLines.push(
    ['Industry', ...assessmentData.map((a) => escapeCSV(a.metadata.industry || 'N/A'))].join(','),
  );
  csvLines.push(['Date', ...assessmentData.map((a) => escapeCSV(a.date))].join(','));
  csvLines.push('');

  // Header Row
  csvLines.push(['Metric', ...assessmentData.map((a) => escapeCSV(a.name))].join(','));

  // Evaluation Factor Rows (using validKeys)
  validKeys.forEach((key) => {
    const label =
      categoryMapping[key]?.name || key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    const scores = assessmentData.map((a) =>
      a.subScores[key] !== undefined && a.subScores[key] !== null ? a.subScores[key] : 'N/A',
    );
    csvLines.push([escapeCSV(label), ...scores.map((score) => escapeCSV(score))].join(','));
  });

  // Total Overall Score Row
  csvLines.push(
    ['Total Overall Score', ...assessmentData.map((a) => escapeCSV(a.overallScore))].join(','),
  );

  const csvContent = csvLines.join('\n');
  const blob = downloadCSV(csvContent, filename);

  return {
    success: true,
    message: 'CSV exported successfully',
    blob,
  };
}

/**
 * Exports a comparison between multiple assessments to CSV
 * Creates a professional matrix format with factors as rows and assessments as columns
 * @param {Object|Array<Object>} assessments - Single assessment object or array of assessments to compare
 * @returns {void}
 */
export function exportComparisonCSV(assessments) {
  // Handle both single object (backward compatibility) and array inputs
  const assessmentArray = Array.isArray(assessments) ? assessments : [assessments];

  if (assessmentArray.length === 0) {
    throw new Error('At least one assessment is required');
  }

  // For backward compatibility with 2-argument calls
  if (!Array.isArray(assessments) && arguments.length === 2) {
    assessmentArray.push(arguments[1]);
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `assessment-comparison-${dateStr}.csv`;

  const csvLines = [];

  // Extract assessment data
  const assessmentData = assessmentArray.map((assessment, index) => {
    const result = assessment.result_json || assessment;
    const metadata = result.metadata || {};
    const title = assessment.title || `Assessment ${index + 1}`;
    const createdAt = assessment.created_at ? formatDate(assessment.created_at) : 'N/A';

    return {
      title,
      createdAt,
      result,
      metadata,
      overallScore: result.overall_score || 0,
      subScores: result.sub_scores || {},
      audit: result.audit || {},
    };
  });

  // Build header row: "Evaluation Factor" + assessment titles
  const headerRow = ['Evaluation Factor', ...assessmentData.map((a) => escapeCSV(a.title))];

  // Add optional "Change" column if comparing exactly 2 assessments
  if (assessmentData.length === 2) {
    headerRow.push('Change (Δ)');
  }

  csvLines.push(headerRow.join(','));
  csvLines.push(''); // Empty row for readability

  // Overall Score Row (prominent placement at top)
  const overallScoreRow = ['Overall Score', ...assessmentData.map((a) => a.overallScore)];

  if (assessmentData.length === 2) {
    const change = assessmentData[1].overallScore - assessmentData[0].overallScore;
    overallScoreRow.push(`${change > 0 ? '+' : ''}${change}`);
  }

  csvLines.push(overallScoreRow.join(','));
  csvLines.push(''); // Empty row

  // Collect all unique factors across all assessments
  const allFactors = new Set();
  assessmentData.forEach((a) => {
    Object.keys(a.subScores).forEach((factor) => allFactors.add(factor));
  });

  // Sort factors alphabetically for consistency
  const sortedFactors = Array.from(allFactors).sort();

  // Factor Scores - one row per factor
  sortedFactors.forEach((factor) => {
    const factorLabel = escapeCSV(
      factor.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    );
    const scores = assessmentData.map((a) => a.subScores[factor] || 0);

    const row = [factorLabel, ...scores];

    // Add change column for 2-assessment comparison
    if (assessmentData.length === 2) {
      const change = scores[1] - scores[0];
      row.push(`${change > 0 ? '+' : ''}${change}`);
    }

    csvLines.push(row.join(','));
  });

  csvLines.push(''); // Empty row
  csvLines.push(''); // Another empty row for metadata section

  // Metadata Section - horizontal comparison
  csvLines.push('ASSESSMENT METADATA');
  csvLines.push(''); // Empty row

  const metadataHeader = ['Property', ...assessmentData.map((a) => escapeCSV(a.title))];
  csvLines.push(metadataHeader.join(','));

  // Industry row
  const industryRow = [
    'Industry',
    ...assessmentData.map((a) => escapeCSV(a.metadata.industry || 'N/A')),
  ];
  csvLines.push(industryRow.join(','));

  // Scale row
  const scaleRow = ['Scale', ...assessmentData.map((a) => escapeCSV(a.metadata.scale || 'N/A'))];
  csvLines.push(scaleRow.join(','));

  // Strategy row
  const strategyRow = [
    'R-Strategy',
    ...assessmentData.map((a) => escapeCSV(a.metadata.r_strategy || 'N/A')),
  ];
  csvLines.push(strategyRow.join(','));

  // Material row
  const materialRow = [
    'Primary Material',
    ...assessmentData.map((a) => escapeCSV(a.metadata.primary_material || 'N/A')),
  ];
  csvLines.push(materialRow.join(','));

  // Created date row
  const createdRow = ['Created Date', ...assessmentData.map((a) => a.createdAt)];
  csvLines.push(createdRow.join(','));

  csvLines.push(''); // Empty row

  // Audit Verdicts Section
  if (assessmentData.some((a) => a.audit.audit_verdict)) {
    csvLines.push('AUDIT VERDICTS');
    csvLines.push(''); // Empty row

    assessmentData.forEach((a) => {
      if (a.audit.audit_verdict) {
        csvLines.push(`${escapeCSV(a.title)},${escapeCSV(a.audit.audit_verdict)}`);
      }
    });

    csvLines.push(''); // Empty row
  }

  // Footer
  csvLines.push('');
  csvLines.push(
    `Report Generated,${new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`,
  );
  csvLines.push(`Number of Assessments,${assessmentData.length}`);

  const csvContent = csvLines.join('\n');
  downloadCSV(csvContent, filename);
}
