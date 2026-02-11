/**
 * Dashboard PDF Export Utility
 * Exports the Global Dashboard to a PDF with filtered state and professional formatting
 *
 * Location: src/lib/exportDashboard.js
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Formats date for display
 * @returns {string} Formatted date string
 */
function getCurrentDate() {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Creates a professional header for the PDF
 * @param {jsPDF} pdf - jsPDF instance
 * @param {Object} filters - Active filters
 * @param {string} filters.industry - Selected industry
 * @param {string} filters.timeRange - Selected time range
 * @param {Object} timeRangeOptions - Time range options for label lookup
 * @param {Object} options - Additional header options
 * @param {string} options.logoUrl - Optional logo URL or path
 */
function addPDFHeader(pdf, filters, timeRangeOptions, options = {}) {
  const pageWidth = pdf.internal.pageSize.getWidth();

  // Add logo if provided
  if (options.logoUrl) {
    try {
      pdf.addImage(options.logoUrl, 'PNG', 15, 10, 20, 20);
    } catch (err) {
      console.warn('Failed to load logo:', err);
    }
  }

  // Add title
  pdf.setFontSize(24);
  pdf.setTextColor(5, 150, 105); // Primary color
  pdf.text('Circular Economy Global Intelligence Report', pageWidth / 2, 20, { align: 'center' });

  // Add date
  pdf.setFontSize(11);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generated on ${getCurrentDate()}`, pageWidth / 2, 30, { align: 'center' });

  // Add filter information
  const industryLabel = filters.industry === 'all' ? 'All Industries' : filters.industry;
  const timeRangeLabel =
    timeRangeOptions.find((opt) => opt.value === filters.timeRange)?.label || 'All Time';

  pdf.setFontSize(10);
  pdf.setTextColor(70, 70, 70);
  pdf.text(
    `Filters: Industry: ${industryLabel} | Time Range: ${timeRangeLabel}`,
    pageWidth / 2,
    38,
    { align: 'center' },
  );

  // Add divider line
  pdf.setDrawColor(5, 150, 105);
  pdf.setLineWidth(0.5);
  pdf.line(15, 42, pageWidth - 15, 42);

  return 50; // Return Y position for content start
}

/**
 * Exports the dashboard to PDF
 * @param {Object} options - Export options
 * @param {string} options.elementId - ID of the element to capture
 * @param {Object} options.filters - Active filters
 * @param {Object} options.timeRangeOptions - Time range options
 * @param {string} options.logoUrl - Optional logo URL for header
 * @param {string} options.orientation - Page orientation: 'portrait' or 'landscape' (default: 'portrait')
 * @returns {Promise<void>}
 */
export async function exportDashboardToPDF({
  elementId = 'dashboard-content',
  filters,
  timeRangeOptions,
  logoUrl = undefined,
  orientation = 'portrait',
}) {
  try {
    // Hide elements that shouldn't appear in PDF
    const filterBar = document.getElementById('dashboard-filter-bar');
    const exportButton = document.getElementById('dashboard-export-button');

    const originalFilterDisplay = filterBar?.style.display;
    const originalExportDisplay = exportButton?.style.display;

    if (filterBar) filterBar.style.display = 'none';
    if (exportButton) exportButton.style.display = 'none';

    // Get the element to capture
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Dashboard content element not found');
    }

    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 0,
      removeContainer: true,
    });

    // Restore hidden elements
    if (filterBar) filterBar.style.display = originalFilterDisplay || '';
    if (exportButton) exportButton.style.display = originalExportDisplay || '';

    // Determine page dimensions based on orientation
    const isLandscape = orientation.toLowerCase() === 'landscape';
    const pageFormat = isLandscape ? 'l' : 'p';
    const pageWidth = isLandscape ? 297 : 210; // mm
    const pageHeight = isLandscape ? 210 : 297; // mm

    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    // Create PDF
    const pdf = new jsPDF(pageFormat, 'mm', 'a4');

    // Add header with optional logo
    const contentStartY = addPDFHeader(pdf, filters, timeRangeOptions, { logoUrl });

    // Calculate available height for content
    const availableHeight = pageHeight - contentStartY - 20; // 20mm bottom margin

    // Add canvas image to PDF
    const imgData = canvas.toDataURL('image/png');

    if (imgHeight <= availableHeight) {
      // Single page
      pdf.addImage(imgData, 'PNG', 0, contentStartY, pageWidth, imgHeight);
    } else {
      // Multiple pages
      let heightLeft = imgHeight;
      let position = contentStartY;
      let page = 1;

      // First page
      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
      heightLeft -= availableHeight;

      // Additional pages
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + contentStartY;
        pdf.addPage();
        page += 1;

        // Add header to subsequent pages
        addPDFHeader(pdf, filters, timeRangeOptions, { logoUrl });

        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
        heightLeft -= availableHeight;
      }
    }

    // Add footer to all pages
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Page ${i} of ${totalPages} | Circular Economy Business Evaluator`,
        pdf.internal.pageSize.getWidth() / 2,
        pdf.internal.pageSize.getHeight() - 10,
        { align: 'center' },
      );
    }

    // Generate filename with timestamp and filters
    const timestamp = new Date().toISOString().split('T')[0];
    const industryPart =
      filters.industry === 'all' ? 'AllIndustries' : filters.industry.replace(/\s+/g, '');
    const filename = `Dashboard_${industryPart}_${timestamp}.pdf`;

    // Save the PDF
    pdf.save(filename);

    return filename;
  } catch (error) {
    console.error('Error exporting dashboard to PDF:', error);
    throw new Error(`Failed to export dashboard: ${error.message}`);
  }
}
