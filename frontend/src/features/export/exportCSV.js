/**
 * CSV Export Functions
 * Handles exporting assessment and comparison data to CSV format
 *
 * Location: src/features/export/exportCSV.js
 */

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
 * Triggers a CSV file download in the browser with UTF-8 BOM for Excel
 * @param {string} csvContent - CSV content string
 * @param {string} filename - Desired filename for download
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

    assessmentData.forEach((a, index) => {
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
