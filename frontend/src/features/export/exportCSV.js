/**
 * CSV Export Functions
 * Handles exporting assessment and comparison data to CSV format
 *
 * Location: src/features/export/exportCSV.js
 */

/**
 * Escapes special characters in CSV values
 * @param {string} value - The value to escape
 * @returns {string} Escaped value
 */
function escapeCSV(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Generates a CSV string from an array of objects
 * @param {Array<Object>} data - Array of objects to convert to CSV
 * @param {Array<string>} headers - Column headers
 * @returns {string} CSV formatted string
 */
function generateCSV(data, headers) {
  const rows = [];

  // Add header row
  rows.push(headers.map(escapeCSV).join(','));

  // Add data rows
  data.forEach((item) => {
    const row = headers.map((header) => escapeCSV(item[header] || ''));
    rows.push(row.join(','));
  });

  return rows.join('\n');
}

/**
 * Triggers a CSV file download in the browser
 * @param {string} csvContent - CSV content string
 * @param {string} filename - Desired filename for download
 */
function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
 * Exports a single assessment to CSV
 * @param {Object} assessment - Assessment object to export
 * @returns {void}
 */
export function exportAssessmentCSV(assessment) {
  if (!assessment) {
    throw new Error('Assessment data is required');
  }

  const result = assessment.result_json || assessment;
  const metadata = result.metadata || {};
  const subScores = result.sub_scores || {};
  const audit = result.audit || {};
  const gapAnalysis = result.gap_analysis || {};

  // Generate filename with date
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `assessment-${dateStr}.csv`;

  // Build CSV content
  const csvLines = [];

  // Title and timestamp
  csvLines.push('CIRCULAR ECONOMY ASSESSMENT EXPORT');
  csvLines.push('');

  // Metadata Section
  csvLines.push('PROJECT METADATA');
  csvLines.push(`Industry,${escapeCSV(metadata.industry || 'N/A')}`);
  csvLines.push(`Scale,${escapeCSV(metadata.scale || 'N/A')}`);
  csvLines.push(`Strategy,${escapeCSV(metadata.r_strategy || 'N/A')}`);
  csvLines.push(`Primary Material,${escapeCSV(metadata.primary_material || 'N/A')}`);
  csvLines.push(`Geographic Focus,${escapeCSV(metadata.geographic_focus || 'N/A')}`);
  csvLines.push('');

  // Overall Scores Section
  csvLines.push('SCORES');
  csvLines.push(`Overall Score,${result.overall_score || 0} / 100`);
  csvLines.push(`Business Viability Score,${result.business_viability_score || 'N/A'}`);
  csvLines.push('');

  // Factor Scores Section
  if (Object.keys(subScores).length > 0) {
    csvLines.push('FACTOR SCORES');
    csvLines.push('Factor,Score');
    Object.entries(subScores).forEach(([factor, score]) => {
      csvLines.push(`${escapeCSV(factor.replace(/_/g, ' '))},${score || 'N/A'}`);
    });
    csvLines.push('');
  }

  // Audit Verdict Section
  if (audit.audit_verdict) {
    csvLines.push('AUDIT VERDICT');
    csvLines.push(escapeCSV(audit.audit_verdict));
    csvLines.push('');
  }

  // Integrity Gaps - Strengths
  if (audit.integrity_gaps?.strengths && audit.integrity_gaps.strengths.length > 0) {
    csvLines.push('IDENTIFIED STRENGTHS');
    audit.integrity_gaps.strengths.forEach((strength) => {
      csvLines.push(`• ${escapeCSV(strength)}`);
    });
    csvLines.push('');
  }

  // Integrity Gaps - Areas for Improvement
  if (audit.integrity_gaps?.gaps && audit.integrity_gaps.gaps.length > 0) {
    csvLines.push('AREAS FOR IMPROVEMENT');
    audit.integrity_gaps.gaps.forEach((gap) => {
      csvLines.push(`• ${escapeCSV(gap)}`);
    });
    csvLines.push('');
  }

  // Confidence and Benchmarks
  if (audit.confidence_score !== undefined) {
    csvLines.push('CONFIDENCE METRICS');
    csvLines.push(`Confidence Score,${(audit.confidence_score * 100).toFixed(1)}%`);
    csvLines.push('');
  }

  // Gap Analysis Benchmarks
  if (gapAnalysis.overall_benchmarks) {
    csvLines.push('BENCHMARK COMPARISON');
    csvLines.push(`Average Score,${gapAnalysis.overall_benchmarks.average || 'N/A'}`);
    csvLines.push(`Top 10% Score,${gapAnalysis.overall_benchmarks.top_10_percentile || 'N/A'}`);
    csvLines.push('');
  }

  // Similar Cases
  if (audit.similar_cases_summaries && audit.similar_cases_summaries.length > 0) {
    csvLines.push('REFERENCE CASES');
    csvLines.push('Case Name,Similarity');
    audit.similar_cases_summaries.forEach((caseItem) => {
      const caseName = caseItem.case_name || caseItem.name || 'Unknown';
      const similarity =
        caseItem.similarity !== undefined ? `${(caseItem.similarity * 100).toFixed(1)}%` : 'N/A';
      csvLines.push(`${escapeCSV(caseName)},${similarity}`);
    });
    csvLines.push('');
  }

  // Footer
  csvLines.push('');
  csvLines.push(`Export Date,${new Date().toLocaleString()}`);

  const csvContent = csvLines.join('\n');
  downloadCSV(csvContent, filename);
}

/**
 * Exports a comparison between two assessments to CSV
 * @param {Object} assessment1 - First assessment to compare
 * @param {Object} assessment2 - Second assessment to compare
 * @returns {void}
 */
export function exportComparisonCSV(assessment1, assessment2) {
  if (!assessment1 || !assessment2) {
    throw new Error('Both assessments are required for comparison');
  }

  const result1 = assessment1.result_json || assessment1;
  const result2 = assessment2.result_json || assessment2;

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `assessment-comparison-${dateStr}.csv`;

  const csvLines = [];

  // Title
  csvLines.push('ASSESSMENT COMPARISON REPORT');
  csvLines.push('');

  // Assessment Headers
  const title1 = assessment1.title || 'Assessment 1';
  const title2 = assessment2.title || 'Assessment 2';

  csvLines.push(`Assessment 1,${escapeCSV(title1)}`);
  csvLines.push(`Created,${formatDate(assessment1.created_at)}`);
  csvLines.push('');

  csvLines.push(`Assessment 2,${escapeCSV(title2)}`);
  csvLines.push(`Created,${formatDate(assessment2.created_at)}`);
  csvLines.push('');

  // Overall Score Comparison
  csvLines.push('OVERALL SCORES');
  csvLines.push(`Metric,${escapeCSV(title1)},${escapeCSV(title2)},Change`);

  const score1 = result1.overall_score || 0;
  const score2 = result2.overall_score || 0;
  const scoreDiff = score2 - score1;

  csvLines.push(`Score,${score1},${score2},${scoreDiff > 0 ? '+' : ''}${scoreDiff}`);
  csvLines.push('');

  // Factor Score Comparison
  const subScores1 = result1.sub_scores || {};
  const subScores2 = result2.sub_scores || {};

  if (Object.keys(subScores1).length > 0 || Object.keys(subScores2).length > 0) {
    csvLines.push('FACTOR SCORES COMPARISON');
    csvLines.push(`Factor,${escapeCSV(title1)},${escapeCSV(title2)},Change`);

    const allFactors = new Set([...Object.keys(subScores1), ...Object.keys(subScores2)]);

    allFactors.forEach((factor) => {
      const val1 = subScores1[factor] || 0;
      const val2 = subScores2[factor] || 0;
      const diff = val2 - val1;
      csvLines.push(
        `${escapeCSV(factor.replace(/_/g, ' '))},${val1},${val2},${diff > 0 ? '+' : ''}${diff}`,
      );
    });
    csvLines.push('');
  }

  // Metadata Comparison
  const metadata1 = result1.metadata || {};
  const metadata2 = result2.metadata || {};

  csvLines.push('PROJECT DETAILS COMPARISON');
  csvLines.push(`Metric,${escapeCSV(title1)},${escapeCSV(title2)}`);
  csvLines.push(
    `Industry,${escapeCSV(metadata1.industry || 'N/A')},${escapeCSV(metadata2.industry || 'N/A')}`,
  );
  csvLines.push(
    `Scale,${escapeCSV(metadata1.scale || 'N/A')},${escapeCSV(metadata2.scale || 'N/A')}`,
  );
  csvLines.push(
    `Strategy,${escapeCSV(metadata1.r_strategy || 'N/A')},${escapeCSV(metadata2.r_strategy || 'N/A')}`,
  );
  csvLines.push(
    `Material,${escapeCSV(metadata1.primary_material || 'N/A')},${escapeCSV(metadata2.primary_material || 'N/A')}`,
  );
  csvLines.push('');

  // Audit Verdicts
  const audit1 = result1.audit || {};
  const audit2 = result2.audit || {};

  csvLines.push('AUDIT VERDICTS');
  csvLines.push(`${escapeCSV(title1)} Verdict,${escapeCSV(audit1.audit_verdict || 'N/A')}`);
  csvLines.push(`${escapeCSV(title2)} Verdict,${escapeCSV(audit2.audit_verdict || 'N/A')}`);
  csvLines.push('');

  // Summary
  csvLines.push('SUMMARY');
  csvLines.push(`Largest Improvement,${subScores1.length > 0 ? 'See factor scores above' : 'N/A'}`);
  csvLines.push(`Largest Decline,${subScores1.length > 0 ? 'See factor scores above' : 'N/A'}`);
  csvLines.push('');

  csvLines.push('');
  csvLines.push(`Comparison Date,${new Date().toLocaleString()}`);

  const csvContent = csvLines.join('\n');
  downloadCSV(csvContent, filename);
}
