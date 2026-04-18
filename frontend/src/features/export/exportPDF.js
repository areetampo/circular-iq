/**
 * PDF Export Functions - Complete Implementation
 * Handles exporting assessment and audit reports to PDF format using programmatic jsPDF
 *
 * Location: src/features/export/exportPDF.js
 */

import jsPDF from 'jspdf';

import { reconstructScoringResult } from '@/features/assessments/utils';

// Page layout constants
const PAGE_WIDTH = 210; // A4 width in mm
const PAGE_HEIGHT = 297; // A4 height in mm
const MARGIN_LEFT = 18;
const MARGIN_RIGHT = 18;
const HEADER_HEIGHT = 28;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const CONTENT_START_Y = 36; // After header
const FOOTER_Y = 282;
const PAGE_THRESHOLD = 268; // When to add new page

// Anthropic-inspired warm editorial palette
const COLOR_BG = '#F7F3EE'; // warm cream page background
const COLOR_SURFACE = '#EDE8E0'; // card/band fills
const COLOR_BORDER = '#D9D0C4'; // subtle rule lines
const COLOR_TEXT = '#1C1C1C'; // near-black body
const COLOR_TEXT_MUTED = '#6B6560'; // muted labels
const COLOR_PRIMARY = '#2D6A4F'; // deep forest green
const COLOR_ACCENT = '#C2714F'; // warm terracotta
const COLOR_GOLD = '#B5936A'; // muted gold
const COLOR_SUCCESS = '#2D6A4F';
const COLOR_WARNING = '#C77D34';
const COLOR_DANGER = '#B5432A';
const COLOR_WHITE = '#FFFFFF';
const COLOR_HEADER_BG = '#1A1A1A';

/**
 * Formats text for PDF display (no length limit)
 * @param {string} text - Text to format
 * @returns {string} Formatted text
 */
function formatTextForPDF(text) {
  if (!text) return '';
  return String(text).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
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
 * Converts hex color to RGB object for jsPDF
 * @param {string} hex - Hex color string
 * @returns {Object} RGB object with r, g, b properties
 */
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

/**
 * Reliable page break checker with state management
 * @param {Object} pdf - jsPDF instance
 * @param {number} y - Current Y position
 * @param {number} neededHeight - Height needed for content
 * @param {Object} state - Page state object
 * @returns {number} New Y position
 */
function checkPageBreak(pdf, y, neededHeight, state) {
  if (y + neededHeight > PAGE_THRESHOLD) {
    pdf.addPage();
    state.currentPage++;
    fillPageBackground(pdf);
    drawHeader(pdf, state.title, state.subtitle);
    return CONTENT_START_Y;
  }
  return y;
}

function fillPageBackground(pdf) {
  const c = hexToRgb(COLOR_BG);
  pdf.setFillColor(c.r, c.g, c.b);
  pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
}

/**
 * Gets tier color based on badge color field
 * @param {string} badgeColor - Badge color from tier data
 * @returns {string} Hex color
 */
function getTierColor(badgeColor) {
  switch (badgeColor?.toLowerCase()) {
    case 'green':
      return COLOR_PRIMARY;
    case 'orange':
      return COLOR_WARNING;
    case 'red':
      return COLOR_DANGER;
    default:
      return COLOR_PRIMARY;
  }
}

/**
 * Draws header on current page
 * @param {Object} pdf - jsPDF instance
 * @param {string} title - Report title
 * @param {string} subtitle - Report subtitle
 * @param {number} overallScore - Overall score (for cover page)
 * @param {boolean} isCover - Whether this is a cover page
 */
function drawHeader(pdf, title, subtitle, overallScore, isCover = false) {
  // Page 1: dark branded band
  if (overallScore !== undefined || isCover) {
    const hBg = hexToRgb(COLOR_HEADER_BG);
    pdf.setFillColor(hBg.r, hBg.g, hBg.b);
    pdf.rect(0, 0, PAGE_WIDTH, HEADER_HEIGHT, 'F');

    // Left accent stripe
    const acc = hexToRgb(COLOR_ACCENT);
    pdf.setFillColor(acc.r, acc.g, acc.b);
    pdf.rect(0, 0, 3, HEADER_HEIGHT, 'F');

    // Title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(15);
    pdf.setFont('times', 'bold');
    pdf.text(String('Circular Economy Assessment Report'), 10, 14);

    // Subtitle
    const rule = hexToRgb(COLOR_BORDER);
    pdf.setTextColor(rule.r, rule.g, rule.b);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(String(subtitle), 10, 23);

    // Score - just the number, no label
    if (overallScore !== undefined) {
      const acc2 = hexToRgb(COLOR_ACCENT);
      pdf.setTextColor(acc2.r, acc2.g, acc2.b);
      pdf.setFontSize(22);
      pdf.setFont('times', 'bold');
      pdf.text(String(overallScore), PAGE_WIDTH - MARGIN_RIGHT, 22, { align: 'right' });
    }
  } else {
    // Interior pages: cream background with thin warm rule
    const bg = hexToRgb(COLOR_BG);
    pdf.setFillColor(bg.r, bg.g, bg.b);
    pdf.rect(0, 0, PAGE_WIDTH, HEADER_HEIGHT, 'F');

    // Thin accent line at very top
    const acc = hexToRgb(COLOR_ACCENT);
    pdf.setFillColor(acc.r, acc.g, acc.b);
    pdf.rect(0, 0, PAGE_WIDTH, 1.5, 'F');

    // Report title - small, muted
    const tl = hexToRgb(COLOR_TEXT_MUTED);
    pdf.setTextColor(tl.r, tl.g, tl.b);
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'normal');
    pdf.text(String('Circular Economy Assessment Report'), MARGIN_LEFT, 14);

    // Assessment name right-aligned
    pdf.text(String(subtitle.split('  ')[0] || subtitle), PAGE_WIDTH - MARGIN_RIGHT, 14, {
      align: 'right',
    });

    // Warm rule line at 27mm
    const rule = hexToRgb(COLOR_BORDER);
    pdf.setDrawColor(rule.r, rule.g, rule.b);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN_LEFT, 27, PAGE_WIDTH - MARGIN_RIGHT, 27);
  }
}

/**
 * Draws footer on current page
 * @param {Object} pdf - jsPDF instance
 * @param {number} pageNum - Current page number
 * @param {number} totalPages - Total pages
 */
function drawFooter(pdf, pageNum, totalPages) {
  const rule = hexToRgb(COLOR_BORDER);
  pdf.setDrawColor(rule.r, rule.g, rule.b);
  pdf.setLineWidth(0.25);
  pdf.line(MARGIN_LEFT, FOOTER_Y, PAGE_WIDTH - MARGIN_RIGHT, FOOTER_Y);

  const tl = hexToRgb(COLOR_TEXT_MUTED);
  pdf.setTextColor(tl.r, tl.g, tl.b);
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'normal');
  pdf.text(
    `Page ${String(pageNum)} of ${String(totalPages)}`,
    PAGE_WIDTH - MARGIN_RIGHT,
    FOOTER_Y + 4.5,
    {
      align: 'right',
    },
  );
}

/**
 * Draws section heading with accent bar
 * @param {Object} pdf - jsPDF instance
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} text - Section text
 * @returns {number} New Y position
 */
function drawSectionHeading(pdf, x, y, text) {
  // Small colored accent mark
  const acc = hexToRgb(COLOR_ACCENT);
  pdf.setFillColor(acc.r, acc.g, acc.b);
  pdf.rect(x, y + 4, 18, 1.2, 'F');

  // Heading text
  const tc = hexToRgb(COLOR_PRIMARY);
  pdf.setTextColor(tc.r, tc.g, tc.b);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text(String(text), x, y + 12);

  // Full-width warm rule
  const rule = hexToRgb(COLOR_BORDER);
  pdf.setDrawColor(rule.r, rule.g, rule.b);
  pdf.setLineWidth(0.3);
  pdf.line(x, y + 14, x + CONTENT_WIDTH, y + 14);

  return y + 20;
}

/**
 * Draws a score box with rounded corners
 * @param {Object} pdf - jsPDF instance
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Box width
 * @param {number} height - Box height
 * @param {string} value - Score value
 * @param {string} label - Score label
 * @param {string} color - Box color
 * @returns {number} New Y position
 */
