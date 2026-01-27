/**
 * Enhanced export utilities with professional PDF download and improved CSV formatting
 */

/**
 * Export assessment as professional PDF (downloads instead of print dialog)
 */
export async function exportAssessmentPDF(result, getRatingBadge) {
  try {
    const actualResult = result?.result_json || result;
    const overallScore = actualResult?.overall_score || 0;
    const rating = getRatingBadge ? getRatingBadge(overallScore) : 'Excellent';
    const timestamp = new Date().toLocaleString();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta charset="UTF-8" />
      <link rel="icon" type="image/svg+xml" href="/logo.png" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link
        href="https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Figtree:ital,wght@0,300..900;1,300..900&family=Fira+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=IBM+Plex+Sans:ital,wght@0,100..700;1,100..700&family=Inconsolata:wght@200..900&family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Outfit:wght@100..900&family=Rubik:ital,wght@0,300..900;1,300..900&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap"
        rel="stylesheet"
      />
        <title>Circular Economy Assessment Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Nunito', 'ui-sans-serif', 'system-ui';
            line-height: 1.6;
            color: #1f2933;
            background: #fff;
            padding: 20px;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
            background: #fff;
            padding: 40px;
            border-radius: 8px;
          }
          .header {
            border-bottom: 3px solid #34a83a;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            font-size: 2.2rem;
            color: #2c3e50;
            margin-bottom: 10px;
          }
          .header p {
            color: #666;
            font-size: 0.95rem;
          }
          .score-section {
            background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f5 100%);
            border-left: 5px solid #34a83a;
            padding: 20px;
            margin: 30px 0;
            border-radius: 6px;
          }
          .score-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-top: 15px;
          }
          .score-box {
            background: #fff;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            border: 1px solid #ddd;
          }
          .score-value {
            font-size: 2rem;
            font-weight: 700;
            color: #34a83a;
            margin: 10px 0;
          }
          .score-label {
            font-size: 0.85rem;
            color: #666;
            font-weight: 600;
          }
          h2 {
            font-size: 1.4rem;
            color: #2c3e50;
            margin: 25px 0 15px 0;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 10px;
          }
          .section {
            margin: 20px 0;
          }
          ul { margin-left: 20px; }
          li { margin: 8px 0; line-height: 1.6; color: #555; }
          .strengths {
            background: #f0f7f0;
            border-left: 4px solid #34a83a;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
          }
          .challenges {
            background: #fff5f0;
            border-left: 4px solid #ff9800;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
          }
          .metadata-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 15px 0;
          }
          .metadata-item {
            background: #f5f5f5;
            padding: 12px;
            border-radius: 6px;
          }
          .metadata-label {
            font-size: 0.85rem;
            color: #999;
            font-weight: 600;
            margin-bottom: 5px;
          }
          .metadata-value {
            font-size: 1rem;
            color: #2c3e50;
            font-weight: 500;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #999;
            font-size: 0.85rem;
            text-align: center;
          }
          .component-scores {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
          }
          .score-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #eee;
          }
          .score-item-label { font-weight: 500; color: #2c3e50; }
          .score-item-value {
            font-size: 1.1rem;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌱 Circular Economy Assessment</h1>
            <p>Professional Evaluation Report</p>
            <p style="font-size: 0.9rem; color: #999; margin-top: 10px;">Generated: ${timestamp}</p>
          </div>

          <div class="score-section">
            <div style="font-weight: 600; color: #2c3e50; margin-bottom: 15px;">Overall Assessment Results</div>
            <div class="score-grid">
              <div class="score-box">
                <div class="score-label">Overall Score</div>
                <div class="score-value">${overallScore}</div>
                <div class="score-label" style="color: #34a83a; font-weight: 700;">${rating}</div>
              </div>
              <div class="score-box">
                <div class="score-label">Industry</div>
                <div class="score-value" style="color: #4a90e2; font-size: 1.2rem;">${(actualResult?.metadata?.industry || 'N/A').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</div>
              </div>
              <div class="score-box">
                <div class="score-label">Scale</div>
                <div class="score-value" style="color: #9c27b0; font-size: 1.2rem;">${(actualResult?.metadata?.scale || 'N/A').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</div>
              </div>
              <div class="score-box">
                <div class="score-label">Status</div>
                <div class="score-value" style="color: #ff9800; font-size: 1.2rem;">✓ Complete</div>
              </div>
            </div>
          </div>

          <h2>Assessment Details</h2>
          <div class="metadata-grid">
            <div class="metadata-item">
              <div class="metadata-label">Primary Material</div>
              <div class="metadata-value">${(actualResult?.metadata?.primary_material || 'Not specified').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</div>
            </div>
            <div class="metadata-item">
              <div class="metadata-label">Circular Strategy</div>
              <div class="metadata-value">${(actualResult?.metadata?.r_strategy || 'Not specified').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</div>
            </div>
          </div>

          ${
            actualResult?.sub_scores && Object.keys(actualResult.sub_scores).length
              ? `
          <h2>Component Scores</h2>
          <div class="component-scores">
            ${Object.entries(actualResult.sub_scores)
              .map(
                ([key, value]) => `
              <div class="score-item">
                <span class="score-item-label">${key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                <span class="score-item-value" style="color: ${value >= 75 ? '#34a83a' : value >= 50 ? '#ff9800' : '#f44336'};">${value}/100</span>
              </div>
            `,
              )
              .join('')}
          </div>
          `
              : ''
          }

          ${
            actualResult?.audit?.audit_verdict
              ? `
          <h2>Auditor's Assessment</h2>
          <div style="background: #f0f4f8; padding: 20px; border-left: 4px solid #4a90e2; border-radius: 4px; color: #555; line-height: 1.8;">
            ${actualResult.audit.audit_verdict}
          </div>
          `
              : ''
          }

          ${
            actualResult?.audit?.strengths && actualResult.audit.strengths.length
              ? `
          <h2>Identified Strengths</h2>
          <div class="strengths">
            <ul style="margin: 0; padding-left: 20px;">
              ${actualResult.audit.strengths.map((strength) => `<li>${strength}</li>`).join('')}
            </ul>
          </div>
          `
              : ''
          }

          ${
            actualResult?.audit?.challenges && actualResult.audit.challenges.length
              ? `
          <h2>Areas for Improvement</h2>
          <div class="challenges">
            <ul style="margin: 0; padding-left: 20px;">
              ${actualResult.audit.challenges.map((challenge) => `<li>${challenge}</li>`).join('')}
            </ul>
          </div>
          `
              : ''
          }

          <div class="footer">
            <p>This report was generated by the Circular Economy Assessment Platform.</p>
            <p>For questions or more information, contact support.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create downloadable HTML (browsers can save as PDF)
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `assessment-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, message: 'Report downloaded successfully' };
  } catch (error) {
    console.error('PDF export failed:', error);
    return { success: false, message: 'Failed to export report' };
  }
}

/**
 * Export assessment as CSV with professional formatting
 */
export function exportAssessmentCSV(result) {
  try {
    const actualResult = result?.result_json || result;
    const csvLines = [];
    const timestamp = new Date().toLocaleString();

    // Header
    csvLines.push('CIRCULAR ECONOMY ASSESSMENT REPORT');
    csvLines.push(`Generated: ${timestamp}`);
    csvLines.push('');

    // Overall Scores
    csvLines.push('=== ASSESSMENT SUMMARY ===');
    csvLines.push(`Overall Score,${actualResult?.overall_score || 'N/A'}/100`);
    csvLines.push(`Assessment Date,${new Date(result?.created_at).toLocaleDateString()}`);
    csvLines.push('');

    // Project Details
    csvLines.push('=== PROJECT DETAILS ===');
    csvLines.push(
      `Industry,${(actualResult?.metadata?.industry || 'N/A').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}`,
    );
    csvLines.push(
      `Scale,${(actualResult?.metadata?.scale || 'N/A').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}`,
    );
    csvLines.push(
      `Circular Strategy,${(actualResult?.metadata?.r_strategy || 'N/A').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}`,
    );
    csvLines.push(
      `Primary Material,${(actualResult?.metadata?.primary_material || 'N/A').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}`,
    );
    csvLines.push('');

    // Component Scores
    if (actualResult?.sub_scores && Object.keys(actualResult.sub_scores).length) {
      csvLines.push('=== COMPONENT SCORES ===');
      csvLines.push('Component,Score');
      Object.entries(actualResult.sub_scores).forEach(([key, value]) => {
        csvLines.push(
          `"${key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}",${value}/100`,
        );
      });
      csvLines.push('');
    }

    // Audit Details
    if (actualResult?.audit) {
      if (actualResult.audit.audit_verdict) {
        csvLines.push('=== AUDITOR VERDICT ===');
        csvLines.push(`"${actualResult.audit.audit_verdict}"`);
        csvLines.push('');
      }

      if (actualResult.audit.strengths && actualResult.audit.strengths.length) {
        csvLines.push('=== IDENTIFIED STRENGTHS ===');
        actualResult.audit.strengths.forEach((strength, idx) => {
          csvLines.push(`"${idx + 1}. ${strength}"`);
        });
        csvLines.push('');
      }

      if (actualResult.audit.challenges && actualResult.audit.challenges.length) {
        csvLines.push('=== AREAS FOR IMPROVEMENT ===');
        actualResult.audit.challenges.forEach((challenge, idx) => {
          csvLines.push(`"${idx + 1}. ${challenge}"`);
        });
        csvLines.push('');
      }

      if (
        actualResult.audit.technical_recommendations &&
        actualResult.audit.technical_recommendations.length
      ) {
        csvLines.push('=== RECOMMENDATIONS ===');
        actualResult.audit.technical_recommendations.forEach((rec, idx) => {
          csvLines.push(`"${idx + 1}. ${rec}"`);
        });
        csvLines.push('');
      }
    }

    // Footer
    csvLines.push('---');
    csvLines.push('This report was generated by the Circular Economy Assessment Platform');

    // Create and download
    const csvContent = csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `assessment-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, message: 'CSV exported successfully' };
  } catch (error) {
    console.error('CSV export failed:', error);
    return { success: false, message: 'Failed to export CSV' };
  }
}

/**
 * Export comparison of two assessments as CSV
 */
export function exportComparisonCSV(assessment1, assessment2) {
  try {
    const csvLines = [];
    const timestamp = new Date().toLocaleString();

    csvLines.push('ASSESSMENT COMPARISON REPORT');
    csvLines.push(`Generated: ${timestamp}`);
    csvLines.push('');

    csvLines.push('=== OVERALL SCORES ===');
    csvLines.push(`Assessment,Score,Industry,Scale,Status`);
    csvLines.push(
      `"${assessment1.title || 'Assessment 1'}",${assessment1.result_json?.overall_score},"${(assessment1.result_json?.metadata?.industry || 'N/A').replace(/_/g, ' ')}","${(assessment1.result_json?.metadata?.scale || 'N/A').replace(/_/g, ' ')}",${new Date(assessment1.created_at).toLocaleDateString()}`,
    );
    csvLines.push(
      `"${assessment2.title || 'Assessment 2'}",${assessment2.result_json?.overall_score},"${(assessment2.result_json?.metadata?.industry || 'N/A').replace(/_/g, ' ')}","${(assessment2.result_json?.metadata?.scale || 'N/A').replace(/_/g, ' ')}",${new Date(assessment2.created_at).toLocaleDateString()}`,
    );
    const scoreDiff =
      (assessment2.result_json?.overall_score || 0) - (assessment1.result_json?.overall_score || 0);
    csvLines.push(
      `Change,${scoreDiff > 0 ? '+' : ''}${scoreDiff},,,"${scoreDiff > 0 ? 'Improvement' : scoreDiff < 0 ? 'Decline' : 'No change'}"`,
    );
    csvLines.push('');

    csvLines.push('=== COMPONENT SCORES COMPARISON ===');
    csvLines.push(`Component,"Assessment 1","Assessment 2",Change`);
    Object.entries(assessment1.result_json?.sub_scores || {}).forEach(([key, val1]) => {
      const val2 = assessment2.result_json?.sub_scores?.[key] || 0;
      const diff = val2 - val1;
      csvLines.push(
        `"${key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}",${val1},${val2},${diff > 0 ? '+' : ''}${diff}`,
      );
    });

    const csvContent = csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `comparison-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, message: 'Comparison exported successfully' };
  } catch (error) {
    console.error('Comparison export failed:', error);
    return { success: false, message: 'Failed to export comparison' };
  }
}

// Simple text-based PDF (no html2pdf image rendering issues)
export async function exportAuditReportToPDF(
  result,
  radarData,
  businessViabilityScore,
  getRatingBadge,
) {
  try {
    const actualResult = result?.result_json || result;
    const overallScore = actualResult?.overall_score || 0;
    const rating = getRatingBadge(overallScore);
    const subScores = Object.entries(actualResult?.sub_scores || {});
    const sortedScores = [...subScores].sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0));
    const topThree = sortedScores.slice(0, 3);
    const bottomThree = sortedScores.slice(-3);
    const topFactor = topThree[0] || null;
    const lowFactor = bottomThree.length ? bottomThree[bottomThree.length - 1] : null;
    const strengths = actualResult?.audit?.strengths || [];
    const challenges = actualResult?.audit?.challenges || [];
    const recommendations = actualResult?.audit?.technical_recommendations || [];

    const formatLabel = (txt) =>
      (txt || 'Not specified')
        .toString()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());

    // Create a simpler, text-focused document
    const docContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/logo.png" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link
    href="https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Figtree:ital,wght@0,300..900;1,300..900&family=Fira+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=IBM+Plex+Sans:ital,wght@0,100..700;1,100..700&family=Inconsolata:wght@200..900&family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Outfit:wght@100..900&family=Rubik:ital,wght@0,300..900;1,300..900&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap"
    rel="stylesheet"
  />
  <title>Circular Economy Audit Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Nunito', 'ui-sans-serif', 'system-ui';
      line-height: 1.6;
      color: #1f2933;
      background: #f7f9fb;
      padding: 32px;
    }
    .report {
      background: #ffffff;
      max-width: 900px;
      margin: 0 auto;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.06);
      padding: 32px;
    }
    header {
      border-bottom: 3px solid #34a83a;
      padding-bottom: 18px;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 26px;
      color: #123026;
      margin-bottom: 6px;
      letter-spacing: 0.3px;
    }
    .subtitle { color: #52616b; font-size: 14px; }
    .date { color: #7b8794; font-size: 12px; margin-top: 6px; }
    .score-banner {
      background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f5 100%);
      border: 1px solid #c8e6c9;
      border-radius: 12px;
      padding: 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
    }
    .score-number { font-size: 46px; font-weight: 800; color: #1b5e20; }
    .score-chip {
      padding: 8px 14px;
      background: #123026;
      color: white;
      border-radius: 999px;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.5px;
    }
    .grid { display: grid; gap: 12px; }
    .grid-2 { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .grid-3 { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
    .card {
      background: #f9fbfd;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 14px;
    }
    .card strong { color: #102a43; }
    h2 {
      font-size: 18px;
      color: #123026;
      margin: 26px 0 12px;
      letter-spacing: 0.2px;
    }
    h3 { font-size: 14px; color: #52616b; margin-bottom: 8px; }
    ul { margin-left: 18px; margin-top: 6px; }
    li { margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #e5e7eb; }
    th { background: #f1f5f9; font-size: 12px; letter-spacing: 0.4px; color: #46505a; }
    .progress-track { height: 8px; background: #e5e7eb; border-radius: 999px; overflow: hidden; }
    .progress-fill { height: 8px; background: linear-gradient(90deg, #34a83a, #4caf50); }
    .badge { display: inline-block; padding: 6px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
    .badge-low { background: #fff3e0; color: #e65100; }
    .badge-high { background: #e8f5e9; color: #1b5e20; }
    .section {
      padding: 16px;
      border: 1px solid #edf2f7;
      border-radius: 12px;
      background: #ffffff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.03);
      margin-bottom: 16px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      color: #7b8794;
      font-size: 12px;
      text-align: center;
    }
  </style>
</head>
<body>
<div class="report">
  <header>
    <h1>Circular Economy Audit Report</h1>
    <div class="subtitle">AI-assisted assessment of circularity readiness</div>
    <div class="date">Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
  </header>

  <div class="score-banner">
    <div>
      <div class="score-label">Overall Circularity Score</div>
      <div class="score-number">${overallScore}</div>
      <div style="color:#52616b; font-size:12px;">Out of 100</div>
    </div>
    <div style="text-align:right;">
      <div class="score-chip">${rating}</div>
      <div style="margin-top:8px; color:#52616b; font-size:13px;">Confidence: ${actualResult.audit?.confidence_score || 0}%</div>
    </div>
  </div>

  <div class="grid grid-3">
    <div class="card">
      <strong>Top Factor</strong>
      <div>${topFactor ? formatLabel(topFactor[0]) : 'Not available'}</div>
      <div style="color:#1b5e20; font-weight:700;">${topFactor ? `${topFactor[1]}/100` : '—'}</div>
    </div>
    <div class="card">
      <strong>Focus Area</strong>
      <div>${lowFactor ? formatLabel(lowFactor[0]) : 'Not available'}</div>
      <div style="color:#c62828; font-weight:700;">${lowFactor ? `${lowFactor[1]}/100` : '—'}</div>
    </div>
    <div class="card">
      <strong>Business Viability</strong>
      <div>${businessViabilityScore != null ? `${businessViabilityScore}/100` : 'Not provided'}</div>
      <div class="badge ${businessViabilityScore >= 70 ? 'badge-high' : 'badge-low'}">${businessViabilityScore >= 70 ? 'Strong runway' : 'Needs refinement'}</div>
    </div>
  </div>

  ${
    actualResult?.metadata
      ? `
  <div class="section">
    <h2>Project Classification</h2>
    <div class="grid grid-2">
      <div class="card"><strong>Industry</strong><div>${formatLabel(actualResult.metadata.industry)}</div></div>
      <div class="card"><strong>Scale</strong><div>${formatLabel(actualResult.metadata.scale)}</div></div>
      <div class="card"><strong>Circular Strategy</strong><div>${formatLabel(actualResult.metadata.r_strategy)}</div></div>
      <div class="card"><strong>Primary Material</strong><div>${formatLabel(actualResult.metadata.primary_material)}</div></div>
    </div>
  </div>
  `
      : ''
  }

  ${
    actualResult?.audit?.audit_verdict
      ? `
  <div class="section">
    <h2>Auditor's Verdict</h2>
    <p style="color:#374151;">${actualResult.audit.audit_verdict}</p>
  </div>
  `
      : ''
  }

  <div class="section">
    <h2>Factor Performance</h2>
    <table>
      <thead><tr><th>Factor</th><th style="width:120px;">Score</th><th>Progress</th></tr></thead>
      <tbody>
        ${sortedScores
          .map(
            ([key, value]) => `
            <tr>
              <td>${formatLabel(key)}</td>
              <td><strong>${value}/100</strong></td>
              <td>
                <div class="progress-track">
                  <div class="progress-fill" style="width:${Math.min(100, Number(value) || 0)}%"></div>
                </div>
              </td>
            </tr>
          `,
          )
          .join('')}
      </tbody>
    </table>
  </div>

  ${
    strengths.length
      ? `
  <div class="section">
    <h2>Strengths</h2>
    <ul>${strengths.map((s) => `<li>${s}</li>`).join('')}</ul>
  </div>`
      : ''
  }

  ${
    challenges.length
      ? `
  <div class="section">
    <h2>Areas for Improvement</h2>
    <ul>${challenges.map((c) => `<li>${c}</li>`).join('')}</ul>
  </div>`
      : ''
  }

  ${
    actualResult?.gap_analysis?.overall_benchmarks
      ? `
  <div class="section">
    <h2>Benchmarking</h2>
    <div class="grid grid-2">
      <div class="card"><strong>Your Score</strong><div>${overallScore}/100</div></div>
      <div class="card"><strong>Similar Projects Avg</strong><div>${Math.round(actualResult.gap_analysis.overall_benchmarks.average)}/100</div></div>
      <div class="card"><strong>Median</strong><div>${actualResult.gap_analysis.overall_benchmarks.median}/100</div></div>
      <div class="card"><strong>Top 10%</strong><div>${actualResult.gap_analysis.overall_benchmarks.top_10_percentile}/100</div></div>
    </div>
  </div>
  `
      : ''
  }

  <div class="section">
    <h2>Next Steps & Recommendations</h2>
    <ul>
      ${
        recommendations.length
          ? recommendations.map((rec) => `<li>${rec}</li>`).join('')
          : `
          <li>Leverage strengths in the next investor or partner pitch.</li>
          <li>Prioritize the lowest-scoring factors within the next quarter.</li>
          <li>Benchmark progress with a follow-up assessment in 6 months.</li>
          <li>Translate improvements into measurable KPIs for your team.</li>
        `
      }
    </ul>
  </div>

  <div class="footer">
    Circular Economy Business Auditor · Report ID: ${new Date().getTime()}<br />
    Use your browser's print dialog to save this report as PDF.
  </div>
</div>

</body>
</html>
    `;

    // Use a library-free approach - just open print dialog with the content
    const printWindow = window.open('', '_blank');
    printWindow.document.write(docContent);
    printWindow.document.close();

    // Wait for content to render then print to PDF
    setTimeout(() => {
      printWindow.print();
    }, 250);

    return {
      success: true,
      message: 'PDF report opened - use browser print (Ctrl+P) to save as PDF',
    };
  } catch (error) {
    console.error('PDF report generation failed: ', error);
    return { success: false, message: 'Failed to generate PDF report' };
  }
}
