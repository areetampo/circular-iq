/**
 * Enhanced export utilities for comprehensive CSV and PDF reports
 */

// CSV Export for similar cases with detailed information
export function exportSimilarCasesToCSV(casesSummaries, similarCases) {
  if (!similarCases || similarCases.length === 0) {
    return { success: false, message: 'No similar cases to export' };
  }

  // Prepare CSV headers
  const headers = [
    'Case #',
    'Title',
    'Industry',
    'Scale',
    'Strategy',
    'Material',
    'Score',
    'Similarity',
    'Strengths',
    'Improvement Areas',
    'Problem Summary',
    'Solution Summary',
  ];

  const toText = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean).join('; ');
    return value ? String(value) : '';
  };

  const formatSimilarity = (value) => {
    if (value == null) return 'N/A';
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    if (num >= 0 && num <= 1) return `${Math.round(num * 100)}%`;
    return `${Math.round(num)}%`;
  };

  const pickScore = (caseItem) => {
    const score =
      caseItem.overall_score ??
      caseItem.score ??
      caseItem.avg_score ??
      caseItem.metadata?.score ??
      null;
    if (score == null) return 'N/A';
    const num = Number(score);
    return Number.isNaN(num) ? String(score) : num.toFixed(1).replace(/\.0$/, '');
  };

  // Prepare CSV rows
  const rows = similarCases.map((caseItem, index) => [
    index + 1,
    casesSummaries[index] || `Case ${index + 1}`,
    caseItem.metadata?.industry || 'N/A',
    caseItem.metadata?.scale || 'N/A',
    caseItem.metadata?.r_strategy || 'N/A',
    caseItem.metadata?.primary_material || 'N/A',
    pickScore(caseItem),
    formatSimilarity(
      caseItem.similarity_score ??
        caseItem.similarity ??
        caseItem.match_score ??
        caseItem.score_match,
    ),
    toText(caseItem.audit?.strengths) ||
      toText(caseItem.strengths) ||
      toText(caseItem.highlights) ||
      'N/A',
    toText(caseItem.audit?.challenges) ||
      toText(caseItem.challenges) ||
      toText(caseItem.gaps) ||
      'N/A',
    caseItem.business_problem ||
      caseItem.problem_summary ||
      caseItem.summary ||
      caseItem.description ||
      'N/A',
    caseItem.business_solution ||
      caseItem.solution_summary ||
      caseItem.approach ||
      caseItem.strategy_overview ||
      'N/A',
  ]);

  // Build CSV content with proper escaping
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const escaped = String(cell).replace(/"/g, '""');
          return escaped.includes(',') || escaped.includes('"') ? `"${escaped}"` : escaped;
        })
        .join(','),
    ),
  ].join('\n');

  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `similar-cases-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { success: true, message: `Exported ${similarCases.length} similar cases` };
}

// Comprehensive PDF export with professional styling
export async function exportAuditReportToPDF(
  result,
  radarData,
  businessViabilityScore,
  getRatingBadge,
) {
  try {
    const { default: html2pdf } = await import('html2pdf.js');

    const actualResult = result?.result_json || result;
    const overallScore =
      actualResult?.overall_score != null ? Number(actualResult.overall_score) : 0;
    const rating = getRatingBadge(overallScore);

    // Professional HTML template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Circular Economy Audit Report</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #2c3e50;
              line-height: 1.6;
              background: white;
            }

            .document {
              padding: 40px;
              max-width: 900px;
              margin: 0 auto;
            }

            /* Header */
            .header {
              border-bottom: 4px solid #34a83a;
              padding-bottom: 30px;
              margin-bottom: 40px;
              text-align: center;
            }

            .header h1 {
              font-size: 32px;
              color: #34a83a;
              margin-bottom: 10px;
              font-weight: 700;
            }

            .header p {
              font-size: 14px;
              color: #666;
              margin: 5px 0;
            }

            .date {
              font-size: 12px;
              color: #999;
              margin-top: 10px;
            }

            /* Score Card */
            .score-section {
              background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f5 100%);
              border: 2px solid #34a83a;
              border-radius: 8px;
              padding: 30px;
              margin-bottom: 30px;
              text-align: center;
            }

            .score-label {
              font-size: 14px;
              color: #666;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 10px;
            }

            .score-display {
              font-size: 56px;
              font-weight: 700;
              color: #34a83a;
              margin: 10px 0;
            }

            .rating-text {
              font-size: 16px;
              color: #2c3e50;
              font-weight: 600;
              margin-top: 10px;
            }

            /* Verdict Section */
            .verdict-section {
              background: #fff3e0;
              border-left: 4px solid #ff9800;
              padding: 20px;
              margin-bottom: 30px;
              border-radius: 4px;
            }

            .verdict-section h3 {
              color: #e65100;
              margin-bottom: 10px;
              font-size: 14px;
              text-transform: uppercase;
            }

            .verdict-section p {
              color: #555;
              font-size: 13px;
              line-height: 1.8;
            }

            /* Avoid image rendering for better text quality */
            img, canvas {
              display: none !important;
            }


            /* Metadata Grid */
            .metadata-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 30px;
            }

            .metadata-item {
              background: #f5f5f5;
              padding: 15px;
              border-radius: 6px;
              border-left: 3px solid #34a83a;
            }

            .metadata-label {
              font-size: 11px;
              color: #999;
              text-transform: uppercase;
              font-weight: 700;
              margin-bottom: 5px;
              letter-spacing: 0.5px;
            }

            .metadata-value {
              font-size: 14px;
              color: #2c3e50;
              font-weight: 600;
            }

            /* Section */
            h2 {
              font-size: 18px;
              color: #2c3e50;
              margin-top: 30px;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #34a83a;
              font-weight: 700;
            }

            h3 {
              font-size: 14px;
              color: #34a83a;
              margin-top: 15px;
              margin-bottom: 10px;
              font-weight: 700;
              text-transform: uppercase;
            }

            /* Lists */
            ul {
              margin-left: 20px;
              margin-bottom: 15px;
            }

            li {
              margin-bottom: 8px;
              font-size: 12px;
              color: #555;
              line-height: 1.6;
            }

            /* Scores Grid */
            .scores-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 12px;
              margin-bottom: 20px;
            }

            .score-box {
              background: #f9f9f9;
              padding: 12px;
              border-radius: 6px;
              text-align: center;
              border: 1px solid #e0e0e0;
            }

            .score-box-label {
              font-size: 10px;
              color: #999;
              text-transform: uppercase;
              font-weight: 700;
              margin-bottom: 5px;
            }

            .score-box-value {
              font-size: 20px;
              font-weight: 700;
              color: #34a83a;
            }

            /* Benchmarks */
            .benchmark-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 20px;
            }

            .benchmark-item {
              background: #e3f2fd;
              padding: 12px;
              border-radius: 6px;
              border-left: 3px solid #4a90e2;
            }

            .benchmark-label {
              font-size: 11px;
              color: #1565c0;
              font-weight: 700;
              margin-bottom: 5px;
            }

            .benchmark-value {
              font-size: 16px;
              font-weight: 700;
              color: #1565c0;
            }

            /* Strengths and Gaps */
            .strengths {
              background: #e8f5e9;
              border-left: 4px solid #34a83a;
              padding: 15px;
              margin-bottom: 15px;
              border-radius: 4px;
            }

            .gaps {
              background: #ffebee;
              border-left: 4px solid #dc3545;
              padding: 15px;
              margin-bottom: 15px;
              border-radius: 4px;
            }

            /* Footer */
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 2px solid #e0e0e0;
              font-size: 11px;
              color: #999;
              text-align: center;
            }

            /* Page Break */
            .page-break {
              page-break-after: always;
            }

            /* Recommendation Box */
            .recommendations-box {
              background: #e3f2fd;
              border-left: 4px solid #4a90e2;
              padding: 20px;
              margin-top: 30px;
              border-radius: 4px;
            }

            .recommendations-box h3 {
              color: #1565c0;
              margin-top: 0;
            }

            .recommendations-box ol {
              margin-left: 20px;
            }

            .recommendations-box li {
              margin-bottom: 10px;
              font-size: 12px;
            }

            /* Similar Cases */
            .similar-cases {
              margin-left: 20px;
              margin-bottom: 20px;
            }

            .similar-cases li {
              margin-bottom: 6px;
              color: #555;
              line-height: 1.5;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="document">
            <!-- Header -->
            <div class="header">
              <h1>Circular Economy Audit Report</h1>
              <p>Comprehensive Assessment of Business Circularity</p>
              <div class="date">${new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })} at ${new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}</div>
            </div>

            <!-- Score Section -->
            <div class="score-section">
              <div class="score-label">Overall Circularity Score</div>
              <div class="score-display">${overallScore}</div>
              <div style="font-size: 14px; color: #666;">/100</div>
              <div class="rating-text">Rating: <strong>${rating}</strong></div>
            </div>

            <!-- Audit Verdict -->
            ${
              actualResult.audit?.audit_verdict
                ? `
              <div class="verdict-section">
                <h3>Auditor's Verdict</h3>
                <p>${actualResult.audit.audit_verdict}</p>
              </div>
            `
                : ''
            }

            <!-- Executive Summary -->
            <h2>Executive Summary</h2>
            <p>${
              actualResult.audit?.comparative_analysis ||
              'This assessment provides a comprehensive evaluation of your business initiative against circular economy principles and industry benchmarks.'
            }</p>

            <!-- Project Classification -->
            ${
              actualResult.metadata
                ? `
              <h2>Project Classification</h2>
              <div class="metadata-grid">
                <div class="metadata-item">
                  <div class="metadata-label">Industry Sector</div>
                  <div class="metadata-value">${actualResult.metadata.industry || 'N/A'}</div>
                </div>
                <div class="metadata-item">
                  <div class="metadata-label">Business Scale</div>
                  <div class="metadata-value">${actualResult.metadata.scale || 'N/A'}</div>
                </div>
                <div class="metadata-item">
                  <div class="metadata-label">Circular Strategy</div>
                  <div class="metadata-value">${actualResult.metadata.r_strategy || 'N/A'}</div>
                </div>
                <div class="metadata-item">
                  <div class="metadata-label">Material Focus</div>
                  <div class="metadata-value">${actualResult.metadata.primary_material || 'N/A'}</div>
                </div>
                <div class="metadata-item">
                  <div class="metadata-label">Geographic Focus</div>
                  <div class="metadata-value">${actualResult.metadata.geographic_focus || 'N/A'}</div>
                </div>
              </div>
            `
                : ''
            }

            <!-- Similar Cases Snapshot -->
            ${
              actualResult.similar_cases && actualResult.similar_cases.length
                ? `
              <h2>Similar Cases Snapshot</h2>
              <ul class="similar-cases">
                ${actualResult.similar_cases
                  .slice(0, 4)
                  .map(
                    (caseItem, idx) => `
                      <li><strong>${
                        actualResult.audit?.similar_cases_summaries?.[idx] || `Case ${idx + 1}`
                      }</strong> — ${
                        caseItem.business_solution ||
                        caseItem.business_problem ||
                        caseItem.summary ||
                        'Summary not available'
                      }</li>
                    `,
                  )
                  .join('')}
              </ul>
            `
                : ''
            }

            <!-- Detailed Scores -->
            <h2>Detailed Factor Scores</h2>
            <div class="scores-grid">
              ${Object.entries(actualResult.sub_scores || {})
                .slice(0, 9)
                .map(
                  ([key, value]) => `
                <div class="score-box">
                  <div class="score-box-label">${key.replace(/_/g, ' ')}</div>
                  <div class="score-box-value">${value}</div>
                </div>
              `,
                )
                .join('')}
            </div>

            <!-- Benchmarking -->
            ${
              actualResult.gap_analysis?.overall_benchmarks
                ? `
              <h2>Benchmarking vs. Similar Projects</h2>
              <div class="benchmark-grid">
                <div class="benchmark-item">
                  <div class="benchmark-label">Your Score</div>
                  <div class="benchmark-value">${overallScore}</div>
                </div>
                <div class="benchmark-item">
                  <div class="benchmark-label">Similar Projects Avg</div>
                  <div class="benchmark-value">${Math.round(actualResult.gap_analysis.overall_benchmarks.average)}</div>
                </div>
                <div class="benchmark-item">
                  <div class="benchmark-label">Median Score</div>
                  <div class="benchmark-value">${actualResult.gap_analysis.overall_benchmarks.median}</div>
                </div>
                <div class="benchmark-item">
                  <div class="benchmark-label">Top 10% Threshold</div>
                  <div class="benchmark-value">${actualResult.gap_analysis.overall_benchmarks.top_10_percentile}</div>
                </div>
              </div>
            `
                : ''
            }

            <!-- Strengths -->
            ${
              actualResult.audit?.strengths && actualResult.audit.strengths.length > 0
                ? `
              <h2>Identified Strengths</h2>
              <div class="strengths">
                <ul>
                  ${actualResult.audit.strengths.map((s) => `<li>✓ ${s}</li>`).join('')}
                </ul>
              </div>
            `
                : ''
            }

            <!-- Improvement Areas -->
            ${
              actualResult.audit?.challenges && actualResult.audit.challenges.length > 0
                ? `
              <h2>Areas for Improvement</h2>
              <div class="gaps">
                <ul>
                  ${actualResult.audit.challenges.map((c) => `<li>⚠ ${c}</li>`).join('')}
                </ul>
              </div>
            `
                : ''
            }

            <!-- Recommendations -->
            <div class="recommendations-box">
              <h3>📋 Next Steps & Recommendations</h3>
              <ol>
                <li><strong>Review Strengths:</strong> Understand your competitive advantages and leverage them in messaging.</li>
                <li><strong>Prioritize Gaps:</strong> Focus on high-impact improvements that align with business goals.</li>
                <li><strong>Benchmark Analysis:</strong> Study the factor-by-factor breakdown to identify where you're trailing peers.</li>
                <li><strong>Implementation Plan:</strong> Create a roadmap to address key improvement areas over the next 6-12 months.</li>
                <li><strong>Stakeholder Engagement:</strong> Use this report to communicate your circular economy strategy to investors and partners.</li>
                <li><strong>Re-evaluate Progress:</strong> Reassess your initiative after implementing improvements to track advancement.</li>
              </ol>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p>This report was generated by the Circular Economy Business Auditor.</p>
              <p>For questions or detailed analysis, please contact the assessment team.</p>
              <p style="margin-top: 10px; font-size: 10px;">Report ID: ${new Date().getTime()}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // PDF generation options
    const options = {
      margin: [10, 10, 10, 10],
      filename: `circular-economy-audit-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
    };

    // Generate and download PDF
    html2pdf().set(options).from(htmlContent).save();
    return { success: true, message: 'PDF report generated successfully' };
  } catch (error) {
    return { success: false, message: 'Failed to generate PDF report' };
  }
}
