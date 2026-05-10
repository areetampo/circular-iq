/**
 * CSV Export Functions - Complete Implementation
 * Handles exporting assessment and comparison data to CSV format
 *
 * Location: src/features/export/exportCSV.js
 */

/**
 * Escapes special characters in CSV values for Excel compatibility
 * Handles commas, quotes, newlines, tabs, and special characters
 * @param {string|number|null|undefined} value - The value to escape
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
 * Triggers a CSV file download in the browser with UTF-8 BOM for Excel
 * @param {string} csvContent - CSV content string
 * @param {string} filename - Desired filename for download
 * @returns {Blob} Downloadable CSV Blob
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

  return blob;
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
 * Converts string to title case
 * @param {string} str - String to convert
 * @returns {string} Title case string
 */
function toTitleCase(str) {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Exports assessments to CSV as a comparison matrix
 * @param {Object|Array<Object>} assessments - Single assessment object or array of assessments
 * @returns {{ success: boolean, message: string, blob: Blob }}
 */
export function exportAssessmentCSV(assessments) {
  const assessmentArray = Array.isArray(assessments) ? assessments : [assessments];
  const filteredAssessments = assessmentArray.filter(Boolean);

  if (filteredAssessments.length === 0) {
    throw new Error('Assessment data is required');
  }

  const assessmentData = filteredAssessments.map((assessment) => {
    const result = assessment.result_json || assessment;
    const metadata = result.metadata || {};
    const name = assessment.title;
    const createdAt = assessment.created_at || metadata.date || result.created_at || null;

    return {
      name,
      date: createdAt ? formatDate(createdAt) : 'N/A',
      metadata,
      industry: assessment.industry ?? result.metadata?.industry ?? 'N/A',
      businessProblem:
        assessment.businessProblem ||
        assessment.business_problem ||
        result.businessProblem ||
        result.business_problem ||
        '',
      businessSolution:
        assessment.businessSolution ||
        assessment.business_solution ||
        result.businessSolution ||
        result.business_solution ||
        '',
      businessContext: assessment.business_context || result.business_context || {},
      subScores: result.sub_scores || {},
      overallScore: result.overall_score ?? 'N/A',
      confidenceLevel: result.confidence_level ?? 'N/A',
      derivedMetrics: result.derived_metrics || {},
      scoreBreakdown: result.score_breakdown || {},
      audit: result.audit || {},
      gapAnalysis: result.gap_analysis || {},
      weightedScoreCard: result.weighted_score_card || null,
      circularEconomyTier: result.circular_economy_tier || null,
      parameterConsistency: result.parameter_consistency || null,
      rStrategyAlignment: result.r_strategy_alignment || null,
      similarCases: result.similar_cases || [],
    };
  });

  const name = filteredAssessments.map((assessment) => assessment.title).join(', ');
  const safeName = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${safeName || 'assessment'}-${dateStr}.csv`;

  const csvLines = [];

  // === REPORT HEADER SECTION ===
  csvLines.push('CIRCULAR ECONOMY ASSESSMENT REPORT');
  csvLines.push(`Generated,${formatDate(new Date())}`);
  csvLines.push('');

  // === ASSESSMENT OVERVIEW SECTION ===
  csvLines.push('ASSESSMENT OVERVIEW');
  csvLines.push('');
  csvLines.push(['Title', ...assessmentData.map((a) => escapeCSV(a.name))].join(','));
  csvLines.push(['Date', ...assessmentData.map((a) => escapeCSV(a.date))].join(','));
  csvLines.push(
    ['Overall Score', ...assessmentData.map((a) => escapeCSV(a.overallScore))].join(','),
  );
  csvLines.push(
    ['Confidence Level', ...assessmentData.map((a) => escapeCSV(a.confidenceLevel))].join(','),
  );
  csvLines.push('');

  // === ASSESSMENT METADATA SECTION ===
  csvLines.push('ASSESSMENT METADATA');
  csvLines.push('');
  const metadataFields = [
    'industry',
    'scale',
    'r_strategy',
    'primary_material',
    'geographic_focus',
    'short_description',
  ];
  const metadataLabels = [
    'Industry',
    'Scale',
    'R-Strategy',
    'Primary Material',
    'Geographic Focus',
    'Short Description',
  ];

  metadataLabels.forEach((label, index) => {
    const field = metadataFields[index];
    csvLines.push(
      [
        label,
        ...assessmentData.map((a) => {
          const value = a.metadata[field] || a[field] || 'N/A';
          return escapeCSV(value);
        }),
      ].join(','),
    );
  });
  csvLines.push('');

  // === BUSINESS CONTEXT SECTION ===
  csvLines.push('BUSINESS CONTEXT');
  csvLines.push('');
  const contextFields = [
    'target_geography',
    'operational_stage',
    'business_model_type',
    'material_complexity',
    'annual_volume_estimate',
    'has_existing_partnerships',
  ];
  const contextLabels = [
    'Target Geography',
    'Operational Stage',
    'Business Model Type',
    'Material Complexity',
    'Annual Volume Estimate',
    'Has Existing Partnerships',
  ];

  contextLabels.forEach((label, index) => {
    const field = contextFields[index];
    csvLines.push(
      [
        label,
        ...assessmentData.map((a) => {
          const value = a.businessContext[field];
          return field === 'has_existing_partnerships'
            ? value
              ? 'Yes'
              : 'No'
            : escapeCSV(value || 'N/A');
        }),
      ].join(','),
    );
  });
  csvLines.push('');

  // === BUSINESS PROBLEM & SOLUTION SECTION ===
  csvLines.push('BUSINESS PROBLEM & SOLUTION');
  csvLines.push('');
  csvLines.push(
    ['Business Problem', ...assessmentData.map((a) => escapeCSV(a.businessProblem))].join(','),
  );
  csvLines.push(
    ['Business Solution', ...assessmentData.map((a) => escapeCSV(a.businessSolution))].join(','),
  );
  csvLines.push('');

  // === FACTOR SCORES SECTION ===
  csvLines.push('FACTOR SCORES');
  csvLines.push('');
  csvLines.push(
    ['Factor', 'Score', 'Weight', 'Contribution', 'Classification', 'Rank', 'Assessment'].join(','),
  );

  assessmentData.forEach((a) => {
    if (!a.weightedScoreCard?.factors) return;

    const sortedEntries = Object.entries(a.weightedScoreCard.factors).sort(
      ([, fa], [, fb]) => (fa.rank || 999) - (fb.rank || 999),
    );

    sortedEntries.forEach(([factor, factorData]) => {
      csvLines.push(
        [
          escapeCSV(toTitleCase(factor)),
          String(factorData.raw_score || 0),
          escapeCSV(factorData.weight_percent || '0%'),
          String(factorData.contribution || 0),
          escapeCSV(factorData.classification || 'N/A'),
          String(factorData.rank || 'N/A'),
          escapeCSV(a.name),
        ].join(','),
      );
    });
  });
  csvLines.push('');

  // === SCORE BREAKDOWN SECTION ===
  csvLines.push('SCORE BREAKDOWN');
  csvLines.push('');
  csvLines.push(['Category', 'Score', 'Weight', 'Description', 'Assessment'].join(','));

  assessmentData.forEach((a) => {
    Object.entries(a.scoreBreakdown).forEach(([category, data]) => {
      csvLines.push(
        [
          escapeCSV(toTitleCase(category)),
          String(data.score || 0),
          escapeCSV(data.weight || '0%'),
          escapeCSV(data.description || ''),
          escapeCSV(a.name),
        ].join(','),
      );
    });
  });
  csvLines.push('');

  // === WEIGHTED SCORE CARD SUMMARY ===
  csvLines.push('WEIGHTED SCORE CARD SUMMARY');
  csvLines.push('');
  csvLines.push(['Assessment', 'Top Contributor', 'Bottom Contributor'].join(','));

  assessmentData.forEach((a) => {
    if (a.weightedScoreCard) {
      csvLines.push(
        [
          escapeCSV(a.name),
          escapeCSV(toTitleCase(a.weightedScoreCard.top_contributor || 'N/A')),
          escapeCSV(toTitleCase(a.weightedScoreCard.bottom_contributor || 'N/A')),
        ].join(','),
      );
    }
  });
  csvLines.push('');

  // === DERIVED METRICS SECTION ===
  csvLines.push('DERIVED METRICS');
  csvLines.push('');
  csvLines.push(['Metric', ...assessmentData.map((a) => escapeCSV(a.name))].join(','));

  const derivedKeys = [
    'technical_feasibility',
    'economic_viability',
    'circularity_potential',
    'risk_level',
  ];
  derivedKeys.forEach((key) => {
    const label = toTitleCase(key);
    const values = assessmentData.map((a) => escapeCSV(a.derivedMetrics[key] ?? 'N/A'));
    csvLines.push([escapeCSV(label), ...values].join(','));
  });
  csvLines.push('');

  // === R-STRATEGY ALIGNMENT SECTION ===
  if (assessmentData.some((a) => a.rStrategyAlignment?.alignment_score != null)) {
    csvLines.push('R-STRATEGY ALIGNMENT');
    csvLines.push('');
    csvLines.push(['Assessment', 'Strategy', 'Alignment Score', 'Rating', 'Message'].join(','));

    assessmentData.forEach((a) => {
      if (a.rStrategyAlignment) {
        csvLines.push(
          [
            escapeCSV(a.name),
            escapeCSV(a.rStrategyAlignment.strategy ?? 'N/A'),
            escapeCSV(a.rStrategyAlignment.alignment_score ?? 'N/A'),
            escapeCSV(a.rStrategyAlignment.rating ?? 'N/A'),
            escapeCSV(a.rStrategyAlignment.message ?? ''),
          ].join(','),
        );
      }
    });
    csvLines.push('');
  }

  // === PARAMETER CONSISTENCY SECTION ===
  if (assessmentData.some((a) => a.parameterConsistency)) {
    csvLines.push('PARAMETER CONSISTENCY');
    csvLines.push('');
    csvLines.push(['Assessment', 'Score', 'Rating', 'Issues Found', 'Interpretation'].join(','));

    assessmentData.forEach((a) => {
      if (a.parameterConsistency) {
        csvLines.push(
          [
            escapeCSV(a.name),
            escapeCSV(a.parameterConsistency.score ?? 'N/A'),
            escapeCSV(a.parameterConsistency.rating ?? 'N/A'),
            String(a.parameterConsistency.issues_found ?? 0),
            escapeCSV(a.parameterConsistency.interpretation ?? ''),
          ].join(','),
        );
      }
    });
    csvLines.push('');
  }

  // === CIRCULAR ECONOMY TIER SECTION ===
  if (assessmentData.some((a) => a.circularEconomyTier)) {
    csvLines.push('CIRCULAR ECONOMY TIER');
    csvLines.push('');
    csvLines.push(
      [
        'Assessment',
        'Tier',
        'Range',
        'Badge Color',
        'Description',
        'Next Milestone',
        'Percentile Estimate',
      ].join(','),
    );

    assessmentData.forEach((a) => {
      if (a.circularEconomyTier) {
        csvLines.push(
          [
            escapeCSV(a.name),
            escapeCSV(a.circularEconomyTier.tier ?? 'N/A'),
            escapeCSV(a.circularEconomyTier.range ?? 'N/A'),
            escapeCSV(a.circularEconomyTier.badge_color ?? 'N/A'),
            escapeCSV(a.circularEconomyTier.description ?? 'N/A'),
            escapeCSV(a.circularEconomyTier.next_milestone ?? 'N/A'),
            escapeCSV(a.circularEconomyTier.percentile_estimate ?? 'N/A'),
          ].join(','),
        );
      }
    });
    csvLines.push('');
  }

  // === GAP ANALYSIS SECTION ===
  if (assessmentData.some((a) => a.gapAnalysis && a.gapAnalysis.has_benchmarks)) {
    csvLines.push('GAP ANALYSIS');
    csvLines.push('');

    // Benchmarks subsection
    csvLines.push('BENCHMARKS');
    csvLines.push(
      ['Assessment', 'Factor', 'Your Score', 'P25', 'P50', 'P75', 'Count', 'Status'].join(','),
    );

    assessmentData.forEach((a) => {
      if (a.gapAnalysis.comparisons) {
        Object.entries(a.gapAnalysis.comparisons).forEach(([factor, comparison]) => {
          csvLines.push(
            [
              escapeCSV(a.name),
              escapeCSV(toTitleCase(factor)),
              String(comparison.userScore || 0),
              String(comparison.p25 || 0),
              String(comparison.p50 || 0),
              String(comparison.p75 || 0),
              String(comparison.count || 0),
              escapeCSV(comparison.status || 'N/A'),
            ].join(','),
          );
        });
      }
    });

    csvLines.push('');

    // Opportunities subsection
    csvLines.push('OPPORTUNITIES');
    csvLines.push(['Assessment', 'Opportunity Number', 'Opportunity'].join(','));
    assessmentData.forEach((a) => {
      if (a.gapAnalysis.opportunities && a.gapAnalysis.opportunities.length > 0) {
        a.gapAnalysis.opportunities.forEach((opportunity, index) => {
          csvLines.push(
            [escapeCSV(a.name), String(index + 1), escapeCSV(toTitleCase(opportunity))].join(','),
          );
        });
      }
    });

    csvLines.push('');

    // Gap Analysis Strengths subsection
    csvLines.push('GAP ANALYSIS STRENGTHS');
    csvLines.push(['Assessment', 'Strength Number', 'Strength'].join(','));
    assessmentData.forEach((a) => {
      if (a.gapAnalysis.strengths && a.gapAnalysis.strengths.length > 0) {
        a.gapAnalysis.strengths.forEach((strength, index) => {
          csvLines.push(
            [escapeCSV(a.name), String(index + 1), escapeCSV(toTitleCase(strength))].join(','),
          );
        });
      }
    });

    // Gap Analysis message
    csvLines.push('');
    csvLines.push('GAP ANALYSIS MESSAGE');
    csvLines.push(['Assessment', 'Message'].join(','));
    assessmentData.forEach((a) => {
      if (a.gapAnalysis.message) {
        csvLines.push([escapeCSV(a.name), escapeCSV(a.gapAnalysis.message)].join(','));
      }
    });

    csvLines.push('');
  }

  // === IMPROVEMENT ROADMAP SECTION ===
  if (assessmentData.some((a) => a.audit?.improvement_roadmap?.length > 0)) {
    csvLines.push('IMPROVEMENT ROADMAP');
    csvLines.push('');
    csvLines.push(
      ['Assessment', 'Priority', 'Action', 'Target Factor', 'Effort', 'Impact', 'Timeframe'].join(
        ',',
      ),
    );

    assessmentData.forEach((a) => {
      if (a.audit?.improvement_roadmap?.length > 0) {
        a.audit.improvement_roadmap.forEach((item) => {
          csvLines.push(
            [
              escapeCSV(a.name),
              escapeCSV(item.priority),
              escapeCSV(item.action),
              escapeCSV(item.target_factor ?? ''),
              escapeCSV(item.effort),
              escapeCSV(item.impact),
              escapeCSV(item.timeframe),
            ].join(','),
          );
        });
      }
    });
    csvLines.push('');
  }

  // === AUDIT ANALYSIS SECTION ===
  csvLines.push('AUDIT ANALYSIS');
  csvLines.push('');

  // Audit Verdict
  csvLines.push('AUDIT VERDICT');
  csvLines.push(['Assessment', 'Verdict'].join(','));
  assessmentData.forEach((a) => {
    if (a.audit.audit_verdict) {
      csvLines.push([escapeCSV(a.name), escapeCSV(a.audit.audit_verdict)].join(','));
    }
  });
  csvLines.push('');

  // Comparative Analysis
  csvLines.push('COMPARATIVE ANALYSIS');
  csvLines.push(['Assessment', 'Analysis'].join(','));
  assessmentData.forEach((a) => {
    if (a.audit.comparative_analysis) {
      csvLines.push([escapeCSV(a.name), escapeCSV(a.audit.comparative_analysis)].join(','));
    }
  });
  csvLines.push('');

  // Key Metrics Comparison
  csvLines.push('KEY METRICS COMPARISON');
  csvLines.push(['Assessment', 'Metric', 'Value'].join(','));
  assessmentData.forEach((a) => {
    if (a.audit.key_metrics_comparison) {
      Object.entries(a.audit.key_metrics_comparison).forEach(([key, value]) => {
        csvLines.push(
          [escapeCSV(a.name), escapeCSV(toTitleCase(key)), escapeCSV(value || 'N/A')].join(','),
        );
      });
    }
  });
  csvLines.push('');

  // === INTEGRITY GAPS SECTION ===
  if (assessmentData.some((a) => a.audit.integrity_gaps?.length > 0)) {
    csvLines.push('INTEGRITY GAPS');
    csvLines.push('');
    csvLines.push(['Assessment', 'Issue', 'Severity', 'Evidence Source'].join(','));

    assessmentData.forEach((a) => {
      if (a.audit.integrity_gaps) {
        a.audit.integrity_gaps.forEach((gap) => {
          csvLines.push(
            [
              escapeCSV(a.name),
              escapeCSV(gap.issue || ''),
              escapeCSV(gap.severity || 'low'),
              escapeCSV(gap.evidence_source_id || 'N/A'),
            ].join(','),
          );
        });
      }
    });
    csvLines.push('');
  }

  // === STRENGTHS SECTION ===
  if (assessmentData.some((a) => a.audit.strengths?.length > 0)) {
    csvLines.push('STRENGTHS');
    csvLines.push('');
    csvLines.push(['Assessment', 'Aspect', 'Evidence Source'].join(','));

    assessmentData.forEach((a) => {
      if (a.audit.strengths) {
        a.audit.strengths.forEach((strength) => {
          csvLines.push(
            [
              escapeCSV(a.name),
              escapeCSV(strength.aspect || ''),
              escapeCSV(strength.evidence_source_id || 'N/A'),
            ].join(','),
          );
        });
      }
    });
    csvLines.push('');
  }

  // === TECHNICAL RECOMMENDATIONS SECTION ===
  if (assessmentData.some((a) => a.audit.technical_recommendations?.length > 0)) {
    csvLines.push('TECHNICAL RECOMMENDATIONS');
    csvLines.push('');
    csvLines.push(['Assessment', '#', 'Recommendation'].join(','));

    assessmentData.forEach((a) => {
      if (a.audit.technical_recommendations) {
        a.audit.technical_recommendations.forEach((rec, index) => {
          csvLines.push([escapeCSV(a.name), String(index + 1), escapeCSV(rec)].join(','));
        });
      }
    });
    csvLines.push('');
  }

  // === SIMILAR CASES SECTION ===
  if (assessmentData.some((a) => a.similarCases && a.similarCases.length > 0)) {
    csvLines.push('SIMILAR CASES');
    csvLines.push('');
    csvLines.push(
      [
        'Assessment',
        'ID',
        'Title',
        'Circular Strategy',
        'Similarity Score',
        'Problem',
        'Solution',
        'Impact',
        'Materials',
        'Source',
      ].join(','),
    );

    assessmentData.forEach((a) => {
      if (a.similarCases) {
        a.similarCases.forEach((caseItem) => {
          csvLines.push(
            [
              escapeCSV(a.name),
              escapeCSV(caseItem.id || ''),
              escapeCSV(caseItem.title || ''),
              escapeCSV(caseItem.circular_strategy || ''),
              escapeCSV((caseItem.similarity * 100).toFixed(1) + '%'),
              escapeCSV(caseItem.problem || ''),
              escapeCSV(caseItem.solution || ''),
              escapeCSV(caseItem.impact || ''),
              escapeCSV(caseItem.materials || ''),
              escapeCSV(caseItem.source_display || caseItem.source_url || ''),
            ].join(','),
          );
        });
      }
    });
    csvLines.push('');
  }

  // === SIMILAR CASES SUMMARIES SECTION ===
  if (assessmentData.some((a) => a.audit.similar_cases_summaries?.length > 0)) {
    csvLines.push('SIMILAR CASES SUMMARIES');
    csvLines.push('');
    csvLines.push(['Assessment', '#', 'Summary'].join(','));

    assessmentData.forEach((a) => {
      if (a.audit.similar_cases_summaries) {
        a.audit.similar_cases_summaries.forEach((summary, index) => {
          csvLines.push([escapeCSV(a.name), String(index + 1), escapeCSV(summary)].join(','));
        });
      }
    });
    csvLines.push('');
  }

  // === UN SDG ALIGNMENT SECTION ===
  if (assessmentData.some((a) => a.audit?.sdg_alignment?.length > 0)) {
    csvLines.push('UN SDG ALIGNMENT');
    csvLines.push('');
    csvLines.push(['Assessment', 'SDG Number', 'SDG Name', 'Relevance', 'Rationale'].join(','));

    assessmentData.forEach((a) => {
      if (a.audit?.sdg_alignment?.length > 0) {
        a.audit.sdg_alignment.forEach((sdg) => {
          csvLines.push(
            [
              escapeCSV(a.name),
              escapeCSV(sdg.sdg_number),
              escapeCSV(sdg.sdg_name),
              escapeCSV(sdg.relevance),
              escapeCSV(sdg.rationale),
            ].join(','),
          );
        });
      }
    });
    csvLines.push('');
  }

  // === MARKET OPPORTUNITY SECTION ===
  if (assessmentData.some((a) => a.audit?.market_opportunity_summary)) {
    csvLines.push('MARKET OPPORTUNITY');
    csvLines.push('');
    csvLines.push(['Assessment', 'Market Opportunity Summary'].join(','));
    assessmentData.forEach((a) => {
      if (a.audit?.market_opportunity_summary) {
        csvLines.push([escapeCSV(a.name), escapeCSV(a.audit.market_opportunity_summary)].join(','));
      }
    });
    csvLines.push('');
  }

  const csvContent = csvLines.join('\n');
  const blob = downloadCSV(csvContent, filename);
  return { success: true, message: 'CSV downloaded successfully', blob };
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
  const filename = `comparison-${names}-${dateStr}.csv`;

  const csvLines = [];

  csvLines.push('CIRCULAR ECONOMY ASSESSMENT COMPARISON REPORT');
  csvLines.push(`Generated,${formatDate(new Date())}`);
  csvLines.push('');

  // === ASSESSMENT OVERVIEW SECTION ===
  csvLines.push('ASSESSMENT OVERVIEW');
  csvLines.push('');

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
      industry: assessment.industry ?? result.metadata?.industry ?? 'N/A',
      businessProblem:
        assessment.businessProblem ||
        assessment.business_problem ||
        result.businessProblem ||
        result.business_problem ||
        '',
      businessSolution:
        assessment.businessSolution ||
        assessment.business_solution ||
        result.businessSolution ||
        result.business_solution ||
        '',
      businessContext: assessment.business_context || result.business_context || {},
      overallScore: result.overall_score || 0,
      confidenceLevel: result.confidence_level || 0,
      subScores: result.sub_scores || {},
      derivedMetrics: result.derived_metrics || {},
      scoreBreakdown: result.score_breakdown || {},
      audit: result.audit || {},
      weightedScoreCard: result.weighted_score_card || null,
      circularEconomyTier: result.circular_economy_tier || null,
      parameterConsistency: result.parameter_consistency || null,
      rStrategyAlignment: result.r_strategy_alignment || null,
      similarCases: result.similar_cases || [],
    };
  });

  // Basic info rows
  csvLines.push(['Title', ...assessmentData.map((a) => escapeCSV(a.title))].join(','));
  csvLines.push(['Date', ...assessmentData.map((a) => escapeCSV(a.createdAt))].join(','));
  csvLines.push(
    ['Business Problem', ...assessmentData.map((a) => escapeCSV(a.businessProblem))].join(','),
  );
  csvLines.push(
    ['Business Solution', ...assessmentData.map((a) => escapeCSV(a.businessSolution))].join(','),
  );
  csvLines.push(
    [
      'Short Description',
      ...assessmentData.map((a) => escapeCSV(a.metadata.short_description || 'N/A')),
    ].join(','),
  );
  csvLines.push('');

  // === OVERVIEW METRICS SECTION ===
  csvLines.push('OVERVIEW METRICS');
  csvLines.push('');

  // Build header row: "Evaluation Factor" + assessment titles
  const headerRow = ['Metric', ...assessmentData.map((a) => escapeCSV(a.title))];

  // Add optional "Change" column if comparing exactly 2 assessments
  if (assessmentData.length === 2) {
    headerRow.push('Change (±)');
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

  // Confidence Level Row
  const confidenceRow = ['Confidence Level', ...assessmentData.map((a) => a.confidenceLevel)];
  if (assessmentData.length === 2) {
    const change = assessmentData[1].confidenceLevel - assessmentData[0].confidenceLevel;
    confidenceRow.push(`${change > 0 ? '+' : ''}${change}`);
  }
  csvLines.push(confidenceRow.join(','));
  csvLines.push(''); // Empty row

  // Basic metadata rows
  const metadataRows = [
    ['Industry', 'industry'],
    ['Scale', 'scale'],
    ['R-Strategy', 'r_strategy'],
    ['Primary Material', 'primary_material'],
  ];

  metadataRows.forEach(([label, key]) => {
    const values = assessmentData.map((a) => {
      const value = a.metadata[key] || a[key] || 'N/A';
      return escapeCSV(String(value));
    });

    const row = [label, ...values];
    if (assessmentData.length === 2) {
      row.push('N/A'); // No numeric change for categorical
    }
    csvLines.push(row.join(','));
  });

  csvLines.push('');

  // === FACTOR SCORES SECTION ===
  csvLines.push('FACTOR SCORES');
  csvLines.push('');

  // Collect all unique factors across all assessments
  const allFactors = new Set();
  assessmentData.forEach((a) => {
    Object.keys(a.subScores).forEach((factor) => allFactors.add(factor));
  });

  // Sort factors alphabetically for consistency
  const sortedFactors = Array.from(allFactors).sort();

  // Factor header
  const factorHeader = ['Factor', ...assessmentData.map((a) => escapeCSV(a.title))];
  if (assessmentData.length === 2) {
    factorHeader.push('Change (±)');
  }
  csvLines.push(factorHeader.join(','));

  // Factor Scores - one row per factor
  sortedFactors.forEach((factor) => {
    const factorLabel = escapeCSV(toTitleCase(factor));
    const scores = assessmentData.map((a) => a.subScores[factor] || 0);

    const row = [factorLabel, ...scores];

    // Add change column for 2-assessment comparison
    if (assessmentData.length === 2) {
      const change = scores[1] - scores[0];
      row.push(`${change > 0 ? '+' : ''}${change}`);
    }

    csvLines.push(row.join(','));
  });

  csvLines.push('');

  // === DERIVED METRICS SECTION ===
  csvLines.push('DERIVED METRICS');
  csvLines.push('');

  const derivedHeader = ['Derived Metric', ...assessmentData.map((a) => escapeCSV(a.title))];
  if (assessmentData.length === 2) {
    derivedHeader.push('Change (±)');
  }
  csvLines.push(derivedHeader.join(','));

  const derivedKeys = ['technical_feasibility', 'economic_viability', 'circularity_potential'];
  derivedKeys.forEach((key) => {
    const label = toTitleCase(key);
    const scores = assessmentData.map((a) => a.derivedMetrics[key] || 0);

    const row = [escapeCSV(label), ...scores];

    if (assessmentData.length === 2) {
      const change = scores[1] - scores[0];
      row.push(`${change > 0 ? '+' : ''}${change}`);
    }

    csvLines.push(row.join(','));
  });

  // Risk Level Row
  const riskScores = assessmentData.map((a) => a.derivedMetrics.risk_level || 'N/A');
  const riskRow = ['Risk Level', ...riskScores];
  if (assessmentData.length === 2) {
    riskRow.push('N/A'); // No numeric change for categorical
  }
  csvLines.push(riskRow.join(','));
  csvLines.push('');

  // === SCORE BREAKDOWN SECTION ===
  csvLines.push('SCORE BREAKDOWN');
  csvLines.push('');

  const breakdownHeader = ['Category', ...assessmentData.map((a) => escapeCSV(a.title))];
  if (assessmentData.length === 2) {
    breakdownHeader.push('Change (±)');
  }
  csvLines.push(breakdownHeader.join(','));

  // Collect all unique categories
  const allCategories = new Set();
  assessmentData.forEach((a) => {
    Object.keys(a.scoreBreakdown).forEach((category) => allCategories.add(category));
  });

  Array.from(allCategories)
    .sort()
    .forEach((category) => {
      const label = toTitleCase(category);
      const scores = assessmentData.map((a) => a.scoreBreakdown[category]?.score || 0);

      const row = [escapeCSV(label), ...scores];

      if (assessmentData.length === 2) {
        const change = scores[1] - scores[0];
        row.push(`${change > 0 ? '+' : ''}${change}`);
      }

      csvLines.push(row.join(','));
    });

  csvLines.push('');

  // === WEIGHTED SCORE CARD SECTION ===
  if (assessmentData.some((a) => a.weightedScoreCard?.factors)) {
    csvLines.push('WEIGHTED SCORE CARD');
    csvLines.push('');

    // Collect all unique factors across assessments
    const allWSCFactors = new Set();
    assessmentData.forEach((a) => {
      if (a.weightedScoreCard?.factors) {
        Object.keys(a.weightedScoreCard.factors).forEach((factor) => allWSCFactors.add(factor));
      }
    });

    // Sort factors by rank (use first assessment's rank where available)
    const sortedWSCFactors = Array.from(allWSCFactors).sort((a, b) => {
      const rankA = assessmentData[0].weightedScoreCard?.factors[a]?.rank || 999;
      const rankB = assessmentData[0].weightedScoreCard?.factors[b]?.rank || 999;
      return rankA - rankB;
    });

    // Header row
    const weightedHeader = ['Factor', ...assessmentData.map((a) => `Raw Score (${a.title})`)];
    if (assessmentData.length === 2) {
      weightedHeader.push('Change (±)');
    }
    csvLines.push(weightedHeader.join(','));

    // Factor rows
    sortedWSCFactors.forEach((factor) => {
      const label = toTitleCase(factor);
      const scores = assessmentData.map(
        (a) => a.weightedScoreCard?.factors[factor]?.raw_score || 0,
      );
      const row = [escapeCSV(label), ...scores];

      if (assessmentData.length === 2) {
        const delta = scores[1] - scores[0];
        row.push(`${delta > 0 ? '+' : ''}${delta}`);
      }

      csvLines.push(row.join(','));
    });

    // Add Top/Bottom contributor rows
    csvLines.push('');
    assessmentData.forEach((a) => {
      if (a.weightedScoreCard?.top_contributor) {
        csvLines.push(
          `${escapeCSV(a.title)},Top Contributor,${escapeCSV(toTitleCase(a.weightedScoreCard.top_contributor))}`,
        );
      }
      if (a.weightedScoreCard?.bottom_contributor) {
        csvLines.push(
          `${escapeCSV(a.title)},Bottom Contributor,${escapeCSV(toTitleCase(a.weightedScoreCard.bottom_contributor))}`,
        );
      }
    });
    csvLines.push('');
  }

  // === DETAILED ASSESSMENT SECTIONS ===
  // For text fields, use separate rows per assessment rather than side-by-side
  csvLines.push('DETAILED ASSESSMENT INFORMATION');
  csvLines.push('');

  assessmentData.forEach((a, index) => {
    csvLines.push(`=== ${a.title} ===`);
    csvLines.push('');

    // R-Strategy Alignment
    if (a.rStrategyAlignment) {
      csvLines.push('R-STRATEGY ALIGNMENT');
      csvLines.push(['Strategy', escapeCSV(a.rStrategyAlignment.strategy || 'N/A')].join(','));
      csvLines.push(
        ['Alignment Score', escapeCSV(a.rStrategyAlignment.alignment_score || 'N/A')].join(','),
      );
      csvLines.push(['Rating', escapeCSV(a.rStrategyAlignment.rating || 'N/A')].join(','));
      csvLines.push(['Message', escapeCSV(a.rStrategyAlignment.message || '')].join(','));
      csvLines.push('');
    }

    // Parameter Consistency
    if (a.parameterConsistency) {
      csvLines.push('PARAMETER CONSISTENCY');
      csvLines.push(['Score', escapeCSV(a.parameterConsistency.score || 'N/A')].join(','));
      csvLines.push(['Rating', escapeCSV(a.parameterConsistency.rating || 'N/A')].join(','));
      csvLines.push(['Issues Found', String(a.parameterConsistency.issues_found || 0)].join(','));
      csvLines.push(
        ['Interpretation', escapeCSV(a.parameterConsistency.interpretation || '')].join(','),
      );
      csvLines.push('');
    }

    // Circular Economy Tier
    if (a.circularEconomyTier) {
      csvLines.push('CIRCULAR ECONOMY TIER');
      csvLines.push(['Tier', escapeCSV(a.circularEconomyTier.tier || 'N/A')].join(','));
      csvLines.push(['Range', escapeCSV(a.circularEconomyTier.range || 'N/A')].join(','));
      csvLines.push(['Description', escapeCSV(a.circularEconomyTier.description || '')].join(','));
      csvLines.push(
        ['Next Milestone', escapeCSV(a.circularEconomyTier.next_milestone || '')].join(','),
      );
      csvLines.push(
        ['Percentile Estimate', escapeCSV(a.circularEconomyTier.percentile_estimate || 'N/A')].join(
          ',',
        ),
      );
      csvLines.push('');
    }

    // Audit Information
    if (a.audit) {
      csvLines.push('AUDIT INFORMATION');

      if (a.audit.audit_verdict) {
        csvLines.push(['Audit Verdict', escapeCSV(a.audit.audit_verdict)].join(','));
      }

      if (a.audit.comparative_analysis) {
        csvLines.push(['Comparative Analysis', escapeCSV(a.audit.comparative_analysis)].join(','));
      }

      if (a.audit.market_opportunity_summary) {
        csvLines.push(
          ['Market Opportunity', escapeCSV(a.audit.market_opportunity_summary)].join(','),
        );
      }

      csvLines.push('');

      // Technical Recommendations
      if (a.audit.technical_recommendations && a.audit.technical_recommendations.length > 0) {
        csvLines.push('TECHNICAL RECOMMENDATIONS');
        a.audit.technical_recommendations.forEach((rec, recIndex) => {
          csvLines.push([String(recIndex + 1), escapeCSV(rec)].join(','));
        });
        csvLines.push('');
      }

      // SDG Alignment
      if (a.audit.sdg_alignment && a.audit.sdg_alignment.length > 0) {
        csvLines.push('UN SDG ALIGNMENT');
        a.audit.sdg_alignment.forEach((sdg) => {
          csvLines.push(
            [
              escapeCSV(sdg.sdg_number),
              escapeCSV(sdg.sdg_name),
              escapeCSV(sdg.relevance),
              escapeCSV(sdg.rationale),
            ].join(','),
          );
        });
        csvLines.push('');
      }
    }

    // Similar Cases (up to 3)
    if (a.similarCases && a.similarCases.length > 0) {
      csvLines.push('SIMILAR CASES');
      a.similarCases.slice(0, 3).forEach((caseItem, caseIndex) => {
        csvLines.push([`Case ${caseIndex + 1}`, ''].join(','));
        csvLines.push(['Title', escapeCSV(caseItem.title || '')].join(','));
        csvLines.push(['Circular Strategy', escapeCSV(caseItem.circular_strategy || '')].join(','));
        csvLines.push(
          ['Similarity', escapeCSV((caseItem.similarity * 100).toFixed(1) + '%')].join(','),
        );
        csvLines.push(['Problem', escapeCSV(caseItem.problem || '')].join(','));
        csvLines.push(['Solution', escapeCSV(caseItem.solution || '')].join(','));
        csvLines.push(['Impact', escapeCSV(caseItem.impact || '')].join(','));
        csvLines.push(['Materials', escapeCSV(caseItem.materials || '')].join(','));
        csvLines.push(
          ['Source', escapeCSV(caseItem.source_display || caseItem.source_url || '')].join(','),
        );
        csvLines.push('');
      });
    }

    if (index < assessmentData.length - 1) {
      csvLines.push('');
      csvLines.push('');
    }
  });

  const csvContent = csvLines.join('\n');
  const blob = downloadCSV(csvContent, filename);
  return { success: true, message: 'Comparison CSV downloaded successfully', blob };
}
