import { Accordion } from '@heroui/react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import PropTypes from 'prop-types';

import RadarChart from '@/components/charts/RadarChart';
import { Chip } from '@/components/common';
import { SectionHeading } from '@/components/common/SectionHeading';
import {
  AuditSummaryCard as SharedAuditSummaryCard,
  GapAnalysisCard as SharedGapAnalysisCard,
} from '@/components/results/shared';
import { categoryMapping, validKeys } from '@/constants/evaluationData';
import { titleize } from '@/lib/formatting';
import { formatFactorName } from '@/lib/scoring';
import { CaseSummaryAccordions } from '@/pages/ResultsPage/components/CaseSummaryAccordions';
import { CircularEconomyTierCard } from '@/pages/ResultsPage/components/CircularEconomyTierCard';
import { DatabaseEvidenceCard } from '@/pages/ResultsPage/components/DatabaseEvidenceCard';
import { FieldDisplayCard } from '@/pages/ResultsPage/components/FieldDisplayCard';
import { ParameterConsistencyCard } from '@/pages/ResultsPage/components/ParameterConsistencyCard';
import { RStrategyAlignmentCard } from '@/pages/ResultsPage/components/RStrategyAlignmentCard';
import { ScoreCategoryBreakdown } from '@/pages/ResultsPage/components/ScoreCategoryBreakdown';
import { WeightedScoreCard } from '@/pages/ResultsPage/components/WeightedScoreCard';

