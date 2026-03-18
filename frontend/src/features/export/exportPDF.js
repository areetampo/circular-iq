/**
 * PDF Export Functions
 * Handles exporting assessment and audit reports to PDF format using jsPDF and html2canvas
 *
 * Location: src/features/export/exportPDF.js
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { reconstructScoringResult } from '@/features/assessments/utils';

/**
 * Formats text for PDF display
 * @param {string} text - Text to format
 * @returns {string} Formatted text
 */
function formatTextForPDF(text) {
  if (!text) return '';
  return String(text)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
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
          font-family: 'Helvetica', 'Arial', sans-serif;
          line-height: 1.7;
          color: #2c3e50;
          background: white;
          padding: 45px;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 45px;
          border-bottom: 3px solid #059669;
          padding-bottom: 25px;
        }
        .header h1 {
          font-size: 28px;
          color: #059669;
          margin-bottom: 10px;
        }
        h2, h3, h4 {
          color: #059669;
        }
        .header p {
          color: #666;
          font-size: 14px;
        }
        .section {
          margin: 35px 0;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 19px;
          font-weight: bold;
          color: #059669;
          margin: 25px 0 18px 0;
          border-left: 5px solid #059669;
          padding-left: 18px;
        }
        .score-box {
          display: inline-block;
          background: #f0f7f0;
          border: 2px solid #059669;
          padding: 18px 28px;
          border-radius: 8px;
          margin: 12px 12px 12px 0;
          text-align: center;
          min-width: 160px;
        }
        .score-value {
          font-size: 32px;
          font-weight: bold;
          color: #059669;
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
          padding: 14px;
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
          gap: 18px;
          margin: 18px 0;
        }
        .factor-item {
          background: #f9f9f9;
          padding: 18px;
          border-radius: 6px;
          border-left: 5px solid #059669;
        }
        .factor-name {
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 8px;
        }
        .factor-score {
          font-size: 24px;
          color: #059669;
          font-weight: bold;
        }
        .audit-box {
          background: #e8f5e9;
          border-left: 4px solid #059669;
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
  if (filename) {
    newWindow.document.title = filename;
  }
  newWindow.document.write(htmlContent);
  newWindow.document.close();

  // Delay print to allow content to render
  setTimeout(() => {
    newWindow.print();
    setTimeout(() => newWindow.close(), 250);
  }, 250);
}

/**
 * Exports an assessment as a high-fidelity PDF report with charts and summary
 * @param {Object} assessment - Assessment data to export
 * @param {Object} options - Export options
 * @param {string} options.elementId - ID of the DOM element to capture (default: 'results-content')
 * @returns {Promise<void>}
 */
