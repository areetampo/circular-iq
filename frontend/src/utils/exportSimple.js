/**
 * Simple, practical exports that deliver real value
 */

// CSV Export - Comprehensive assessment summary (not relying on incomplete backend data)
export function exportSimilarCasesToCSV(casesSummaries, similarCases, result) {
  const actualResult = result?.result_json || result;
  const csvLines = [];

  // Header
  csvLines.push('CIRCULAR ECONOMY ASSESSMENT EXPORT');
  csvLines.push(`Generated: ${new Date().toLocaleString()}`);
  csvLines.push('');

  // Assessment Details
  csvLines.push('=== ASSESSMENT OVERVIEW ===');
  csvLines.push(`Overall Score,${actualResult?.overall_score || 'N/A'}/100`);
  csvLines.push(`Industry,${actualResult?.metadata?.industry || 'Not specified'}`);
  csvLines.push(`Scale,${actualResult?.metadata?.scale || 'Not specified'}`);
  csvLines.push(`Circular Strategy,${actualResult?.metadata?.r_strategy || 'Not specified'}`);
  csvLines.push(`Primary Material,${actualResult?.metadata?.primary_material || 'Not specified'}`);
  csvLines.push('');

  // Factor Scores
  if (actualResult?.sub_scores && Object.keys(actualResult.sub_scores).length) {
    csvLines.push('=== FACTOR SCORES ===');
    Object.entries(actualResult.sub_scores).forEach(([key, value]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      csvLines.push(`${label},${value}/100`);
    });
    csvLines.push('');
  }

  // Audit Verdict
  if (actualResult?.audit?.audit_verdict) {
    csvLines.push("=== AUDITOR'S VERDICT ===");
    csvLines.push(`"${actualResult.audit.audit_verdict}"`);
    csvLines.push('');
  }

  // Strengths
  if (actualResult?.audit?.strengths && actualResult.audit.strengths.length) {
    csvLines.push('=== IDENTIFIED STRENGTHS ===');
    actualResult.audit.strengths.forEach((strength, idx) => {
      csvLines.push(`"${idx + 1}. ${strength}"`);
    });
    csvLines.push('');
  }

  // Challenges
  if (actualResult?.audit?.challenges && actualResult.audit.challenges.length) {
    csvLines.push('=== AREAS FOR IMPROVEMENT ===');
    actualResult.audit.challenges.forEach((challenge, idx) => {
      csvLines.push(`"${idx + 1}. ${challenge}"`);
    });
    csvLines.push('');
  }

  // Benchmarking
  if (actualResult?.gap_analysis?.overall_benchmarks) {
    csvLines.push('=== BENCHMARKING ===');
    const b = actualResult.gap_analysis.overall_benchmarks;
    csvLines.push(`Your Score,${actualResult.overall_score}/100`);
    csvLines.push(`Similar Projects Average,${Math.round(b.average)}/100`);
    csvLines.push(`Median Score,${b.median}/100`);
    csvLines.push(`Top 10% Threshold,${b.top_10_percentile}/100`);
    csvLines.push('');
  }

  // Reference Cases
  if (similarCases && similarCases.length) {
    csvLines.push('=== SIMILAR CASES FROM DATABASE ===');
    csvLines.push('Case #,Case Name,Industry,Scale,Strategy');
    similarCases.forEach((caseItem, idx) => {
      const name = casesSummaries[idx] || `Reference Case ${idx + 1}`;
      const industry = caseItem.metadata?.industry || 'General';
      const scale = caseItem.metadata?.scale || 'Standard';
      const strategy = caseItem.metadata?.r_strategy || 'Mixed';
      csvLines.push(`"${idx + 1}","${name}","${industry}","${scale}","${strategy}"`);
    });
  }

  // Build and download
  const csvContent = csvLines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `assessment-summary-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, message: 'Assessment exported as CSV' };
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
  <meta charset="UTF-8">
  <title>Circular Economy Audit Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Segoe UI", Roboto, -apple-system, sans-serif;
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
    return { success: false, message: 'Failed to generate PDF report' };
  }
}