function drawScoreBox(pdf, x, y, width, height, value, label, color = COLOR_PRIMARY) {
  const band = hexToRgb(COLOR_SURFACE);
  pdf.setFillColor(band.r, band.g, band.b);
  pdf.roundedRect(x, y, width, height, 2, 2, 'F');

  const col = hexToRgb(color);
  // Top 2mm accent stripe
  pdf.setFillColor(col.r, col.g, col.b);
  pdf.rect(x, y, width, 2, 'F');

  // Value
  pdf.setTextColor(col.r, col.g, col.b);
  pdf.setFontSize(20);
  pdf.setFont('times', 'bold');
  pdf.text(String(value), x + width / 2, y + height / 2 + 4, { align: 'center' });

  // Label
  const tl = hexToRgb(COLOR_TEXT_MUTED);
  pdf.setTextColor(tl.r, tl.g, tl.b);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.text(String(label.toUpperCase()), x + width / 2, y + height - 4, { align: 'center' });
}

/**
 * Draws a horizontal score bar
 * @param {Object} pdf - jsPDF instance
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} score - Score value (0-100)
 * @param {number} maxWidth - Maximum bar width
 * @returns {number} New Y position
 */
function drawScoreBar(pdf, x, y, score, maxWidth = 80) {
  const barHeight = 3.5;
  const fillWidth = Math.max((score / 100) * maxWidth, 1);
  const scoreColor = score >= 80 ? COLOR_SUCCESS : score >= 60 ? COLOR_WARNING : COLOR_DANGER;

  const bgc = hexToRgb(COLOR_BORDER);
  pdf.setFillColor(bgc.r, bgc.g, bgc.b);
  pdf.roundedRect(x, y, maxWidth, barHeight, 0.8, 0.8, 'F');

  const fc = hexToRgb(scoreColor);
  pdf.setFillColor(fc.r, fc.g, fc.b);
  pdf.roundedRect(x, y, fillWidth, barHeight, 0.8, 0.8, 'F');

  const tl = hexToRgb(COLOR_TEXT_MUTED);
  pdf.setTextColor(tl.r, tl.g, tl.b);
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'normal');
  pdf.text(String(`${String(score)}`), x + maxWidth + 3, y + 3);

  return y + barHeight + 4.5;
}

/**
 * Draws a table row with proper color handling
 * @param {Object} pdf - jsPDF instance
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {Array} cells - Cell data array
 * @param {Array} widths - Column widths array
 * @param {boolean} isHeader - Whether this is a header row
 * @param {boolean} hasBackground - Whether to draw background
 * @returns {number} New Y position
 */
function drawTableRow(pdf, x, y, cells, widths, isHeader = false, hasBackground = false) {
  const rowHeight = isHeader ? 11 : 9;

  if (isHeader) {
    const c = hexToRgb(COLOR_SURFACE);
    pdf.setFillColor(c.r, c.g, c.b);
    pdf.rect(x, y - rowHeight + 2, CONTENT_WIDTH, rowHeight, 'F');
  } else if (hasBackground) {
    const c = hexToRgb(COLOR_SURFACE);
    pdf.setFillColor(c.r, c.g, c.b);
    pdf.rect(x, y - rowHeight + 2, CONTENT_WIDTH, rowHeight, 'F');
  }

  let currentX = x;
  cells.forEach((cell, index) => {
    const cellWidth = widths[index] || CONTENT_WIDTH / cells.length;
    if (isHeader) {
      const c = hexToRgb(COLOR_TEXT);
      pdf.setTextColor(c.r, c.g, c.b);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
    } else {
      const c = hexToRgb(COLOR_TEXT);
      pdf.setTextColor(c.r, c.g, c.b);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
    }
    const lines = pdf.splitTextToSize(String(cell), cellWidth - 3);
    lines.forEach((line, li) => {
      pdf.text(String(line), currentX + 2, y - rowHeight + 7 + li * 3.5);
    });
    currentX += cellWidth;
  });
  return y + rowHeight;
}

/**
 * Estimates the height a similar case card will need (in mm).
 * Used to decide whether to start a new page before rendering.
 */
function estimateCaseCardHeight(pdf, caseItem) {
  const textWidth = CONTENT_WIDTH - 14;
  let h = 16; // title + similarity line + padding

  if (caseItem.materials) h += 5;

  const addBlock = (text) => {
    if (!text) return;
    h += 5; // label
    const lines = pdf.splitTextToSize(formatTextForPDF(text), textWidth);
    h += lines.length * 4 + 3;
  };

  addBlock(caseItem.problem);
  addBlock(caseItem.solution);
  addBlock(caseItem.impact);
  if (caseItem.source_display || caseItem.source_url) h += 6;
  h += 8; // bottom padding

  return h;
}

function drawSimilarCaseCard(pdf, x, y, caseItem) {
  // NOTE: No checkPageBreak calls inside this function — callers must ensure
  // enough space exists before calling, using estimateCaseCardHeight().
  // Mid-card page breaks corrupt the accent stripe calculation (negative totalHeight).
  const cardX = x;
  const cardPadding = 4;
  const textWidth = CONTENT_WIDTH - cardPadding * 2 - 6;
  const startY = y;

  // Title
  const tc = hexToRgb(COLOR_PRIMARY);
  pdf.setTextColor(tc.r, tc.g, tc.b);
  pdf.setFontSize(10);
  pdf.setFont('times', 'bold');
  const titleLines = pdf.splitTextToSize(
    formatTextForPDF(String(caseItem.title || 'Untitled Case')),
    textWidth,
  );
  titleLines.forEach((line) => {
    pdf.text(String(line), cardX + cardPadding + 3, y);
    y += 4.5;
  });
  y += 2;

  // Similarity + Strategy
  const tl = hexToRgb(COLOR_TEXT_MUTED);
  pdf.setTextColor(tl.r, tl.g, tl.b);
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'normal');
  const simPct =
    typeof caseItem.similarity === 'number' ? (caseItem.similarity * 100).toFixed(0) : '0';
  const simText = `${simPct}% similar${caseItem.circular_strategy ? ' · ' + caseItem.circular_strategy : ''}`;
  const simLines = pdf.splitTextToSize(simText, textWidth);
  simLines.forEach((line) => {
    pdf.text(String(line), cardX + cardPadding + 3, y);
    y += 3.5;
  });

  if (caseItem.materials) {
    pdf.text(String(`Materials: ${caseItem.materials}`), cardX + cardPadding + 3, y);
    y += 4;
  }
  y += 3;

  // Render a labelled text block — NO page break checks inside
  const renderBlock = (label, text) => {
    if (!text) return;
    const tc2 = hexToRgb(COLOR_TEXT);
    pdf.setTextColor(tc2.r, tc2.g, tc2.b);
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text(String(label), cardX + cardPadding + 3, y);
    y += 4;
    pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(formatTextForPDF(String(text)), textWidth);
    lines.forEach((line) => {
      pdf.text(String(line), cardX + cardPadding + 3, y);
      y += 4;
    });
    y += 3;
  };

  renderBlock('Problem:', caseItem.problem);
  renderBlock('Solution:', caseItem.solution);
  renderBlock('Impact:', caseItem.impact);

  if (caseItem.source_display || caseItem.source_url) {
    const tl2 = hexToRgb(COLOR_TEXT_MUTED);
    pdf.setTextColor(tl2.r, tl2.g, tl2.b);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'italic');
    pdf.text(
      String(`Source: ${caseItem.source_display || caseItem.source_url}`),
      cardX + cardPadding + 3,
      y,
    );
    y += 5;
  }

  // Draw accent stripe now that we know the real height — always positive
  const totalHeight = y - startY;
  const acc = hexToRgb(COLOR_ACCENT);
  pdf.setFillColor(acc.r, acc.g, acc.b);
  pdf.rect(cardX, startY, 3, Math.max(totalHeight, 1), 'F');

  return y + 5;
}

/**
 * Exports an assessment as a high-fidelity PDF report using programmatic jsPDF
 * @param {Object} assessment - Assessment data to export
 * @param {Object} options - Export options (unused in new implementation)
 * @returns {Promise<void>}
 */
