/**
 * Export utilities for CSV and PDF reports
 */

// CSV Export for similar cases
export function exportSimilarCasesToCSV(casesSummaries, similarCases) {
  if (!similarCases || similarCases.length === 0) {
    return { success: false, message: 'No similar cases to export' };
  }

  // Prepare CSV headers
  const headers = [
    'Case Number',
    'Title',
    'Industry',
    'Scale',
    'Circular Strategy',
    'Material Focus',
    'Overall Score',
    'Strengths',
    'Challenges',
    'Business Problem',
    'Business Solution',
  ];

  // Prepare CSV rows
  const rows = similarCases.map((caseItem, index) => [
    `#${index + 1}`,
    casesSummaries[index] || `Case ${index + 1}`,
    caseItem.metadata?.industry || 'N/A',
    caseItem.metadata?.scale || 'N/A',
    caseItem.metadata?.r_strategy || 'N/A',
    caseItem.metadata?.primary_material || 'N/A',
    caseItem.overall_score || 'N/A',
    (caseItem.audit?.strengths || []).join('; ') || 'N/A',
    (caseItem.audit?.challenges || []).join('; ') || 'N/A',
    (caseItem.business_problem || '').substring(0, 100) + '...' || 'N/A',
    (caseItem.business_solution || '').substring(0, 100) + '...' || 'N/A',
  ]);

  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          // Escape quotes and wrap in quotes if contains comma or quote
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
  a.download = `similar-cases-export-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { success: true, message: `Exported ${similarCases.length} similar cases` };
}

// PDF Export for full audit report
export async function exportAuditReportToPDF(
  result,
  radarData,
  businessViabilityScore,
  getRatingBadge,
) {
  try {
    // Dynamically import html2pdf
    const { default: html2pdf } = await import('html2pdf.js');

    const actualResult = result?.result_json || result;
    const overallScore =
      actualResult?.overall_score != null ? Number(actualResult.overall_score) : 0;

    // Create HTML content for PDF
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 900px;">
        <!-- Header -->
        <div style="border-bottom: 3px solid #34a83a; margin-bottom: 30px; padding-bottom: 20px;">
          <h1 style="color: #2c3e50; margin: 0 0 10px 0;">Circular Economy Audit Report</h1>
          <p style="color: #666; margin: 0; font-size: 14px;">
            Generated on ${new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <!-- Overall Score Section -->
        <div style="background: #f0f4f8; padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
          <h2 style="color: #2c3e50; margin: 0 0 15px 0;">Overall Circularity Score</h2>
          <div style="display: flex; justify-content: center; align-items: center; gap: 30px;">
            <div style="text-align: center;">
              <div style="font-size: 60px; font-weight: bold; color: #34a83a;">${overallScore}</div>
              <div style="font-size: 14px; color: #666;">out of 100</div>
            </div>
            <div style="text-align: left;">
              <p style="margin: 5px 0; font-size: 16px; font-weight: bold; color: #34a83a;">Rating: ${getRatingBadge(overallScore)}</p>
              <p style="margin: 5px 0; font-size: 14px; color: #666;">This assessment identifies your circular economy initiative's readiness and potential.</p>
            </div>
          </div>
        </div>

        <!-- Project Classification -->
        ${
          actualResult.metadata
            ? `
          <div style="margin-bottom: 30px;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #4a90e2; padding-bottom: 10px; margin-bottom: 20px;">Project Classification</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div style="background: #e8f5e9; padding: 15px; border-radius: 8px;">
                <div style="font-weight: bold; color: #1b5e20; font-size: 14px;">Industry</div>
                <div style="font-size: 16px; color: #2c3e50; margin-top: 5px; font-weight: bold;">${
                  actualResult.metadata.industry || 'N/A'
                }</div>
              </div>
              <div style="background: #e8f5e9; padding: 15px; border-radius: 8px;">
                <div style="font-weight: bold; color: #1b5e20; font-size: 14px;">Scale</div>
                <div style="font-size: 16px; color: #2c3e50; margin-top: 5px; font-weight: bold;">${
                  actualResult.metadata.scale || 'N/A'
                }</div>
              </div>
              <div style="background: #e8f5e9; padding: 15px; border-radius: 8px;">
                <div style="font-weight: bold; color: #1b5e20; font-size: 14px;">Circular Strategy</div>
                <div style="font-size: 16px; color: #2c3e50; margin-top: 5px; font-weight: bold;">${
                  actualResult.metadata.r_strategy || 'N/A'
                }</div>
              </div>
              <div style="background: #e8f5e9; padding: 15px; border-radius: 8px;">
                <div style="font-weight: bold; color: #1b5e20; font-size: 14px;">Material Focus</div>
                <div style="font-size: 16px; color: #2c3e50; margin-top: 5px; font-weight: bold;">${
                  actualResult.metadata.primary_material || 'N/A'
                }</div>
              </div>
            </div>
          </div>
        `
            : ''
        }

        <!-- Audit Verdict -->
        ${
          actualResult.audit?.audit_verdict
            ? `
          <div style="background: #fff3cd; border-left: 4px solid #ff9800; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
            <h3 style="color: #856404; margin: 0 0 10px 0;">Auditor's Verdict</h3>
            <p style="color: #856404; margin: 0; line-height: 1.6;">${actualResult.audit.audit_verdict}</p>
          </div>
        `
            : ''
        }

        <!-- Strengths -->
        ${
          actualResult.audit?.strengths && actualResult.audit.strengths.length > 0
            ? `
          <div style="margin-bottom: 30px;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #34a83a; padding-bottom: 10px; margin-bottom: 15px;">✓ Strengths Identified</h2>
            <ul style="margin: 0; padding-left: 20px;">
              ${actualResult.audit.strengths
                .map(
                  (strength) =>
                    `<li style="margin-bottom: 10px; color: #2c3e50; line-height: 1.6;">${strength}</li>`,
                )
                .join('')}
            </ul>
          </div>
        `
            : ''
        }

        <!-- Gaps & Recommendations -->
        ${
          actualResult.audit?.challenges && actualResult.audit.challenges.length > 0
            ? `
          <div style="margin-bottom: 30px;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #ff9800; padding-bottom: 10px; margin-bottom: 15px;">⚠ Areas for Improvement</h2>
            <ul style="margin: 0; padding-left: 20px;">
              ${actualResult.audit.challenges
                .map(
                  (challenge) =>
                    `<li style="margin-bottom: 10px; color: #2c3e50; line-height: 1.6;">${challenge}</li>`,
                )
                .join('')}
            </ul>
          </div>
        `
            : ''
        }

        <!-- Category Breakdown -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #4a90e2; padding-bottom: 10px; margin-bottom: 15px;">Category Breakdown</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            ${Object.entries(actualResult.audit?.categories || {})
              .map(
                ([category, score]) => `
              <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
                <div style="font-weight: bold; color: #2c3e50; font-size: 14px;">${category.replace(/_/g, ' ')}</div>
                <div style="font-size: 24px; color: #4a90e2; margin-top: 8px; font-weight: bold;">${score}/100</div>
              </div>
            `,
              )
              .join('')}
          </div>
        </div>

        <!-- Recommendations Section -->
        <div style="background: #e3f2fd; border-left: 4px solid #4a90e2; padding: 20px; border-radius: 4px;">
          <h3 style="color: #1976d2; margin: 0 0 15px 0;">Next Steps & Recommendations</h3>
          <ol style="color: #2c3e50; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>Review the strengths identified above to understand your initiative's competitive advantages.</li>
            <li>Prioritize the improvement areas based on feasibility and business impact.</li>
            <li>Benchmark your scores against similar projects in your industry.</li>
            <li>Consider re-evaluating after implementing key improvements to track progress.</li>
            <li>Use this report to inform stakeholder presentations and funding applications.</li>
          </ol>
        </div>

        <!-- Footer -->
        <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #ddd; font-size: 12px; color: #999; text-align: center;">
          <p style="margin: 0;">This audit report is based on an automated assessment of your circular economy initiative.</p>
          <p style="margin: 5px 0 0 0;">For detailed analysis and personalized recommendations, please contact our team.</p>
        </div>
      </div>
    `;

    // PDF options
    const options = {
      margin: 10,
      filename: `audit-report-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
    };

    // Generate PDF
    html2pdf().set(options).from(htmlContent).save();

    return { success: true, message: 'PDF report downloaded' };
  } catch (error) {
    return { success: false, message: 'Failed to generate PDF. Please try again.' };
  }
}
