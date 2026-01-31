/**
 * PDF Export Functions
 * Handles exporting assessment and audit reports to PDF format using jsPDF and html2canvas
 *
 * Location: src/features/export/exportPDF.js
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
 * Exports an assessment as a formatted PDF report with charts
 * @param {Object} assessment - Assessment data to export
 * @param {Function} getRatingBadge - Function to get rating badge text
 * @param {Object} options - Export options
 * @param {string} options.elementId - ID of the DOM element to capture (default: 'results-content')
 * @returns {Promise<void>}
 */
export async function exportAssessmentPDF(assessment, getRatingBadge, options = {}) {
  if (!assessment) {
    throw new Error('Assessment data is required');
  }

  const { elementId = 'results-content' } = options;
  const result = assessment.result_json || assessment;
  const metadata = result.metadata || {};
  const overallScore = result.overall_score || 0;
  const rating = getRatingBadge ? getRatingBadge(overallScore) : 'N/A';

  // A4 dimensions in mm
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  // Create PDF
  const pdf = new jsPDF('p', 'mm', 'a4');
  let currentY = margin;

  // Add Header
  pdf.setFillColor(52, 168, 58); // #34a83a
  pdf.rect(0, 0, pageWidth, 30, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('🌍 Circular Economy Assessment', pageWidth / 2, 15, { align: 'center' });

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Professional Evaluation Report`, pageWidth / 2, 23, { align: 'center' });

  currentY = 40;

  // Add Summary Section
  pdf.setTextColor(44, 62, 80); // #2c3e50
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Assessment Summary', margin, currentY);
  currentY += 10;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');

  // Score boxes
  const boxWidth = (contentWidth - 10) / 3;
  const boxHeight = 25;
  const boxY = currentY;

  // Overall Score Box
  pdf.setFillColor(240, 247, 240);
  pdf.rect(margin, boxY, boxWidth, boxHeight, 'F');
  pdf.setDrawColor(52, 168, 58);
  pdf.setLineWidth(0.5);
  pdf.rect(margin, boxY, boxWidth, boxHeight);

  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(52, 168, 58);
  pdf.text(String(overallScore), margin + boxWidth / 2, boxY + 12, { align: 'center' });

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(102, 102, 102);
  pdf.text('Overall Score', margin + boxWidth / 2, boxY + 20, { align: 'center' });

  // Rating Box
  pdf.setFillColor(240, 247, 240);
  pdf.rect(margin + boxWidth + 5, boxY, boxWidth, boxHeight, 'F');
  pdf.setDrawColor(52, 168, 58);
  pdf.rect(margin + boxWidth + 5, boxY, boxWidth, boxHeight);

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(52, 168, 58);
  pdf.text(rating, margin + boxWidth + 5 + boxWidth / 2, boxY + 12, { align: 'center' });

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(102, 102, 102);
  pdf.text('Rating', margin + boxWidth + 5 + boxWidth / 2, boxY + 20, { align: 'center' });

  // Metadata Box
  pdf.setFillColor(240, 247, 240);
  pdf.rect(margin + 2 * boxWidth + 10, boxY, boxWidth, boxHeight, 'F');
  pdf.setDrawColor(52, 168, 58);
  pdf.rect(margin + 2 * boxWidth + 10, boxY, boxWidth, boxHeight);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(44, 62, 80);
  pdf.text(
    formatTextForPDF(metadata.industry || 'General'),
    margin + 2 * boxWidth + 10 + boxWidth / 2,
    boxY + 12,
    { align: 'center' },
  );

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(102, 102, 102);
  pdf.text('Industry', margin + 2 * boxWidth + 10 + boxWidth / 2, boxY + 20, { align: 'center' });

  currentY += boxHeight + 15;

  // Try to capture charts and content from the page
  const contentElement = document.getElementById(elementId);

  if (contentElement) {
    try {
      // Find the main content sections to capture
      const caseSummary = contentElement.querySelector('[data-export-section="case-summary"]');
      const radarChart = contentElement.querySelector('[data-export-section="radar-chart"]');

      // Capture Case Summary if exists
      if (caseSummary) {
        const canvas = await html2canvas(caseSummary, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Check if we need a new page
        if (currentY + imgHeight > pageHeight - 20) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 10;
      }

      // Capture Radar Chart if exists
      if (radarChart) {
        // Add a new page for the chart
        pdf.addPage();
        currentY = margin;

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(44, 62, 80);
        pdf.text('Performance Analysis', margin, currentY);
        currentY += 10;

        const canvas = await html2canvas(radarChart, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 10;
      }
    } catch (error) {
      console.error('Error capturing charts:', error);
      // Continue with PDF generation even if chart capture fails
    }
  }

  // Add footer to all pages
  const pageCount = pdf.internal.getNumberOfPages();
  const timestamp = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);

    // Footer line
    pdf.setDrawColor(224, 224, 224);
    pdf.setLineWidth(0.5);
    pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    // Footer text
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(153, 153, 153);
    pdf.text(`Generated: ${timestamp}`, margin, pageHeight - 10);
    pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  // Save the PDF
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `circular-economy-assessment-${dateStr}.pdf`;
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