export async function exportAssessmentPDF(assessment, options = {}) {
  if (!assessment) {
    throw new Error('Assessment data is required');
  }

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
  const formattedDate = assessmentDate ? formatDate(assessmentDate) : '';

  const subtitle = formattedDate ? `${assessmentName}  ${formattedDate}` : assessmentName;

  // Create PDF
  const pdf = new jsPDF('p', 'mm', 'a4');
  const state = {
    currentPage: 1,
    title: 'Circular Economy Assessment Report',
    subtitle,
    totalPages: 1, // Will be updated at end
  };
  let y = CONTENT_START_Y;

  // Fill page background
  fillPageBackground(pdf);

  // Draw header and footer for first page
  drawHeader(pdf, state.title, state.subtitle, result.overall_score);
  drawFooter(pdf, state.currentPage, state.totalPages);

  // === PAGE 1: EXECUTIVE SUMMARY ===

  y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Executive Summary');

  // Score row with three boxes
  const boxWidth = 48;
  const boxHeight = 30;
  const boxSpacing = 8;
  let boxX = MARGIN_LEFT;
  const boxStartY = y;

  // Overall Score
  drawScoreBox(
    pdf,
    boxX,
    boxStartY,
    boxWidth,
    boxHeight,
    String(result.overall_score || 0),
    'Overall Score',
    COLOR_PRIMARY,
  );
  boxX += boxWidth + boxSpacing;

  // Confidence Level
  drawScoreBox(
    pdf,
    boxX,
    boxStartY,
    boxWidth,
    boxHeight,
    String(result.confidence_level || 0),
    'Confidence',
    COLOR_ACCENT,
  );
  boxX += boxWidth + boxSpacing;

  // CE Tier
  const tier = result.circular_economy_tier;
  if (tier) {
    const tierColor = getTierColor(tier.badge_color);
    drawScoreBox(
      pdf,
      boxX,
      boxStartY,
      boxWidth,
      boxHeight,
      tier.tier || 'N/A',
      'CE Tier',
      tierColor,
    );
  }

  y = boxStartY + boxHeight + 8;

  // CE Tier description
  if (tier && tier.description) {
    const tc = hexToRgb(COLOR_TEXT);
    pdf.setTextColor(tc.r, tc.g, tc.b);
    pdf.setFontSize(9.5);
    pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(formatTextForPDF(tier.description), CONTENT_WIDTH);
    lines.forEach((line) => {
      pdf.text(String(line), MARGIN_LEFT, y);
      y += 4.8;
    });
    y += 10;
  }

  // Derived Metrics row - 4 mini-cards
  y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Derived Metrics');
  const derivedMetrics = result.derived_metrics || {};
  const metricLabels = [
    'Technical Feasibility',
    'Economic Viability',
    'Circularity Potential',
    'Risk Level',
  ];
  const metricValues = [
    derivedMetrics.technical_feasibility || 'N/A',
    derivedMetrics.economic_viability || 'N/A',
    derivedMetrics.circularity_potential || 'N/A',
    (derivedMetrics.risk_level || 'N/A').toString().toUpperCase(),
  ];

  const metricWidth = CONTENT_WIDTH / 4;
  metricLabels.forEach((label, i) => {
    const cardX = MARGIN_LEFT + i * metricWidth;
    const c = hexToRgb(COLOR_SURFACE);
    pdf.setFillColor(c.r, c.g, c.b);
    pdf.roundedRect(cardX, y - 2, metricWidth - 4, 18, 2, 2, 'F');

    const lc = hexToRgb(COLOR_TEXT_MUTED);
    pdf.setTextColor(lc.r, lc.g, lc.b);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(String(label.toUpperCase()), cardX + (metricWidth - 4) / 2, y + 3, {
      align: 'center',
    });

    const tc = hexToRgb(COLOR_TEXT);
    pdf.setTextColor(tc.r, tc.g, tc.b);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(String(String(metricValues[i])), cardX + (metricWidth - 4) / 2, y + 12, {
      align: 'center',
    });
  });
  y += 24;

  // Assessment Metadata table
  y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Assessment Metadata');
  const metadataData = [
    ['Industry', metadata.industry || assessment.industry || 'N/A'],
    ['Scale', metadata.scale || assessment.scale || 'N/A'],
    ['R-Strategy', metadata.r_strategy || assessment.r_strategy || 'N/A'],
    ['Primary Material', metadata.primary_material || assessment.primary_material || 'N/A'],
    ['Geographic Focus', metadata.geographic_focus || assessment.geographic_focus || 'N/A'],
    ['Short Description', metadata.short_description || 'N/A'],
  ];

  metadataData.forEach(([label, value], rowIndex) => {
    if (rowIndex % 2 === 0) {
      const c = hexToRgb(COLOR_SURFACE);
      pdf.setFillColor(c.r, c.g, c.b);
      pdf.rect(MARGIN_LEFT, y - 2, CONTENT_WIDTH, 9, 'F');
    }
    const lc = hexToRgb(COLOR_TEXT_MUTED);
    pdf.setTextColor(lc.r, lc.g, lc.b);
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text(String(label.toUpperCase()), MARGIN_LEFT + 2, y + 4);

    const tc = hexToRgb(COLOR_TEXT);
    pdf.setTextColor(tc.r, tc.g, tc.b);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    if (label === 'Short Description') {
      const lines = pdf.splitTextToSize(String(value), CONTENT_WIDTH - 58);
      lines
        .slice(0, 2)
        .forEach((line, i) => pdf.text(String(line), MARGIN_LEFT + 58, y + 4 + i * 4));
      y += Math.max(lines.slice(0, 2).length * 4 + 2, 10);
    } else {
      pdf.text(String(String(value)), MARGIN_LEFT + 58, y + 4);
      y += 10;
    }
  });

  y += 10;

  // Business Context table
  const businessContext = assessment.business_context || result.business_context || {};
  if (Object.keys(businessContext).length > 0) {
    y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Business Context');
    const contextData = [
      ['Target Geography', businessContext.target_geography || 'N/A'],
      ['Operational Stage', businessContext.operational_stage || 'N/A'],
      ['Business Model Type', businessContext.business_model_type || 'N/A'],
      ['Material Complexity', businessContext.material_complexity || 'N/A'],
      ['Annual Volume Estimate', businessContext.annual_volume_estimate || 'N/A'],
      ['Has Existing Partnerships', businessContext.has_existing_partnerships ? 'Yes' : 'No'],
    ];

    contextData.forEach(([label, value], rowIndex) => {
      y = checkPageBreak(pdf, y, 12, state);

      if (rowIndex % 2 === 0) {
        const c = hexToRgb(COLOR_SURFACE);
        pdf.setFillColor(c.r, c.g, c.b);
        pdf.rect(MARGIN_LEFT, y - 3, CONTENT_WIDTH, 9, 'F');
      }
      const lc = hexToRgb(COLOR_TEXT_MUTED);
      pdf.setTextColor(lc.r, lc.g, lc.b);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text(String(label.toUpperCase()), MARGIN_LEFT + 2, y + 3);

      const tc = hexToRgb(COLOR_TEXT);
      pdf.setTextColor(tc.r, tc.g, tc.b);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(String(String(value)), MARGIN_LEFT + 62, y + 3);
      y += 9;
    });
  }

  // === PAGE 2: BUSINESS PROBLEM & SOLUTION ===
  state.currentPage++;
  pdf.addPage();
  fillPageBackground(pdf);
  drawHeader(pdf, state.title, state.subtitle);
  y = CONTENT_START_Y;

  y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Business Problem');
  const businessProblem =
    assessment.businessProblem ||
    assessment.business_problem ||
    result.businessProblem ||
    result.business_problem ||
    '';
  if (businessProblem) {
    const tc = hexToRgb(COLOR_TEXT);
    pdf.setTextColor(tc.r, tc.g, tc.b);
    pdf.setFontSize(9.5);
    pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(formatTextForPDF(businessProblem), CONTENT_WIDTH);
    lines.forEach((line) => {
      y = checkPageBreak(pdf, y, 5, state);
      pdf.text(String(line), MARGIN_LEFT + 2, y);
      y += 4.8;
    });
  }

  y += 15;
  y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Business Solution');
  const businessSolution =
    assessment.businessSolution ||
    assessment.business_solution ||
    result.businessSolution ||
    result.business_solution ||
    '';
  if (businessSolution) {
    const tc = hexToRgb(COLOR_TEXT);
    pdf.setTextColor(tc.r, tc.g, tc.b);
    pdf.setFontSize(9.5);
    pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(formatTextForPDF(businessSolution), CONTENT_WIDTH);
    lines.forEach((line) => {
      y = checkPageBreak(pdf, y, 5, state);
      pdf.text(String(line), MARGIN_LEFT + 2, y);
      y += 4.8;
    });
  }

  // === PAGE 3: SCORE BREAKDOWN ===
  state.currentPage++;
  pdf.addPage();
  fillPageBackground(pdf);
  drawHeader(pdf, state.title, state.subtitle);
  y = CONTENT_START_Y;

  y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Score Breakdown');
  const scoreBreakdown = result.score_breakdown || {};

  Object.entries(scoreBreakdown).forEach(([category, data]) => {
    y = checkPageBreak(pdf, y, 50, state);

    const acc = hexToRgb(COLOR_ACCENT);
    pdf.setFillColor(acc.r, acc.g, acc.b);
    pdf.rect(MARGIN_LEFT, y - 1, 2.5, 9, 'F');
    const prim = hexToRgb(COLOR_PRIMARY);
    pdf.setTextColor(prim.r, prim.g, prim.b);
    pdf.setFontSize(10.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text(String(category), MARGIN_LEFT + 6, y + 7);
    y += 10;

    const tc = hexToRgb(COLOR_TEXT_MUTED);
    pdf.setTextColor(tc.r, tc.g, tc.b);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      String(`Score: ${String(data.score || 0)} | Weight: ${data.weight || '0%'}`),
      MARGIN_LEFT,
      y,
    );
    y += 6;

    if (data.description) {
      const tc2 = hexToRgb(COLOR_TEXT);
      pdf.setTextColor(tc2.r, tc2.g, tc2.b);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      const lines = pdf.splitTextToSize(formatTextForPDF(data.description), CONTENT_WIDTH - 10);
      lines.forEach((line) => {
        pdf.text(String(line), MARGIN_LEFT + 5, y);
        y += 4;
      });
    }

    if (data.factors && data.factors.length > 0) {
      y += 5;
      data.factors.forEach((factor) => {
        y = checkPageBreak(pdf, y, 10, state);
        const tc3 = hexToRgb(COLOR_TEXT);
        pdf.setTextColor(tc3.r, tc3.g, tc3.b);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(String(factor.name), MARGIN_LEFT + 2, y + 2);
        y = drawScoreBar(pdf, MARGIN_LEFT + 60, y - 1, factor.score || 0, CONTENT_WIDTH - 72);
        y += 2;
      });
    }

    y += 15;
  });

  // Weighted Score Card
  const weightedScoreCard = result.weighted_score_card;
  if (weightedScoreCard && weightedScoreCard.factors) {
    y = checkPageBreak(pdf, y, 100, state);
    y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Weighted Score Card');

    // Table header
    const columnWidths = [40, 25, 20, 25, 30, 15];
    y = drawTableRow(
      pdf,
      MARGIN_LEFT,
      y,
      ['Factor', 'Raw Score', 'Weight', 'Contribution', 'Classification', 'Rank'],
      columnWidths,
      true,
    );

    // Sort factors by rank
    const sortedFactors = Object.entries(weightedScoreCard.factors).sort(
      ([, a], [, b]) => (a.rank || 999) - (b.rank || 999),
    );

    sortedFactors.forEach(([factorName, factorData], index) => {
      y = checkPageBreak(pdf, y, 20, state);
      y = drawTableRow(
        pdf,
        MARGIN_LEFT,
        y,
        [
          factorName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          String(factorData.raw_score || 0),
          String(factorData.weight_percent || '0%'),
          String(factorData.contribution || 0),
          factorData.classification || 'N/A',
          String(factorData.rank || index + 1),
        ],
        columnWidths,
        false,
        index % 2 === 0,
      );
    });

    y += 10;

    // Top and bottom contributors
    if (weightedScoreCard.top_contributor) {
      const tc = hexToRgb(COLOR_PRIMARY);
      pdf.setTextColor(tc.r, tc.g, tc.b);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      const topContributor = weightedScoreCard.top_contributor
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      pdf.text(`Top Contributor: ${topContributor}`, MARGIN_LEFT, y);
      y += 8;
    }

    if (weightedScoreCard.bottom_contributor) {
      const tc = hexToRgb(COLOR_DANGER);
      pdf.setTextColor(tc.r, tc.g, tc.b);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      const bottomContributor = weightedScoreCard.bottom_contributor
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      pdf.text(`Bottom Contributor: ${bottomContributor}`, MARGIN_LEFT, y);
      y += 8;
    }
  }

  // === PAGE 4: INTEGRITY ANALYSIS ===
  const audit = result.audit;
  if (audit) {
    state.currentPage++;
    pdf.addPage();
    fillPageBackground(pdf);
    drawHeader(pdf, state.title, state.subtitle);
    y = CONTENT_START_Y;

    y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Integrity Analysis');

    // Audit Verdict
    if (audit.audit_verdict) {
      y = checkPageBreak(pdf, y, 50, state);
      y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Audit Verdict');

      // Surface card for verdict with dynamic height
      const lines = pdf.splitTextToSize(formatTextForPDF(audit.audit_verdict), CONTENT_WIDTH - 8);
      const cardHeight = Math.max(lines.length * 4.8 + 8, 20);
      const c = hexToRgb(COLOR_SURFACE);
      pdf.setFillColor(c.r, c.g, c.b);
      pdf.roundedRect(MARGIN_LEFT, y - 2, CONTENT_WIDTH, cardHeight, 2, 2, 'F');

      const tc = hexToRgb(COLOR_TEXT);
      pdf.setTextColor(tc.r, tc.g, tc.b);
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'normal');
      lines.forEach((line) => {
        pdf.text(String(line), MARGIN_LEFT + 4, y + 4);
        y += 4.8;
      });
      y += cardHeight - lines.length * 4.8 + 5;
    }

    // Comparative Analysis
    if (audit.comparative_analysis) {
      y = checkPageBreak(pdf, y, 30, state);
      y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Comparative Analysis');
      const tc = hexToRgb(COLOR_TEXT);
      pdf.setTextColor(tc.r, tc.g, tc.b);
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(
        formatTextForPDF(audit.comparative_analysis),
        CONTENT_WIDTH,
      );
      lines.forEach((line) => {
        pdf.text(String(line), MARGIN_LEFT, y);
        y += 4.8;
      });
      y += 15;
    }

    // Key Metrics Comparison
    if (audit.key_metrics_comparison) {
      y = checkPageBreak(pdf, y, 50, state);
      y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Key Metrics Comparison');

      Object.entries(audit.key_metrics_comparison).forEach(([key, value]) => {
        const tc = hexToRgb(COLOR_TEXT_MUTED);
        pdf.setTextColor(tc.r, tc.g, tc.b);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        pdf.text(String(label + ':'), MARGIN_LEFT, y);

        const tc2 = hexToRgb(COLOR_TEXT);
        pdf.setTextColor(tc2.r, tc2.g, tc2.b);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(String(value), CONTENT_WIDTH - 60);
        lines.forEach((line, i) => {
          pdf.text(String(line), MARGIN_LEFT + 60, y + i * 4);
        });
        y += lines.length * 4 + 8;
      });
    }

    // Strengths
    if (audit.strengths && audit.strengths.length > 0) {
      y = checkPageBreak(pdf, y, 50, state);
      y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Strengths');

      audit.strengths.forEach((strength) => {
        const tc = hexToRgb(COLOR_PRIMARY);
        pdf.setTextColor(tc.r, tc.g, tc.b);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(String(' ' + formatTextForPDF(strength.aspect)), MARGIN_LEFT, y);

        const tc2 = hexToRgb(COLOR_TEXT_MUTED);
        pdf.setTextColor(tc2.r, tc2.g, tc2.b);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        pdf.text(
          String(`(Evidence: ${strength.evidence_source_id || 'N/A'})`),
          MARGIN_LEFT + 15,
          y + 3,
        );
        y += 10;
      });
    }

    // Integrity Gaps
    if (audit.integrity_gaps && audit.integrity_gaps.length > 0) {
      y = checkPageBreak(pdf, y, 50, state);
      y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Integrity Gaps');

      audit.integrity_gaps.forEach((gap) => {
        const severity = gap.severity || 'low';
        const severityBg =
          severity === 'high'
            ? COLOR_DANGER
            : severity === 'medium'
              ? COLOR_WARNING
              : COLOR_TEXT_MUTED;
        const sc = hexToRgb(severityBg);
        pdf.setFillColor(sc.r, sc.g, sc.b);
        pdf.roundedRect(MARGIN_LEFT, y - 3, 22, 7, 2, 2, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.text(String(severity.toUpperCase()), MARGIN_LEFT + 11, y + 2, { align: 'center' });

        const tc = hexToRgb(COLOR_TEXT);
        pdf.setTextColor(tc.r, tc.g, tc.b);
        pdf.setFontSize(9.5);
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(formatTextForPDF(gap.issue), CONTENT_WIDTH - 26);
        lines.forEach((line, i) => {
          pdf.text(String(line), MARGIN_LEFT + 26, y + i * 4.8);
        });

        const tc2 = hexToRgb(COLOR_TEXT_MUTED);
        pdf.setTextColor(tc2.r, tc2.g, tc2.b);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        pdf.text(
          String(`(Evidence: ${gap.evidence_source_id || 'N/A'})`),
          MARGIN_LEFT + 26,
          y + lines.length * 4.8 + 2,
        );

        y += lines.length * 4.8 + 12;
      });
    }

    // Technical Recommendations
    if (audit.technical_recommendations && audit.technical_recommendations.length > 0) {
      y = checkPageBreak(pdf, y, 50, state);
      y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Technical Recommendations');

      audit.technical_recommendations.forEach((rec, index) => {
        const tc = hexToRgb(COLOR_TEXT);
        pdf.setTextColor(tc.r, tc.g, tc.b);
        pdf.setFontSize(9.5);
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(
          `${String(index + 1)}. ${formatTextForPDF(rec)}`,
          CONTENT_WIDTH - 4,
        );
        lines.forEach((line) => {
          pdf.text(String(line), MARGIN_LEFT, y);
          y += 4.8;
        });
        y += 2;
      });
    }

    // Similar Cases Summaries
    if (audit.similar_cases_summaries && audit.similar_cases_summaries.length > 0) {
      y = checkPageBreak(pdf, y, 50, state);
      y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Similar Cases Summaries');

      audit.similar_cases_summaries.forEach((summary) => {
        const tc = hexToRgb(COLOR_TEXT);
        pdf.setTextColor(tc.r, tc.g, tc.b);
        pdf.setFontSize(9.5);
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(formatTextForPDF(summary), CONTENT_WIDTH - 4);
        lines.forEach((line) => {
          pdf.text(String(line), MARGIN_LEFT, y);
          y += 4.8;
        });
        y += 2;
      });
    }
  }

  // === PAGE 5: SIMILAR CASES ===
  const similarCases = result.similar_cases || [];
  if (similarCases.length > 0) {
    state.currentPage++;
    pdf.addPage();
    fillPageBackground(pdf);
    drawHeader(pdf, state.title, state.subtitle);
    y = CONTENT_START_Y;

    y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Similar Cases');

    similarCases.forEach((caseItem, index) => {
      const cardHeight = estimateCaseCardHeight(pdf, caseItem);
      const dividerSpace = index > 0 ? 10 : 0;

      // Check if enough space for this card — if not, start a new page
      if (y + cardHeight + dividerSpace > PAGE_THRESHOLD) {
        pdf.addPage();
        state.currentPage++;
        fillPageBackground(pdf);
        drawHeader(pdf, state.title, state.subtitle);
        y = CONTENT_START_Y;
      } else if (index > 0) {
        // Horizontal divider between cases (only if we didn't page-break)
        const rule = hexToRgb(COLOR_BORDER);
        pdf.setDrawColor(rule.r, rule.g, rule.b);
        pdf.setLineWidth(0.3);
        pdf.line(MARGIN_LEFT, y - 3, PAGE_WIDTH - MARGIN_RIGHT, y - 3);
        y += 5;
      }

      y = drawSimilarCaseCard(pdf, MARGIN_LEFT, y, caseItem);
    });
  }

  // === PAGE 6: IMPROVEMENT ROADMAP ===
  if (audit && audit.improvement_roadmap && audit.improvement_roadmap.length > 0) {
    state.currentPage++;
    pdf.addPage();
    fillPageBackground(pdf);
    drawHeader(pdf, state.title, state.subtitle);
    y = CONTENT_START_Y;

    y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Improvement Roadmap');

    // Table header
    const roadmapWidths = [15, 60, 35, 20, 20, 30];
    y = drawTableRow(
      pdf,
      MARGIN_LEFT,
      y,
      ['Priority', 'Action', 'Target Factor', 'Effort', 'Impact', 'Timeframe'],
      roadmapWidths,
      true,
    );

    audit.improvement_roadmap.forEach((item, index) => {
      y = checkPageBreak(pdf, y, 25, state);

      // Calculate row height based on action text length
      const actionLines = pdf.splitTextToSize(
        formatTextForPDF(item.action || ''),
        roadmapWidths[1] - 4,
      );
      const rowHeight = Math.max(actionLines.length * 4 + 7, 12);

      // Background for even rows
      if (index % 2 === 0) {
        const c = hexToRgb(COLOR_SURFACE);
        pdf.setFillColor(c.r, c.g, c.b);
        pdf.rect(MARGIN_LEFT, y - rowHeight + 2, CONTENT_WIDTH, rowHeight, 'F');
      }

      // Priority
      const tc = hexToRgb(COLOR_TEXT);
      pdf.setTextColor(tc.r, tc.g, tc.b);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text(String(item.priority ?? 'N/A'), MARGIN_LEFT + 2, y + 4);

      // Action (wrapped)
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      actionLines.forEach((line, i) => {
        pdf.text(String(line), MARGIN_LEFT + roadmapWidths[0] + 2, y + 4 + i * 4);
      });

      // Target Factor
      pdf.text(
        String(formatTextForPDF(item.target_factor || '')),
        MARGIN_LEFT + roadmapWidths[0] + roadmapWidths[1] + 2,
        y + 4,
      );

      // Effort
      pdf.text(
        String(formatTextForPDF(item.effort || '')),
        MARGIN_LEFT + roadmapWidths[0] + roadmapWidths[1] + roadmapWidths[2] + 2,
        y + 4,
      );

      // Impact
      pdf.text(
        String(formatTextForPDF(item.impact || '')),
        MARGIN_LEFT + roadmapWidths[0] + roadmapWidths[1] + roadmapWidths[2] + roadmapWidths[3] + 2,
        y + 4,
      );

      // Timeframe
      pdf.text(
        String(formatTextForPDF(item.timeframe || '')),
        MARGIN_LEFT +
          roadmapWidths[0] +
          roadmapWidths[1] +
          roadmapWidths[2] +
          roadmapWidths[3] +
          roadmapWidths[4] +
          2,
        y + 4,
      );

      y += rowHeight;
    });
  }

  // === PAGE 7: R-STRATEGY & PARAMETER CONSISTENCY ===
  state.currentPage++;
  pdf.addPage();
  fillPageBackground(pdf);
  drawHeader(pdf, state.title, state.subtitle);
  y = CONTENT_START_Y;

  // R-Strategy Alignment
  const rStrategyAlignment = result.r_strategy_alignment;
  if (rStrategyAlignment) {
    y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'R-Strategy Alignment');

    // Strategy name and alignment score
    const tc = hexToRgb(COLOR_TEXT);
    pdf.setTextColor(tc.r, tc.g, tc.b);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(String(`Strategy: ${rStrategyAlignment.strategy || 'N/A'}`), MARGIN_LEFT, y);
    y += 8;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      String(
        `Alignment Score: ${rStrategyAlignment.alignment_score || 'N/A'} (${rStrategyAlignment.rating || 'N/A'})`,
      ),
      MARGIN_LEFT,
      y,
    );
    y += 8;

    if (rStrategyAlignment.message) {
      const lines = pdf.splitTextToSize(
        formatTextForPDF(rStrategyAlignment.message),
        CONTENT_WIDTH,
      );
      lines.forEach((line) => {
        pdf.text(String(line), MARGIN_LEFT, y);
        y += 4.8;
      });
      y += 10;
    }

    // Well-aligned vs Misaligned factors
    if (
      rStrategyAlignment.well_aligned_factors &&
      rStrategyAlignment.well_aligned_factors.length > 0
    ) {
      y = checkPageBreak(pdf, y, 30, state);
      const tc2 = hexToRgb(COLOR_PRIMARY);
      pdf.setTextColor(tc2.r, tc2.g, tc2.b);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(String('Well-Aligned Factors:'), MARGIN_LEFT, y);
      y += 6;

      rStrategyAlignment.well_aligned_factors.forEach((factor) => {
        const tc3 = hexToRgb(COLOR_TEXT);
        pdf.setTextColor(tc3.r, tc3.g, tc3.b);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(String(`  ${factor}`), MARGIN_LEFT + 4, y);
        y += 4;
      });
      y += 8;
    }

    if (rStrategyAlignment.misaligned_factors && rStrategyAlignment.misaligned_factors.length > 0) {
      y = checkPageBreak(pdf, y, 30, state);
      const tc4 = hexToRgb(COLOR_DANGER);
      pdf.setTextColor(tc4.r, tc4.g, tc4.b);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(String('Misaligned Factors:'), MARGIN_LEFT, y);
      y += 6;

      rStrategyAlignment.misaligned_factors.forEach((factor) => {
        const tc5 = hexToRgb(COLOR_TEXT);
        pdf.setTextColor(tc5.r, tc5.g, tc5.b);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(String(`  ${factor}`), MARGIN_LEFT + 4, y);
        y += 4;
      });
      y += 8;
    }
  }

  // Parameter Consistency
  const parameterConsistency = result.parameter_consistency;
  if (parameterConsistency) {
    y = checkPageBreak(pdf, y, 30, state);
    y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Parameter Consistency');

    const tc = hexToRgb(COLOR_TEXT);
    pdf.setTextColor(tc.r, tc.g, tc.b);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      String(
        `Score: ${parameterConsistency.score || 'N/A'} (${parameterConsistency.rating || 'N/A'})`,
      ),
      MARGIN_LEFT,
      y,
    );
    y += 8;

    if (parameterConsistency.interpretation) {
      const lines = pdf.splitTextToSize(
        formatTextForPDF(parameterConsistency.interpretation),
        CONTENT_WIDTH,
      );
      lines.forEach((line) => {
        pdf.text(String(line), MARGIN_LEFT, y);
        y += 4.8;
      });
      y += 10;
    }

    if (parameterConsistency.issues && parameterConsistency.issues.length > 0) {
      const tc2 = hexToRgb(COLOR_TEXT_MUTED);
      pdf.setTextColor(tc2.r, tc2.g, tc2.b);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(String('Issues found:'), MARGIN_LEFT, y);
      y += 5;

      parameterConsistency.issues.forEach((issue) => {
        pdf.text(String(`  ${issue}`), MARGIN_LEFT + 4, y);
        y += 4;
      });
    }
  }

  // === PAGE 8: GAP ANALYSIS ===
  const gapAnalysis = result.gap_analysis;
  if (gapAnalysis && gapAnalysis.has_benchmarks) {
    state.currentPage++;
    pdf.addPage();
    fillPageBackground(pdf);
    drawHeader(pdf, state.title, state.subtitle);
    y = CONTENT_START_Y;

    y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Gap Analysis');

    // Benchmarks table
    if (gapAnalysis.comparisons) {
      y = checkPageBreak(pdf, y, 40, state);
      y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Benchmark Comparisons');

      const benchmarkWidths = [40, 25, 25, 25, 25, 20];
      y = drawTableRow(
        pdf,
        MARGIN_LEFT,
        y,
        ['Factor', 'Your Score', 'P25', 'P50', 'P75', 'Status'],
        benchmarkWidths,
        true,
      );

      Object.entries(gapAnalysis.comparisons).forEach(([factor, comparison], index) => {
        y = checkPageBreak(pdf, y, 12, state);

        const statusColor = comparison.status?.includes('above')
          ? COLOR_SUCCESS
          : comparison.status?.includes('below')
            ? COLOR_DANGER
            : COLOR_WARNING;

        y = drawTableRow(
          pdf,
          MARGIN_LEFT,
          y,
          [
            factor.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
            String(comparison.userScore || 0),
            String(comparison.p25 || 0),
            String(comparison.p50 || 0),
            String(comparison.p75 || 0),
            comparison.status || 'N/A',
          ],
          benchmarkWidths,
          false,
          index % 2 === 0,
        );
      });
      y += 10;
    }

    // Opportunities
    if (gapAnalysis.opportunities && gapAnalysis.opportunities.length > 0) {
      y = checkPageBreak(pdf, y, 30, state);
      y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Opportunities');

      const tc = hexToRgb(COLOR_PRIMARY);
      pdf.setTextColor(tc.r, tc.g, tc.b);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');

      gapAnalysis.opportunities.forEach((opportunity, index) => {
        pdf.text(
          String(`${String(index + 1)}. ${formatTextForPDF(opportunity)}`),
          MARGIN_LEFT + 2,
          y,
        );
        y += 5;
      });
      y += 10;
    }

    // Strengths
    if (gapAnalysis.strengths && gapAnalysis.strengths.length > 0) {
      y = checkPageBreak(pdf, y, 30, state);
      y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Gap Strengths');

      const tc = hexToRgb(COLOR_PRIMARY);
      pdf.setTextColor(tc.r, tc.g, tc.b);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');

      gapAnalysis.strengths.forEach((strength, index) => {
        pdf.text(String(`${String(index + 1)}. ${formatTextForPDF(strength)}`), MARGIN_LEFT + 2, y);
        y += 5;
      });
      y += 10;
    }

    // Analysis message
    if (gapAnalysis.message) {
      y = checkPageBreak(pdf, y, 20, state);
      const tc = hexToRgb(COLOR_TEXT);
      pdf.setTextColor(tc.r, tc.g, tc.b);
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(formatTextForPDF(gapAnalysis.message), CONTENT_WIDTH);
      lines.forEach((line) => {
        pdf.text(String(line), MARGIN_LEFT, y);
        y += 4.8;
      });
    }
  }

  // === PAGE 9: SDG ALIGNMENT & MARKET OPPORTUNITY ===
  state.currentPage++;
  pdf.addPage();
  fillPageBackground(pdf);
  drawHeader(pdf, state.title, state.subtitle);
  y = CONTENT_START_Y;

  // SDG Alignment
  if (audit && audit.sdg_alignment && audit.sdg_alignment.length > 0) {
    y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'UN SDG Alignment');

    audit.sdg_alignment.forEach((sdg) => {
      y = checkPageBreak(pdf, y, 25, state);

      // SDG number and name as heading
      const tc = hexToRgb(COLOR_PRIMARY);
      pdf.setTextColor(tc.r, tc.g, tc.b);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(String(`SDG ${String(sdg.sdg_number)}: ${sdg.sdg_name}`), MARGIN_LEFT, y);
      y += 8;

      // Relevance badge
      const tc2 = hexToRgb(COLOR_TEXT_MUTED);
      pdf.setTextColor(tc2.r, tc2.g, tc2.b);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(String(`Relevance: ${sdg.relevance || 'N/A'}`), MARGIN_LEFT, y);
      y += 6;

      // Rationale
      if (sdg.rationale) {
        const tc3 = hexToRgb(COLOR_TEXT);
        pdf.setTextColor(tc3.r, tc3.g, tc3.b);
        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(formatTextForPDF(sdg.rationale), CONTENT_WIDTH);
        lines.forEach((line) => {
          pdf.text(line, MARGIN_LEFT + 2, y);
          y += 4;
        });
      }
      y += 8;
    });
    y += 10;
  }

  // Market Opportunity Summary
  if (audit && audit.market_opportunity_summary) {
    y = checkPageBreak(pdf, y, 30, state);
    y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Market Opportunity');

    // Surface card for market opportunity with dynamic height
    const lines = pdf.splitTextToSize(
      formatTextForPDF(audit.market_opportunity_summary),
      CONTENT_WIDTH - 8,
    );
    const cardHeight = Math.max(lines.length * 4.8 + 8, 30);
    const c = hexToRgb(COLOR_SURFACE);
    pdf.setFillColor(c.r, c.g, c.b);
    pdf.roundedRect(MARGIN_LEFT, y - 2, CONTENT_WIDTH, cardHeight, 2, 2, 'F');

    const tc = hexToRgb(COLOR_TEXT);
    pdf.setTextColor(tc.r, tc.g, tc.b);
    pdf.setFontSize(9.5);
    pdf.setFont('helvetica', 'normal');
    lines.forEach((line) => {
      pdf.text(String(line), MARGIN_LEFT + 4, y + 4);
      y += 4.8;
    });
    y += cardHeight - lines.length * 4.8 + 5;
  }

  // === PAGE 10: CE TIER DETAIL ===
  if (tier) {
    state.currentPage++;
    pdf.addPage();
    fillPageBackground(pdf);
    drawHeader(pdf, state.title, state.subtitle);
    y = CONTENT_START_Y;

    y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Circular Economy Tier Detail');

    // Large tier name
    const tierColor = getTierColor(tier.badge_color);
    const tc = hexToRgb(tierColor);
    pdf.setTextColor(tc.r, tc.g, tc.b);
    pdf.setFontSize(24);
    pdf.setFont('times', 'bold');
    pdf.text(String(tier.tier || 'N/A'), MARGIN_LEFT, y);
    y += 15;

    // Tier details
    const tc2 = hexToRgb(COLOR_TEXT);
    pdf.setTextColor(tc2.r, tc2.g, tc2.b);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    if (tier.range) {
      pdf.text(String(`Range: ${tier.range}`), MARGIN_LEFT, y);
      y += 8;
    }

    if (tier.percentile_estimate !== undefined) {
      pdf.text(String(tier.percentile_estimate || 'N/A'), MARGIN_LEFT, y);
      y += 8;
    }

    y += 10;

    // Description
    if (tier.description) {
      const lines = pdf.splitTextToSize(formatTextForPDF(tier.description), CONTENT_WIDTH);
      lines.forEach((line) => {
        pdf.text(String(line), MARGIN_LEFT, y);
        y += 4.8;
      });
      y += 10;
    }

    // Next milestone in callout box
    if (tier.next_milestone) {
      y = checkPageBreak(pdf, y, 25, state);

      // Callout box
      const c = hexToRgb(COLOR_SURFACE);
      pdf.setFillColor(c.r, c.g, c.b);
      pdf.roundedRect(MARGIN_LEFT, y - 2, CONTENT_WIDTH, 20, 2, 2, 'F');

      const tc3 = hexToRgb(COLOR_TEXT_MUTED);
      pdf.setTextColor(tc3.r, tc3.g, tc3.b);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text(String('NEXT MILESTONE'), MARGIN_LEFT + 4, y + 4);

      const tc4 = hexToRgb(COLOR_TEXT);
      pdf.setTextColor(tc4.r, tc4.g, tc4.b);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const milestoneLines = pdf.splitTextToSize(
        formatTextForPDF(tier.next_milestone),
        CONTENT_WIDTH - 8,
      );
      milestoneLines.forEach((line, i) => {
        pdf.text(String(line), MARGIN_LEFT + 4, y + 10 + i * 4);
      });
    }
  }

  // === FINALIZE: Update page numbers and save ===
  state.totalPages = state.currentPage;

  // Backfill footers with correct page numbers
  for (let pageNum = 1; pageNum <= state.totalPages; pageNum++) {
    pdf.setPage(pageNum);
    drawFooter(pdf, pageNum, state.totalPages);
  }

  // Generate filename
  const safeName = String(assessmentName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${safeName}-${dateStr}.pdf`;

  // Save the PDF
  pdf.save(filename);
  return { success: true, message: 'PDF downloaded successfully' };
}

/**
 * Exports a comparison between multiple assessments to PDF
 * @param {Object|Array<Object>} assessments - Assessments to compare
 * @returns {Promise<void>}
 */
export async function exportComparisonPDF(assessments) {
  // Handle both single object and array inputs
  const assessmentArray = Array.isArray(assessments) ? assessments : [assessments];

  if (assessmentArray.length === 0) {
    throw new Error('At least one assessment is required');
  }

  const names = assessmentArray
    .map((a) => {
      const name = a.title || a.industry || 'assessment';
      return String(name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 20);
    })
    .join('-vs-');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `comparison-${names}-${dateStr}.pdf`;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const state = {
    currentPage: 1,
    title: 'Assessment Comparison Report',
    subtitle: `Generated ${formatDate(new Date())}`,
    totalPages: 1,
  };
  let y = CONTENT_START_Y;

  // Fill page background
  fillPageBackground(pdf);

  // Draw header and footer for first page
  drawHeader(pdf, state.title, state.subtitle, undefined, true);
  drawFooter(pdf, state.currentPage, state.totalPages);

  // === PAGE 1: OVERVIEW TABLE ===
  y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Assessment Overview');

  // Extract assessment data
  const assessmentData = assessmentArray.map((assessment, index) => {
    const result = assessment.result_json || assessment;
    const metadata = result.metadata || {};
    const title = assessment.title || `Assessment ${String(index + 1)}`;

    return {
      title: title.length > 25 ? title.substring(0, 25) + '...' : title,
      overallScore: result.overall_score || 0,
      confidence: result.confidence_level || 0,
      ceTier: result.circular_economy_tier?.tier || 'N/A',
      industry: assessment.industry || metadata.industry || 'N/A',
      scale: assessment.scale || metadata.scale || 'N/A',
      rStrategy: assessment.r_strategy || metadata.r_strategy || 'N/A',
      primaryMaterial: assessment.primary_material || metadata.primary_material || 'N/A',
      riskLevel: result.derived_metrics?.risk_level || 'N/A',
      technicalFeasibility: result.derived_metrics?.technical_feasibility || 'N/A',
      economicViability: result.derived_metrics?.economic_viability || 'N/A',
      circularityPotential: result.derived_metrics?.circularity_potential || 'N/A',
      alignmentScore: result.r_strategy_alignment?.alignment_score || 'N/A',
      consistencyScore: result.parameter_consistency?.score || 'N/A',
      businessProblem:
        assessment.business_problem ||
        assessment.businessProblem ||
        result.business_problem ||
        result.businessProblem ||
        '',
      businessSolution:
        assessment.business_solution ||
        assessment.businessSolution ||
        result.business_solution ||
        result.businessSolution ||
        '',
      auditVerdict: result.audit?.audit_verdict || '',
      improvementRoadmap: result.audit?.improvement_roadmap || [],
      technicalRecommendations: result.audit?.technical_recommendations || [],
      similarCases: result.similar_cases || [],
      sdgAlignment: result.audit?.sdg_alignment || [],
      marketOpportunity: result.audit?.market_opportunity_summary || '',
    };
  });

  // Table setup
  const columnWidths =
    assessmentArray.length === 2
      ? [30, 30, 30, 30]
      : assessmentArray.map(() => CONTENT_WIDTH / (assessmentArray.length + 1));

  // Header row
  const headers =
    assessmentArray.length === 2
      ? ['Metric', assessmentData[0].title, assessmentData[1].title, 'Change (±)']
      : ['Metric', ...assessmentData.map((a) => a.title)];

  y = drawTableRow(pdf, MARGIN_LEFT, y, headers, columnWidths, true);

  // Data rows
  const metrics = [
    ['Overall Score', 'overallScore'],
    ['Confidence Level', 'confidence'],
    ['CE Tier', 'ceTier'],
    ['Industry', 'industry'],
    ['Scale', 'scale'],
    ['R-Strategy', 'rStrategy'],
    ['Primary Material', 'primaryMaterial'],
    ['Risk Level', 'riskLevel'],
    ['Technical Feasibility', 'technicalFeasibility'],
    ['Economic Viability', 'economicViability'],
    ['Circularity Potential', 'circularityPotential'],
    ['Alignment Score', 'alignmentScore'],
    ['Consistency Score', 'consistencyScore'],
  ];

  metrics.forEach(([label, key], rowIndex) => {
    y = checkPageBreak(pdf, y, 12, state);

    const row = [label];
    if (assessmentArray.length === 2) {
      const val1 = assessmentData[0][key];
      const val2 = assessmentData[1][key];
      row.push(val1, val2);

      // Calculate delta for numeric values
      const delta = typeof val1 === 'number' && typeof val2 === 'number' ? val2 - val1 : 'N/A';
      row.push(typeof delta === 'number' ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}` : 'N/A');
    } else {
      assessmentData.forEach((a) => row.push(a[key]));
    }

    y = drawTableRow(pdf, MARGIN_LEFT, y, row, columnWidths, false, rowIndex % 2 === 0);
  });

  // === PAGE 2: FACTOR SCORES COMPARISON ===
  state.currentPage++;
  pdf.addPage();
  fillPageBackground(pdf);
  drawHeader(pdf, state.title, state.subtitle);
  y = CONTENT_START_Y;

  y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Factor Scores Comparison');

  // Get all factors across assessments
  const allFactors = new Set();
  assessmentArray.forEach((assessment) => {
    const result = assessment.result_json || assessment;
    if (result.sub_scores) {
      Object.keys(result.sub_scores).forEach((factor) => allFactors.add(factor));
    }
  });

  const factorColumnWidths =
    assessmentArray.length === 2
      ? [40, 25, 25, 25]
      : assessmentArray.map(() => CONTENT_WIDTH / (assessmentArray.length + 1));

  // Factor header
  const factorHeaders =
    assessmentArray.length === 2
      ? ['Factor', assessmentData[0].title, assessmentData[1].title, 'Change (±)']
      : ['Factor', ...assessmentData.map((a) => a.title)];

  y = drawTableRow(pdf, MARGIN_LEFT, y, factorHeaders, factorColumnWidths, true);

  // Factor rows
  Array.from(allFactors)
    .sort()
    .forEach((factor) => {
      y = checkPageBreak(pdf, y, 12, state);

      const factorLabel = factor.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      const row = [factorLabel];

      if (assessmentArray.length === 2) {
        const result1 = assessmentArray[0].result_json || assessmentArray[0];
        const result2 = assessmentArray[1].result_json || assessmentArray[1];
        const score1 = result1.sub_scores?.[factor] || 0;
        const score2 = result2.sub_scores?.[factor] || 0;

        row.push(score1, score2);
        const delta = score2 - score1;
        row.push(`${delta > 0 ? '+' : ''}${delta.toFixed(1)}`);
      } else {
        assessmentArray.forEach((assessment) => {
          const result = assessment.result_json || assessment;
          row.push(result.sub_scores?.[factor] || 0);
        });
      }

      y = drawTableRow(
        pdf,
        MARGIN_LEFT,
        y,
        row,
        factorColumnWidths,
        false,
        Array.from(allFactors).indexOf(factor) % 2 === 0,
      );
    });

  // === PER-ASSESSMENT DETAIL PAGES ===
  assessmentArray.forEach((assessment, index) => {
    state.currentPage++;
    pdf.addPage();
    fillPageBackground(pdf);
    drawHeader(pdf, state.title, state.subtitle);
    y = CONTENT_START_Y;

    const result = assessment.result_json || assessment;
    const assessmentName = assessmentData[index].title;

    y = drawSectionHeading(pdf, MARGIN_LEFT, y, assessmentName);

    // Business Problem
    if (assessmentData[index].businessProblem) {
      y = checkPageBreak(pdf, y, 30, state);
      y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Business Problem');

      const tc = hexToRgb(COLOR_TEXT);
      pdf.setTextColor(tc.r, tc.g, tc.b);
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(
        formatTextForPDF(assessmentData[index].businessProblem),
        CONTENT_WIDTH,
      );
      lines.forEach((line) => {
        pdf.text(line, MARGIN_LEFT, y);
        y += 4.8;
      });
      y += 10;
    }

    // Business Solution
    if (assessmentData[index].businessSolution) {
      y = checkPageBreak(pdf, y, 30, state);
      y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Business Solution');

      const tc = hexToRgb(COLOR_TEXT);
      pdf.setTextColor(tc.r, tc.g, tc.b);
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(
        formatTextForPDF(assessmentData[index].businessSolution),
        CONTENT_WIDTH,
      );
      lines.forEach((line) => {
        pdf.text(line, MARGIN_LEFT, y);
        y += 4.8;
      });
      y += 10;
    }

    // Audit Verdict
    if (assessmentData[index].auditVerdict) {
      y = checkPageBreak(pdf, y, 30, state);
      y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Audit Verdict');

      const tc = hexToRgb(COLOR_TEXT);
      pdf.setTextColor(tc.r, tc.g, tc.b);
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(
        formatTextForPDF(assessmentData[index].auditVerdict),
        CONTENT_WIDTH,
      );
      lines.forEach((line) => {
        pdf.text(line, MARGIN_LEFT, y);
        y += 4.8;
      });
      y += 10;
    }

    // Improvement Roadmap
    if (assessmentData[index].improvementRoadmap.length > 0) {
      y = checkPageBreak(pdf, y, 30, state);
      y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Improvement Roadmap');

      const roadmapWidths = [15, 60, 35, 20, 20, 30];
      y = drawTableRow(
        pdf,
        MARGIN_LEFT,
        y,
        ['Priority', 'Action', 'Target Factor', 'Effort', 'Impact', 'Timeframe'],
        roadmapWidths,
        true,
      );

      assessmentData[index].improvementRoadmap.forEach((item, itemIndex) => {
        y = checkPageBreak(pdf, y, 20, state);

        const actionLines = pdf.splitTextToSize(
          formatTextForPDF(item.action || ''),
          roadmapWidths[1] - 4,
        );
        const rowHeight = Math.max(actionLines.length * 4 + 7, 12);

        if (itemIndex % 2 === 0) {
          const c = hexToRgb(COLOR_SURFACE);
          pdf.setFillColor(c.r, c.g, c.b);
          pdf.rect(MARGIN_LEFT, y - rowHeight + 2, CONTENT_WIDTH, rowHeight, 'F');
        }

        const tc = hexToRgb(COLOR_TEXT);
        pdf.setTextColor(tc.r, tc.g, tc.b);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text(String(item.priority ?? 'N/A'), MARGIN_LEFT + 2, y + 4);

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        actionLines.forEach((line, i) => {
          pdf.text(line, MARGIN_LEFT + roadmapWidths[0] + 2, y + 4 + i * 4);
        });

        pdf.text(
          formatTextForPDF(item.target_factor || ''),
          MARGIN_LEFT + roadmapWidths[0] + roadmapWidths[1] + 2,
          y + 4,
        );
        pdf.text(
          String(formatTextForPDF(item.effort || '')),
          MARGIN_LEFT + roadmapWidths[0] + roadmapWidths[1] + roadmapWidths[2] + 2,
          y + 4,
        );
        pdf.text(
          String(formatTextForPDF(String(item.impact || ''))),
          MARGIN_LEFT +
            roadmapWidths[0] +
            roadmapWidths[1] +
            roadmapWidths[2] +
            roadmapWidths[3] +
            2,
          y + 4,
        );
        pdf.text(
          formatTextForPDF(item.timeframe || ''),
          MARGIN_LEFT +
            roadmapWidths[0] +
            roadmapWidths[1] +
            roadmapWidths[2] +
            roadmapWidths[3] +
            roadmapWidths[4] +
            2,
          y + 4,
        );

        y += rowHeight;
      });
      y += 10;
    }

    // Technical Recommendations
    if (assessmentData[index].technicalRecommendations.length > 0) {
      y = checkPageBreak(pdf, y, 30, state);
      y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Technical Recommendations');

      const tc = hexToRgb(COLOR_TEXT);
      pdf.setTextColor(tc.r, tc.g, tc.b);
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'normal');

      assessmentData[index].technicalRecommendations.forEach((rec, recIndex) => {
        const lines = pdf.splitTextToSize(
          `${String(recIndex + 1)}. ${formatTextForPDF(rec)}`,
          CONTENT_WIDTH,
        );
        lines.forEach((line) => {
          pdf.text(line, MARGIN_LEFT, y);
          y += 4.8;
        });
        y += 2;
      });
      y += 10;
    }

    // Similar Cases (up to 3)
    if (assessmentData[index].similarCases.length > 0) {
      y = checkPageBreak(pdf, y, 30, state);
      y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Similar Cases');

      assessmentData[index].similarCases.slice(0, 3).forEach((caseItem, caseIndex) => {
        const caseHeight = estimateCaseCardHeight(pdf, caseItem);
        if (y + caseHeight > PAGE_THRESHOLD) {
          pdf.addPage();
          state.currentPage++;
          fillPageBackground(pdf);
          drawHeader(pdf, state.title, state.subtitle);
          y = CONTENT_START_Y;
        } else if (caseIndex > 0) {
          const divRule = hexToRgb(COLOR_BORDER);
          pdf.setDrawColor(divRule.r, divRule.g, divRule.b);
          pdf.setLineWidth(0.2);
          pdf.line(MARGIN_LEFT, y - 3, PAGE_WIDTH - MARGIN_RIGHT, y - 3);
          y += 3;
        }

        y = drawSimilarCaseCard(pdf, MARGIN_LEFT, y, caseItem);
      });
    }

    // SDG Alignment
    if (assessmentData[index].sdgAlignment.length > 0) {
      y = checkPageBreak(pdf, y, 30, state);
      y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'UN SDG Alignment');

      const tc = hexToRgb(COLOR_TEXT);
      pdf.setTextColor(tc.r, tc.g, tc.b);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');

      assessmentData[index].sdgAlignment.forEach((sdg) => {
        pdf.text(
          `SDG ${String(sdg.sdg_number)}: ${sdg.sdg_name} (${sdg.relevance})`,
          MARGIN_LEFT,
          y,
        );
        y += 5;
      });
      y += 10;
    }

    // Market Opportunity
    if (assessmentData[index].marketOpportunity) {
      y = checkPageBreak(pdf, y, 30, state);
      y = drawSectionHeading(pdf, MARGIN_LEFT, y, 'Market Opportunity');

      const tc = hexToRgb(COLOR_TEXT);
      pdf.setTextColor(tc.r, tc.g, tc.b);
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(
        formatTextForPDF(assessmentData[index].marketOpportunity),
        CONTENT_WIDTH,
      );
      lines.forEach((line) => {
        pdf.text(line, MARGIN_LEFT, y);
        y += 4.8;
      });
    }
  });

  // === FINALIZE: Update page numbers and save ===
  state.totalPages = state.currentPage;

  // Backfill footers with correct page numbers
  for (let pageNum = 1; pageNum <= state.totalPages; pageNum++) {
    pdf.setPage(pageNum);
    drawFooter(pdf, pageNum, state.totalPages);
  }

  // Save the PDF
  pdf.save(filename);
  return { success: true, message: 'Comparison PDF downloaded successfully' };
}

/**
 * Exports an audit report to PDF (legacy function)
 * @param {Object} auditData - Audit data to export
 * @param {Object} options - Export options
 * @returns {Promise<void>}
 */
export async function exportAuditReportToPDF(auditData, options = {}) {
  // This is a legacy function - redirect to the main export function
  if (auditData.assessment) {
    return exportAssessmentPDF(auditData.assessment, options);
  }

  throw new Error('Valid assessment data is required for audit report export');
}