export async function exportAssessmentPDF(assessment, options = {}) {
  if (!assessment) {
    throw new Error('Assessment data is required');
  }

  const { elementId = 'results-content' } = options;
  const result = assessment.result_json || assessment;
  const metadata = result.metadata || {};

  const scoringResult = reconstructScoringResult(assessment);

  const assessmentName =
    assessment.title ||
    assessment.caseName ||
    assessment.projectTitle ||
    assessment.industry ||
    result.industry ||
    'Assessment';
  const assessmentDate = assessment.created_at || metadata.date || result.created_at;
  const formattedDate = assessmentDate ? formatDate(assessmentDate) : null;

  const contentElement = document.getElementById(elementId);
  if (!contentElement) {
    throw new Error(`Export element not found: ${elementId}`);
  }

  // A4 dimensions in mm
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const headerHeight = 32;
  const contentWidth = pageWidth - 2 * margin;
  const availableHeight = pageHeight - headerHeight - margin;

  // Create PDF
  const pdf = new jsPDF('p', 'mm', 'a4');

  // Add Header
  pdf.setFillColor(5, 150, 105); // #059669 (Emerald-600)
  pdf.rect(0, 0, pageWidth, headerHeight, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Circular Economy Assessment Report', pageWidth / 2, 14, { align: 'center' });

  const subtitleParts = [formatTextForPDF(assessmentName)];
  if (formattedDate && formattedDate !== 'N/A') {
    subtitleParts.push(formattedDate);
  }

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(subtitleParts.join(' • '), pageWidth / 2, 22, { align: 'center' });

  // Capture full results container
  const canvas = await html2canvas(contentElement, {
    scale: 2,
    logging: false,
    useCORS: true,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = contentWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // Scale to fit within available page height if needed
  let renderWidth = imgWidth;
  let renderHeight = imgHeight;

  if (renderHeight > availableHeight) {
    const scale = availableHeight / renderHeight;
    renderHeight = availableHeight;
    renderWidth = imgWidth * scale;
  }

  const renderX = (pageWidth - renderWidth) / 2;
  const renderY = headerHeight + 10;

  pdf.addImage(imgData, 'PNG', renderX, renderY, renderWidth, renderHeight, undefined, 'FAST');

  // Add extra sections for derived metrics and AI audit summary (not always visible in the UI)
  if (scoringResult?.derived_metrics) {
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.setTextColor(5, 150, 105);
    pdf.text('Derived Metrics', margin, 30);
    pdf.setFontSize(12);
    pdf.setTextColor(44, 62, 80);

    const dm = scoringResult.derived_metrics;
    const derivedRows = [
      ['Technical Feasibility', dm.technical_feasibility ?? 'N/A'],
      ['Economic Viability', dm.economic_viability ?? 'N/A'],
      ['Circularity Potential', dm.circularity_potential ?? 'N/A'],
      ['Risk Level', (dm.risk_level ?? 'N/A').toString().toUpperCase()],
    ];

    let y = 45;
    derivedRows.forEach(([label, value]) => {
      pdf.setFontSize(12);
      pdf.text(`${label}: ${value}`, margin, y);
      y += 10;
    });

    // Circular Economy Tier
    if (scoringResult.circular_economy_tier) {
      y += 8;
      pdf.setFontSize(14);
      pdf.setTextColor(5, 150, 105);
      pdf.text('Circular Economy Tier', margin, y);
      y += 8;
      pdf.setFontSize(12);
      pdf.setTextColor(44, 62, 80);
      const tier = scoringResult.circular_economy_tier;
      pdf.text(`Tier: ${tier.tier} (${tier.range})`, margin, y);
      y += 7;
      pdf.text(`${tier.percentile_estimate}`, margin, y);
      y += 7;
      pdf.text(pdf.splitTextToSize(formatTextForPDF(tier.next_milestone), contentWidth), margin, y);
      y += 14;
    }

    // Parameter Consistency
    if (scoringResult.parameter_consistency) {
      y += 4;
      pdf.setFontSize(14);
      pdf.setTextColor(5, 150, 105);
      pdf.text('Self-Assessment Reliability', margin, y);
      y += 8;
      pdf.setFontSize(12);
      pdf.setTextColor(44, 62, 80);
      const pc = scoringResult.parameter_consistency;
      pdf.text(`Consistency Score: ${pc.score}/100 (${pc.rating})`, margin, y);
      y += 7;
      pdf.text(pdf.splitTextToSize(formatTextForPDF(pc.interpretation), contentWidth), margin, y);
      y += 14;
    }

    // R-Strategy Alignment
    if (scoringResult.r_strategy_alignment?.alignment_score != null) {
      y += 4;
      pdf.setFontSize(14);
      pdf.setTextColor(5, 150, 105);
      pdf.text('R-Strategy Alignment', margin, y);
      y += 8;
      pdf.setFontSize(12);
      pdf.setTextColor(44, 62, 80);
      const ra = scoringResult.r_strategy_alignment;
      pdf.text(
        `Strategy: ${ra.strategy}  |  Alignment: ${ra.alignment_score}/100 (${ra.rating})`,
        margin,
        y,
      );
      y += 7;
      pdf.text(pdf.splitTextToSize(formatTextForPDF(ra.message), contentWidth), margin, y);
    }
  }

  if (scoringResult?.audit) {
    const audit = scoringResult.audit;

    pdf.addPage();
    pdf.setFontSize(16);
    pdf.setTextColor(5, 150, 105);
    pdf.text('AI Audit Summary', margin, 30);
    pdf.setFontSize(12);
    pdf.setTextColor(44, 62, 80);

    let y = 45;

    if (audit.audit_verdict) {
      pdf.setFontSize(14);
      pdf.text('Audit Verdict', margin, y);
      y += 10;
      pdf.setFontSize(12);
      pdf.text(pdf.splitTextToSize(formatTextForPDF(audit.audit_verdict), contentWidth), margin, y);
      y += 20;
    }

    if (audit.technical_recommendations?.length > 0) {
      pdf.setFontSize(14);
      pdf.text('Technical Recommendations', margin, y);
      y += 10;
      pdf.setFontSize(12);
      audit.technical_recommendations.slice(0, 3).forEach((rec, i) => {
        const line = `${i + 1}. ${formatTextForPDF(rec)}`;
        pdf.text(pdf.splitTextToSize(line, contentWidth), margin, y);
        y += 10;
      });
      y += 5;
    }

    if (audit.integrity_gaps?.length > 0) {
      pdf.setFontSize(14);
      pdf.text('Integrity Gaps', margin, y);
      y += 10;
      pdf.setFontSize(12);
      audit.integrity_gaps.forEach((gap) => {
        const line = `[${(gap.severity || 'low').toUpperCase()}] ${formatTextForPDF(gap.issue)}`;
        pdf.text(pdf.splitTextToSize(line, contentWidth), margin, y);
        y += 10;
      });
      y += 5;
    }

    // Improvement Roadmap
    if (audit.improvement_roadmap?.length > 0) {
      // Start a new page if running low (rough check)
      if (y > 230) {
        pdf.addPage();
        y = 30;
      }
      pdf.setFontSize(14);
      pdf.setTextColor(5, 150, 105);
      pdf.text('Improvement Roadmap', margin, y);
      y += 8;
      pdf.setFontSize(11);
      pdf.setTextColor(44, 62, 80);
      audit.improvement_roadmap.forEach((item) => {
        const line = `${item.priority}. ${formatTextForPDF(item.action)} [${item.effort} effort / ${item.impact} impact / ${item.timeframe}]`;
        pdf.text(pdf.splitTextToSize(line, contentWidth), margin, y);
        y += 12;
      });
      y += 5;
    }

    // SDG Alignment
    if (audit.sdg_alignment?.length > 0) {
      if (y > 230) {
        pdf.addPage();
        y = 30;
      }
      pdf.setFontSize(14);
      pdf.setTextColor(5, 150, 105);
      pdf.text('UN SDG Alignment', margin, y);
      y += 8;
      pdf.setFontSize(11);
      pdf.setTextColor(44, 62, 80);
      audit.sdg_alignment.forEach((sdg) => {
        const line = `SDG ${sdg.sdg_number} ${sdg.sdg_name} (${sdg.relevance}): ${formatTextForPDF(sdg.rationale)}`;
        pdf.text(pdf.splitTextToSize(line, contentWidth), margin, y);
        y += 10;
      });
      y += 5;
    }

    // Market Opportunity
    if (audit.market_opportunity_summary) {
      if (y > 230) {
        pdf.addPage();
        y = 30;
      }
      pdf.setFontSize(14);
      pdf.setTextColor(5, 150, 105);
      pdf.text('Market Opportunity', margin, y);
      y += 8;
      pdf.setFontSize(11);
      pdf.setTextColor(44, 62, 80);
      pdf.text(
        pdf.splitTextToSize(formatTextForPDF(audit.market_opportunity_summary), contentWidth),
        margin,
        y,
      );
    }
  }

  // Save the PDF
  const dateStr = new Date().toISOString().split('T')[0];
  const safeName = String(assessmentName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const filename = `${safeName || 'assessment'}-${dateStr}.pdf`;
  pdf.save(filename);
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
      <h1>Audit Report</h1>
      <p>${formatTextForPDF(title)}</p>
      <p>Generated: ${formatDate(new Date())}</p>
    </div>

    <div class="section">
      <div class="section-title">Assessment Details</div>
      <table class="metadata-table">
        <tr>
          <td>Industry</td>
          <td>${formatTextForPDF(assessment.industry || result.industry || 'N/A')}</td>
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
        <div class="section-title">Audit Verdict</div>
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
        <div class="section-title">+ Key Strengths</div>
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
        <div class="section-title">‼ Risk Areas & Gaps</div>
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
        <div class="section-title">✓ Recommendations</div>
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
        <div class="section-title">* Auditor Notes</div>
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
