/**
 * PDF Export Functions
 * Handles exporting assessment and audit reports to PDF format
 *
 * Location: src/features/export/exportPDF.js
 */

/**
 * Formats text for PDF display
 * @param {string} text - Text to format
 * @returns {string} Formatted text
 */
function formatTextForPDF(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .substring(0, 1000); // Limit length for PDF
}

/**
 * Generates a date string
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Creates HTML content for a PDF
 * @param {string} title - PDF title
 * @param {string} content - HTML content
 * @returns {string} Complete HTML document
 */
function createPDFHTML(title, content) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${formatTextForPDF(title)}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #2c3e50;
          background: white;
          padding: 40px;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 3px solid #34a83a;
          padding-bottom: 20px;
        }
        .header h1 {
          font-size: 28px;
          color: #34a83a;
          margin-bottom: 10px;
        }
        .header p {
          color: #666;
          font-size: 14px;
        }
        .section {
          margin: 30px 0;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #34a83a;
          margin: 20px 0 15px 0;
          border-left: 4px solid #34a83a;
          padding-left: 15px;
        }
        .score-box {
          display: inline-block;
          background: #f0f7f0;
          border: 2px solid #34a83a;
          padding: 15px 25px;
          border-radius: 8px;
          margin: 10px 10px 10px 0;
          text-align: center;
          min-width: 150px;
        }
        .score-value {
          font-size: 32px;
          font-weight: bold;
          color: #34a83a;
        }
        .score-label {
          font-size: 12px;
          color: #666;
          margin-top: 5px;
          text-transform: uppercase;
        }
        .metadata-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        .metadata-table td {
          padding: 12px;
          border-bottom: 1px solid #e0e0e0;
        }
        .metadata-table td:first-child {
          font-weight: bold;
          width: 30%;
          background: #f9f9f9;
        }
        .factor-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin: 15px 0;
        }
        .factor-item {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #34a83a;
        }
        .factor-name {
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 8px;
        }
        .factor-score {
          font-size: 24px;
          color: #34a83a;
          font-weight: bold;
        }
        .audit-box {
          background: #e8f5e9;
          border-left: 4px solid #34a83a;
          padding: 15px;
          margin: 15px 0;
          border-radius: 4px;
        }
        .gap-box {
          background: #fff3e0;
          border-left: 4px solid #ff9800;
          padding: 15px;
          margin: 15px 0;
          border-radius: 4px;
        }
        .strength-box {
          background: #e8f5e9;
          border-left: 4px solid #28a745;
          padding: 15px;
          margin: 10px 0;
          border-radius: 4px;
        }
        ul, ol {
          margin-left: 20px;
          margin: 10px 0 10px 20px;
        }
        li {
          margin: 8px 0;
        }
        .footer {
          margin-top: 40px;
          border-top: 1px solid #e0e0e0;
          padding-top: 20px;
          text-align: center;
          font-size: 12px;
          color: #999;
        }
        .confidence-badge {
          display: inline-block;
          background: #4a90e2;
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          margin: 5px;
          font-size: 12px;
          font-weight: bold;
        }
        .page-break {
          page-break-after: always;
        }
        @media print {
          body { padding: 20px; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        ${content}
      </div>
    </body>
    </html>
  `;
}

/**
 * Triggers a PDF file download in the browser
 * @param {string} htmlContent - HTML content to print as PDF
 * @param {string} filename - Desired filename for download
 */
function downloadPDF(htmlContent, filename) {
  const newWindow = window.open('', '', 'width=900,height=600');
  newWindow.document.write(htmlContent);
  newWindow.document.close();

  // Delay print to allow content to render
  setTimeout(() => {
    newWindow.print();
    setTimeout(() => newWindow.close(), 250);
  }, 250);
}

/**
 * Exports an assessment as a formatted PDF report
 * @param {Object} assessment - Assessment data to export
 * @param {Function} getRatingBadge - Function to get rating badge text
 * @returns {void}
 */
export function exportAssessmentPDF(assessment, getRatingBadge) {
  if (!assessment) {
    throw new Error('Assessment data is required');
  }

  const result = assessment.result_json || assessment;
  const metadata = result.metadata || {};
  const subScores = result.sub_scores || {};
  const audit = result.audit || {};
  const gapAnalysis = result.gap_analysis || {};

  const overallScore = result.overall_score || 0;
  const rating = getRatingBadge ? getRatingBadge(overallScore) : 'N/A';
  const confidenceScore = audit.confidence_score
    ? `${(audit.confidence_score * 100).toFixed(1)}%`
    : 'N/A';

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `assessment-report-${dateStr}.pdf`;

  let htmlContent = `
    <div class="header">
      <h1>🌍 Circular Economy Assessment Report</h1>
      <p>Evaluation Date: ${formatDate(new Date())}</p>
    </div>

    <div class="section">
      <div class="score-box">
        <div class="score-value">${overallScore}</div>
        <div class="score-label">Overall Score</div>
      </div>
      <div class="score-box">
        <div class="score-value">${rating}</div>
        <div class="score-label">Rating</div>
      </div>
      <div class="confidence-badge">Confidence: ${confidenceScore}</div>
    </div>

    <div class="section">
      <div class="section-title">📋 Project Metadata</div>
      <table class="metadata-table">
        <tr>
          <td>Industry</td>
          <td>${formatTextForPDF(metadata.industry || 'N/A')}</td>
        </tr>
        <tr>
          <td>Scale</td>
          <td>${formatTextForPDF(metadata.scale || 'N/A')}</td>
        </tr>
        <tr>
          <td>Strategy</td>
          <td>${formatTextForPDF(metadata.r_strategy || 'N/A')}</td>
        </tr>
        <tr>
          <td>Primary Material</td>
          <td>${formatTextForPDF(metadata.primary_material || 'N/A')}</td>
        </tr>
        <tr>
          <td>Geographic Focus</td>
          <td>${formatTextForPDF(metadata.geographic_focus || 'N/A')}</td>
        </tr>
      </table>
    </div>
  `;

  // Factor Scores
  if (Object.keys(subScores).length > 0) {
    htmlContent += `<div class="section"><div class="section-title">📊 Factor Scores</div><div class="factor-grid">`;

    Object.entries(subScores).forEach(([factor, score]) => {
      htmlContent += `
        <div class="factor-item">
          <div class="factor-name">${formatTextForPDF(factor.replace(/_/g, ' '))}</div>
          <div class="factor-score">${score || 0} / 100</div>
        </div>
      `;
    });

    htmlContent += `</div></div>`;
  }

  // Benchmarks
  if (gapAnalysis.overall_benchmarks) {
    htmlContent += `
      <div class="section">
        <div class="section-title">🎯 Benchmark Comparison</div>
        <p><strong>Your Score:</strong> ${overallScore} / 100</p>
        <p><strong>Similar Projects Average:</strong> ${gapAnalysis.overall_benchmarks.average || 'N/A'}</p>
        <p><strong>Top 10% Percentile:</strong> ${gapAnalysis.overall_benchmarks.top_10_percentile || 'N/A'}</p>
      </div>
    `;
  }

  // Audit Verdict
  if (audit.audit_verdict) {
    htmlContent += `
      <div class="section">
        <div class="section-title">🔍 Auditor's Verdict</div>
        <div class="audit-box">
          <p>${formatTextForPDF(audit.audit_verdict)}</p>
        </div>
      </div>
    `;
  }

  // Strengths
  if (audit.integrity_gaps?.strengths && audit.integrity_gaps.strengths.length > 0) {
    htmlContent += `
      <div class="section">
        <div class="section-title">✅ Identified Strengths</div>
        <div class="strength-box">
          <ul>
    `;

    audit.integrity_gaps.strengths.forEach((strength) => {
      htmlContent += `<li>${formatTextForPDF(strength)}</li>`;
    });

    htmlContent += `</ul></div></div>`;
  }

  // Areas for Improvement
  if (audit.integrity_gaps?.gaps && audit.integrity_gaps.gaps.length > 0) {
    htmlContent += `
      <div class="section">
        <div class="section-title">🎯 Areas for Improvement</div>
        <div class="gap-box">
          <ul>
    `;

    audit.integrity_gaps.gaps.forEach((gap) => {
      htmlContent += `<li>${formatTextForPDF(gap)}</li>`;
    });

    htmlContent += `</ul></div></div>`;
  }

  // Similar Cases
  if (audit.similar_cases_summaries && audit.similar_cases_summaries.length > 0) {
    htmlContent += `
      <div class="section">
        <div class="section-title">📚 Reference Cases</div>
        <ul>
    `;

    audit.similar_cases_summaries.forEach((caseItem) => {
      const caseName = caseItem.case_name || caseItem.name || 'Unknown';
      const similarity = caseItem.similarity
        ? `${(caseItem.similarity * 100).toFixed(1)}% similar`
        : '';
      htmlContent += `<li><strong>${formatTextForPDF(caseName)}</strong> ${similarity}</li>`;
    });

    htmlContent += `</ul></div>`;
  }

  htmlContent += `
    <div class="footer">
      <p>This assessment was generated using the Circular Economy Business Evaluator.</p>
      <p>Report generated on ${new Date().toLocaleString()}</p>
    </div>
  `;

  const finalHTML = createPDFHTML('Circular Economy Assessment Report', htmlContent);
  downloadPDF(finalHTML, filename);
}

/**
 * Exports an audit report as a detailed PDF
 * @param {Object} assessment - Assessment data to export
 * @param {string} title - Custom title for the report
 * @returns {void}
 */
export function exportAuditReportToPDF(assessment, title = 'Audit Report') {
  if (!assessment) {
    throw new Error('Assessment data is required');
  }

  const result = assessment.result_json || assessment;
  const audit = result.audit || {};
  const metadata = result.metadata || {};

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `audit-report-${dateStr}.pdf`;

  let htmlContent = `
    <div class="header">
      <h1>🔍 Audit Report</h1>
      <p>${formatTextForPDF(title)}</p>
      <p>Generated: ${formatDate(new Date())}</p>
    </div>

    <div class="section">
      <div class="section-title">📋 Assessment Details</div>
      <table class="metadata-table">
        <tr>
          <td>Industry</td>
          <td>${formatTextForPDF(metadata.industry || 'N/A')}</td>
        </tr>
        <tr>
          <td>Scale</td>
          <td>${formatTextForPDF(metadata.scale || 'N/A')}</td>
        </tr>
        <tr>
          <td>Overall Score</td>
          <td>${result.overall_score || 0} / 100</td>
        </tr>
        <tr>
          <td>Confidence Level</td>
          <td>${audit.confidence_score ? `${(audit.confidence_score * 100).toFixed(1)}%` : 'N/A'}</td>
        </tr>
      </table>
    </div>
  `;

  // Main Verdict
  if (audit.audit_verdict) {
    htmlContent += `
      <div class="section">
        <div class="section-title">📝 Audit Verdict</div>
        <div class="audit-box">
          <p>${formatTextForPDF(audit.audit_verdict)}</p>
        </div>
      </div>
    `;
  }

  // Detailed Findings - Strengths
  if (audit.integrity_gaps?.strengths && audit.integrity_gaps.strengths.length > 0) {
    htmlContent += `
      <div class="section">
        <div class="section-title">✅ Key Strengths</div>
        <div class="strength-box">
          <ol>
    `;

    audit.integrity_gaps.strengths.forEach((strength) => {
      htmlContent += `<li>${formatTextForPDF(strength)}</li>`;
    });

    htmlContent += `</ol></div></div>`;
  }

  // Detailed Findings - Gaps
  if (audit.integrity_gaps?.gaps && audit.integrity_gaps.gaps.length > 0) {
    htmlContent += `
      <div class="section">
        <div class="section-title">⚠️ Risk Areas & Gaps</div>
        <div class="gap-box">
          <ol>
    `;

    audit.integrity_gaps.gaps.forEach((gap) => {
      htmlContent += `<li>${formatTextForPDF(gap)}</li>`;
    });

    htmlContent += `</ol></div></div>`;
  }

  // Recommendations (if available from audit)
  if (audit.recommendations && audit.recommendations.length > 0) {
    htmlContent += `
      <div class="section">
        <div class="section-title">💡 Recommendations</div>
        <ul>
    `;

    audit.recommendations.forEach((rec) => {
      htmlContent += `<li>${formatTextForPDF(rec)}</li>`;
    });

    htmlContent += `</ul></div>`;
  }

  // Auditor Notes (if available)
  if (audit.auditor_notes) {
    htmlContent += `
      <div class="section">
        <div class="section-title">📌 Auditor Notes</div>
        <p>${formatTextForPDF(audit.auditor_notes)}</p>
      </div>
    `;
  }

  htmlContent += `
    <div class="footer">
      <p>This is a confidential audit report generated by the Circular Economy Business Evaluator.</p>
      <p>Report generated on ${new Date().toLocaleString()}</p>
    </div>
  `;

  const finalHTML = createPDFHTML(title, htmlContent);
  downloadPDF(finalHTML, filename);
}