export function AssessmentColumn({
  assessment,
  scoringResult,
  label,
  overallScore,
  strengths,
  gaps,
  casesSummaries,
  topFactor,
  focusFactor,
  avgFactorScore,
  resolvedBusinessViabilityScore,
  openResultsDatabaseEvidenceDetailsDrawer,
}) {
  const fieldHelp = {
    industry: 'Sector we matched from your description',
    scale: 'Maturity/footprint: prototype, pilot, regional, commercial, global',
    r_strategy: 'Dominant circular economy strategy (e.g., Reduce, Reuse, Recycle)',
    primary_material: 'Main material or waste stream this solution targets',
    geographic_focus: 'Primary market or region you aim to serve',
  };

  // Compute market average for radar chart
  const computeMarketAvg = (res) => {
    if (!res?.similar_cases || res.similar_cases.length === 0) return 65;
    return (
      res.similar_cases.reduce((acc, curr) => acc + (curr.similarity || 0) * 100, 0) /
      res.similar_cases.length
    );
  };

  // Build radar data and configs internally
  const radarData = validKeys
    .filter((key) => key in (scoringResult?.sub_scores || {}))
    .map((key) => ({
      subject: formatFactorName(key),
      userValue: Number(scoringResult.sub_scores[key]) || 0,
      marketAvg: computeMarketAvg(scoringResult),
    }));

  const radarConfigs = [
    {
      name: 'Your Idea',
      dataKey: 'userValue',
      stroke: 'var(--success)',
      fill: 'var(--success)',
      fillOpacity: 0.35,
    },
    {
      name: 'Market Average',
      dataKey: 'marketAvg',
      stroke: 'var(--info)',
      fill: 'var(--info)',
      fillOpacity: 0.2,
    },
  ];

  return (
    <div className="space-y-0">
      {/* Case Summary */}
      <div className="py-4">
        <SectionHeading variant="large" className="mb-0">
          Case Summary
        </SectionHeading>
        <CaseSummaryAccordions
          businessProblem={assessment.business_problem}
          businessSolution={assessment.business_solution}
          businessContext={assessment.business_context}
          evaluationParameters={assessment.evaluation_parameters}
        />
      </div>

      {/* Score Overview */}
      <div className="mt-8">
        {/* Industry + Confidence chips */}
        <div className="flex justify-center gap-4 mb-6">
          {scoringResult?.metadata?.industry && (
            <div
              className="px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: 'var(--color-accent-light)' }}
            >
              <span className="text-sm font-medium text-(--color-text-primary)">
                {titleize(scoringResult.metadata.industry)}
              </span>
            </div>
          )}
          {scoringResult?.confidence_level && (
            <div
              className="px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: 'var(--color-accent-light)' }}
            >
              <span className="text-sm font-medium text-(--color-text-primary)">
                {scoringResult.confidence_level}% Confidence
              </span>
            </div>
          )}
        </div>

        {/* Big score */}
        <div className="text-center mb-8">
          <div className="font-(--font-mono) text-[72px] font-light text-(--color-text-primary) tracking-[-0.04em]">
            {overallScore}
          </div>
          <div className="text-2xl text-(--color-text-muted)">/100</div>
          <div className="text-sm text-(--color-text-muted) uppercase tracking-widest mt-2">
            Circularity Score
          </div>
          {scoringResult?.metadata?.short_description && (
            <p className="font-sans text-[20px] text-(--color-text-primary) leading-[1.4] not-italic mb-2 mt-6 max-w-xl mx-auto">
              {scoringResult.metadata.short_description}
            </p>
          )}
        </div>

        {/* Audit verdict callout */}
        {scoringResult?.audit?.audit_verdict && (
          <div className="border-l-2 border-(--color-accent) pl-3 py-1 text-sm text-(--color-text-secondary) leading-relaxed mb-4">
            {scoringResult.audit.audit_verdict}
          </div>
        )}

        {/* Comparative analysis callout */}
        {scoringResult?.audit?.comparative_analysis && (
          <div className="border-l-2 border-(--color-accent) pl-3 py-1 text-sm text-(--color-text-secondary) leading-relaxed mb-4">
            <p className="text-xs font-semibold uppercase mb-1 text-(--color-accent)">
              Key Finding
            </p>
            {scoringResult.audit.comparative_analysis}
          </div>
        )}

        {/* Strongest factor + Focus area cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {topFactor && (
            <div className="border-2 border-[rgba(180,160,130,0.25)] rounded-[12px] p-4 bg-transparent">
              <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-(--color-text-muted) mb-1">
                Strongest Factor
              </div>
              <div className="text-[14px] font-semibold text-(--color-accent)">{topFactor[0]}</div>
              <div className="text-[12px] text-(--color-text-muted)">Score: {topFactor[1]}</div>
            </div>
          )}
          {focusFactor && (
            <div className="border-2 border-[rgba(180,160,130,0.25)] rounded-[12px] p-4 bg-transparent">
              <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-(--color-text-muted) mb-1">
                Focus Area
              </div>
              <div className="text-[14px] font-semibold text-(--color-accent)">
                {focusFactor[0]}
              </div>
              <div className="text-[12px] text-(--color-text-muted)">Score: {focusFactor[1]}</div>
            </div>
          )}
        </div>
      </div>

      {/* Reuse ResultsPage components directly */}
      <CircularEconomyTierCard actualResult={scoringResult} />
      <WeightedScoreCard actualResult={scoringResult} />
      <ParameterConsistencyCard actualResult={scoringResult} />
      <RStrategyAlignmentCard actualResult={scoringResult} />
      <ScoreCategoryBreakdown actualResult={scoringResult} />
      <SharedGapAnalysisCard result={scoringResult} variant="transparent" />

      {/* Metadata grid */}
      {scoringResult?.metadata && (
        <div
          className="border rounded-lg mt-6"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="p-2 sm:p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                {
                  label: 'Industry',
                  value: scoringResult.industry || scoringResult.metadata?.industry || '',
                  helpKey: 'industry',
                },
                { label: 'Scale', value: scoringResult.metadata.scale, helpKey: 'scale' },
                {
                  label: 'Strategy',
                  value: scoringResult.metadata.r_strategy,
                  helpKey: 'r_strategy',
                },
                {
                  label: 'Material',
                  value: scoringResult.metadata.primary_material,
                  helpKey: 'primary_material',
                },
                {
                  label: 'Geography',
                  value: scoringResult.metadata.geographic_focus,
                  helpKey: 'geographic_focus',
                },
              ].map((field) => (
                <FieldDisplayCard
                  key={field.label}
                  label={field.label}
                  value={field.value}
                  helpText={fieldHelp[field.helpKey]}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Analysis */}
      <div className="border-2 border-[rgba(180,160,130,0.25)] rounded-3xl bg-transparent mt-6">
        <div className="p-1 sm:p-3">
          <SectionHeading variant="large">Category Analysis</SectionHeading>
          <p className="text-sm text-(--color-text-muted) mb-4 -mt-4">
            Detailed breakdown across all evaluation criteria
          </p>
          <div className="space-y-3">
            {validKeys.map((key) => {
              const value = scoringResult?.sub_scores?.[key];
              if (!(scoringResult?.sub_scores && key in scoringResult.sub_scores)) return null;

              const category = categoryMapping[key];
              if (!category) return null;

              const numValue = value != null && !isNaN(value) ? Number(value) : 0;
              const barColor =
                numValue >= 75
                  ? '#4a7c59' // muted green
                  : numValue >= 50
                    ? '#b07d3a' // muted amber
                    : '#8b3a3a'; // muted red
              const badgeColor =
                numValue >= 75
                  ? '#4a7c59' // muted green
                  : numValue >= 50
                    ? '#b07d3a' // muted amber
                    : '#8b3a3a'; // muted red

              return (
                <div
                  key={key}
                  className="p-4 rounded-2xl border-2 border-[rgba(180,160,130,0.18)] bg-[rgba(245,240,232,0.5)]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-(--color-text-primary)">
                        {category.name}
                      </h4>
                      <p className="text-xs mt-0.5 text-(--color-text-muted)">{category.desc}</p>
                    </div>
                    <div
                      className="ml-4 px-3 py-1 rounded-lg font-bold text-sm bg-transparent border border-[rgba(180,160,130,0.18)]"
                      style={{ color: badgeColor }}
                    >
                      {numValue}
                    </div>
                  </div>

                  <div className="w-full rounded-full h-2 overflow-hidden bg-[rgba(180,160,130,0.2)]">
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(0, numValue))}%`,
                        backgroundColor: barColor,
                        opacity: numValue >= 75 ? 0.7 : numValue >= 50 ? 0.6 : 0.6,
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {/* Business Viability Category */}
            <div className="p-4 rounded-2xl border border-[rgba(180,160,130,0.18)] bg-[rgba(245,240,232,0.5)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-(--color-text-primary)">
                    Business Viability
                  </h4>
                  <p className="text-xs mt-0.5 text-(--color-text-muted)">
                    Economic feasibility and scalability
                  </p>
                </div>
                <div
                  className="ml-4 px-3 py-1 rounded-lg font-bold text-sm bg-transparent border border-[rgba(180,160,130,0.18)]"
                  style={{
                    color:
                      resolvedBusinessViabilityScore >= 75
                        ? '#4a7c59' // muted green
                        : resolvedBusinessViabilityScore >= 50
                          ? '#b07d3a' // muted amber
                          : '#8b3a3a', // muted red
                  }}
                >
                  {resolvedBusinessViabilityScore}
                </div>
              </div>

              <div className="w-full rounded-full h-2 overflow-hidden bg-[rgba(180,160,130,0.2)]">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${resolvedBusinessViabilityScore}%`,
                    backgroundColor:
                      resolvedBusinessViabilityScore >= 75
                        ? '#4a7c59' // muted green
                        : resolvedBusinessViabilityScore >= 50
                          ? '#b07d3a' // muted amber
                          : '#8b3a3a', // muted red
                    opacity:
                      resolvedBusinessViabilityScore >= 75
                        ? 0.7
                        : resolvedBusinessViabilityScore >= 50
                          ? 0.6
                          : 0.6,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Comparison (RadarChart) */}
      {radarData && radarData.length > 0 && (
        <div className="border-2 border-[rgba(180,160,130,0.25)] rounded-3xl bg-transparent mt-6">
          <div className="p-2 sm:p-3">
            <SectionHeading variant="large">Performance Comparison</SectionHeading>
            <p className="text-sm text-(--color-text-muted) -mt-4">
              How this assessment compares to similar projects
            </p>
            <div className="w-full rounded-3xl p-4 bg-[rgba(245,240,232,0.5)]">
              <RadarChart
                data={radarData}
                radarConfigs={radarConfigs}
                height={320}
                showLegend
                showTooltip
              />
            </div>
          </div>
        </div>
      )}

      {/* Integrity Analysis - Beautiful Accordion Design (same as Summary tab) */}
      {(strengths.length > 0 || gaps.length > 0) && (
        <div className="border-2 border-[rgba(180,160,130,0.25)] rounded-3xl bg-transparent mt-6">
          <div className="p-2 sm:p-4">
            <SectionHeading variant="small" className="mb-1">
              Integrity Analysis
            </SectionHeading>
            <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
              We compare your self-assessed scores against real-world projects in our database to
              identify potential overestimations or underestimations.
            </p>

            <Accordion type="single" collapsible className="space-y-3">
              {/* Strengths */}
              {strengths.length > 0 && (
                <Accordion.Item
                  value="strengths"
                  className="rounded-lg overflow-hidden"
                  style={{
                    backgroundColor: 'var(--success-soft)',
                    borderColor: 'var(--success)',
                  }}
                >
                  <Accordion.Trigger className="px-4 py-3 hover:bg-success-soft transition-colors">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
                      <span
                        className="text-base font-semibold"
                        style={{
                          color: 'var(--foreground)',
                        }}
                      >
                        Strengths Validated
                      </span>
                      <Chip variant="status" color="success" size="sm" className="ml-2 font-bold">
                        {strengths.length}
                      </Chip>
                    </div>
                  </Accordion.Trigger>
                  <Accordion.Body className="px-4 pb-4">
                    <div className="space-y-2">
                      {strengths.map((strength, i) => (
                        <div
                          key={i}
                          className="flex gap-2 p-3 rounded-lg border"
                          style={{
                            backgroundColor: 'var(--surface)',
                            borderColor: 'var(--success)',
                          }}
                        >
                          <CheckCircle2
                            className="shrink-0 mt-0.5"
                            size={16}
                            style={{ color: 'var(--success)' }}
                          />
                          <div className="flex-1">
                            <p
                              className="text-sm"
                              style={{
                                color: 'var(--foreground)',
                              }}
                            >
                              {strength.issue || strength}
                            </p>
                            {strength.evidence_source_id && (
                              <Chip variant="case" className="mt-1 text-xs">
                                Validated by Case #{strength.evidence_source_id}
                              </Chip>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              )}

              {/* Areas for Improvement */}
              {gaps.length > 0 && (
                <Accordion.Item
                  value="gaps"
                  className="rounded-lg overflow-hidden"
                  style={{
                    backgroundColor: 'var(--warning-soft)',
                    borderColor: 'var(--warning)',
                  }}
                >
                  <Accordion.Trigger className="px-4 py-3 hover:bg-warning-soft transition-colors">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
                      <span
                        className="text-base font-semibold"
                        style={{
                          color: 'var(--foreground)',
                        }}
                      >
                        Areas for Improvement
                      </span>
                      <Chip variant="status" color="warning" size="sm" className="ml-2 font-bold">
                        {gaps.length}
                      </Chip>
                    </div>
                  </Accordion.Trigger>
                  <Accordion.Body className="px-4 pb-4">
                    <div className="space-y-2">
                      {gaps.map((gap, i) => {
                        const severity = gap.severity || 'medium';
                        const severityColors = {
                          high: 'var(--danger-soft)',
                          medium: 'var(--warning-soft)',
                          low: 'var(--info-soft)',
                        };

                        return (
                          <div
                            key={i}
                            className={`flex gap-2 p-3 rounded-lg border bg-surface`}
                            style={{
                              backgroundColor: 'var(--surface)',
                              borderColor: severityColors[severity],
                            }}
                          >
                            <AlertCircle
                              className="shrink-0 mt-0.5"
                              size={16}
                              style={{ color: 'var(--warning)' }}
                            />
                            <div className="flex-1">
                              <p
                                className="text-sm"
                                style={{
                                  color: 'var(--foreground)',
                                }}
                              >
                                {(gap.issue || gap).replace(/_/g, ' ')}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <Chip
                                  variant="severity"
                                  color={severity}
                                  size="sm"
                                  className="font-bold text-xs"
                                >
                                  {severity.charAt(0).toUpperCase() + severity.slice(1)} severity
                                </Chip>
                                {gap.evidence_source_id && (
                                  <Chip variant="case" className="text-xs">
                                    Case #{gap.evidence_source_id}
                                  </Chip>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              )}
            </Accordion>
          </div>
        </div>
      )}

      {/* SharedAuditSummaryCard */}
      <SharedAuditSummaryCard result={scoringResult} variant="transparent" />

      {/* DatabaseEvidenceCard */}
      <DatabaseEvidenceCard actualResult={scoringResult} casesSummaries={casesSummaries} />

      {/* Strengths & Gaps Card - Modern Design */}
      <div className="border-2 border-[rgba(180,160,130,0.25)] rounded-3xl bg-transparent mt-6">
        <div className="p-2 sm:p-4">
          <SectionHeading variant="small" className="mb-1">
            Strengths & Gaps
          </SectionHeading>
          <p className="text-sm mb-4 -mt-4" style={{ color: 'var(--muted)' }}>
            Highlights from your assessment and improvement areas
          </p>
          <div className="space-y-4">
            <div
              className="p-4 rounded-xl border-2"
              style={{
                background: 'var(--background-secondary)',
                borderColor: 'rgba(107,142,109,0.3)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={20} style={{ color: '#6B8E6D' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  Strengths
                </p>
              </div>
              <ul className="space-y-2 text-sm">
                {strengths.length > 0 ? (
                  strengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 leading-relaxed">
                      <span className="font-semibold mt-0.5" style={{ color: 'var(--foreground)' }}>
                        •
                      </span>
                      <span
                        style={{
                          color: 'var(--foreground)',
                        }}
                      >
                        {strength.issue || strength}
                        {strength.evidence_source_id && (
                          <Chip variant="case" className="ml-2 text-xs">
                            Case #{strength.evidence_source_id}
                          </Chip>
                        )}
                      </span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-start gap-2 leading-relaxed">
                      <span className="font-semibold mt-0.5" style={{ color: 'var(--foreground)' }}>
                        •
                      </span>
                      <span
                        style={{
                          color: 'var(--foreground)',
                        }}
                      >
                        Strong focus on material reuse and recycling
                      </span>
                    </li>
                    <li className="flex items-start gap-2 leading-relaxed">
                      <span className="font-semibold mt-0.5" style={{ color: 'var(--foreground)' }}>
                        •
                      </span>
                      <span
                        style={{
                          color: 'var(--foreground)',
                        }}
                      >
                        Clear value proposition for sustainability
                      </span>
                    </li>
                    <li className="flex items-start gap-2 leading-relaxed">
                      <span className="font-semibold mt-0.5" style={{ color: 'var(--foreground)' }}>
                        •
                      </span>
                      <span
                        style={{
                          color: 'var(--foreground)',
                        }}
                      >
                        Potential for scalable implementation
                      </span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {gaps.length > 0 && (
              <div
                className="p-4 rounded-xl border-2"
                style={{
                  background: 'var(--background-secondary)',
                  borderColor: 'rgba(195,75,75,0.3)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={20} style={{ color: '#C3916B' }} />
                  <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                    Areas for Improvement
                  </p>
                </div>
                <ul className="space-y-2 text-sm">
                  {gaps.map((gap, i) => (
                    <li key={i} className="flex items-start gap-2 leading-relaxed">
                      <span className="font-semibold mt-0.5" style={{ color: 'var(--foreground)' }}>
                        •
                      </span>
                      <span
                        style={{
                          color: 'var(--foreground)',
                        }}
                      >
                        {gap.issue || gap}
                        {gap.evidence_source_id && (
                          <Chip variant="case" className="ml-2 text-xs">
                            Case #{gap.evidence_source_id}
                          </Chip>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations Card - Modern Design */}
      <div className="border-2 border-[rgba(180,160,130,0.25)] rounded-3xl bg-transparent mt-6">
        <div className="p-2 sm:p-4">
          <h3
            className="text-lg font-semibold mb-1"
            style={{
              color: 'var(--foreground)',
            }}
          >
            Recommendations
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
            Targeted steps to improve your circularity score
          </p>

          <div
            className="p-4 rounded-xl border-0"
            style={{
              background:
                'linear-gradient(to bottom right, var(--accent-soft), var(--accent-soft))',
              borderColor: 'var(--accent)',
            }}
          >
            <ul className="space-y-3 text-sm">
              {scoringResult?.audit?.technical_recommendations?.length > 0 ? (
                scoringResult.audit.technical_recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="font-semibold mt-0.5" style={{ color: 'var(--accent)' }}>
                      •
                    </span>
                    <span
                      style={{
                        color: 'var(--foreground)',
                      }}
                    >
                      {rec}
                    </span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex items-start gap-2 leading-relaxed">
                    <span className="font-semibold mt-0.5" style={{ color: 'var(--accent)' }}>
                      •
                    </span>
                    <span
                      style={{
                        color: 'var(--foreground)',
                      }}
                    >
                      Consider incorporating predictive maintenance strategies
                    </span>
                  </li>
                  <li className="flex items-start gap-2 leading-relaxed">
                    <span className="font-semibold mt-0.5" style={{ color: 'var(--accent)' }}>
                      •
                    </span>
                    <span
                      style={{
                        color: 'var(--foreground)',
                      }}
                    >
                      Explore partnerships with recycling facilities
                    </span>
                  </li>
                  <li className="flex items-start gap-2 leading-relaxed">
                    <span className="font-semibold mt-0.5" style={{ color: 'var(--accent)' }}>
                      •
                    </span>
                    <span
                      style={{
                        color: 'var(--foreground)',
                      }}
                    >
                      Develop metrics for tracking circularity performance
                    </span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

AssessmentColumn.propTypes = {
  assessment: PropTypes.object.isRequired,
  scoringResult: PropTypes.object.isRequired,
  label: PropTypes.string,
  overallScore: PropTypes.number.isRequired,
  strengths: PropTypes.array.isRequired,
  gaps: PropTypes.array.isRequired,
  casesSummaries: PropTypes.array.isRequired,
  topFactor: PropTypes.array,
  focusFactor: PropTypes.array,
  avgFactorScore: PropTypes.number.isRequired,
  resolvedBusinessViabilityScore: PropTypes.number.isRequired,
  openResultsDatabaseEvidenceDetailsDrawer: PropTypes.func.isRequired,
};

export default AssessmentColumn;
