import { Lightbulb, Target } from 'lucide-react';
import PropTypes from 'prop-types';

import { Chip } from '@/components/common';
import { SectionHeading } from '@/components/common/SectionHeading';
import { parameterLabels } from '@/constants/evaluationData';
import { titleize } from '@/lib/formatting';

// Single assessment overview component
function SingleAssessmentOverview({ assessment, scoringResult, variant }) {
  const subScores = scoringResult?.sub_scores || {};
  const topFactor = Object.entries(subScores).reduce((a, b) => (b[1] > a[1] ? b : a), ['N/A', 0]);
  const focusFactor = Object.entries(subScores).reduce((a, b) => (b[1] < a[1] ? b : a), ['N/A', 0]);
  const avgScore =
    Object.values(subScores).length > 0
      ? Math.round(
          Object.values(subScores).reduce((a, b) => a + b, 0) / Object.values(subScores).length,
        )
      : 0;

  return (
    <div className="space-y-8">
      {/* Input Data & Context */}
      <div>
        <SectionHeading
          variant="small"
          icon={<Lightbulb className="w-4 h-4 text-(--color-accent)" />}
        >
          Input Data & Context
        </SectionHeading>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-(--color-text-muted) mb-1">
              Business Problem
            </p>
            <p className="text-sm text-(--color-text-secondary) leading-relaxed">
              {assessment?.business_problem || 'N/A'}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-(--color-text-muted) mb-1">
              Business Solution
            </p>
            <p className="text-sm text-(--color-text-secondary) leading-relaxed">
              {assessment?.business_solution || 'N/A'}
            </p>
          </div>

          {scoringResult?.metadata?.short_description && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-(--color-text-muted) mb-1">
                Assessment Summary
              </p>
              <p className="text-sm text-(--color-text-secondary) leading-relaxed">
                {scoringResult.metadata.short_description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Score Highlights */}
      <div>
        <SectionHeading variant="small" icon={<Target className="w-4 h-4 text-(--color-accent)" />}>
          Score Highlights
        </SectionHeading>

        <div className="space-y-4">
          {/* Strongest Factor */}
          <div className="p-4 border border-(--color-border) rounded-lg">
            <p className="text-xs font-semibold mb-2 text-(--color-text-muted)">Strongest Factor</p>
            <p className="text-lg font-bold text-(--color-success)">
              {topFactor[0] !== 'N/A' ? titleize(topFactor[0]) : 'N/A'}
            </p>
            <p className="text-sm font-semibold text-(--color-text-muted)">
              {topFactor[0] !== 'N/A' ? `${topFactor[1]}/100` : '—'}
            </p>
          </div>

          {/* Focus Area */}
          <div className="p-4 border border-(--color-border) rounded-lg">
            <p className="text-xs font-semibold mb-2 text-(--color-text-muted)">Focus Area</p>
            <p className="text-lg font-bold text-(--color-warning)">
              {focusFactor[0] !== 'N/A' ? titleize(focusFactor[0]) : 'N/A'}
            </p>
            <p className="text-sm font-semibold text-(--color-text-muted)">
              {focusFactor[0] !== 'N/A' ? `${focusFactor[1]}/100` : '—'}
            </p>
          </div>

          {/* Average Score */}
          <div className="p-4 border border-(--color-border) rounded-lg">
            <p className="text-xs font-semibold mb-2 text-(--color-text-muted)">Average Score</p>
            <p className="text-lg font-bold text-(--color-accent)">{avgScore}/100</p>
            <div className="flex-1 rounded-full h-1.5 relative overflow-hidden bg-(--color-border) mt-2">
              <div
                className="h-1.5 rounded-full bg-(--color-accent)"
                style={{ width: `${avgScore}%` }}
              />
            </div>
          </div>

          {/* Business Viability Score */}
          {(() => {
            const computeBusinessViabilityScore = (res) => {
              if (!res) return 0;
              const confidence = res.audit?.confidence_score;
              const normalizedConfidence = confidence ? (confidence / 100) * 100 : 50;
              return Math.round(
                (Number(res.overall_score) || 0) * 0.7 + normalizedConfidence * 0.3,
              );
            };
            const businessViabilityScore = computeBusinessViabilityScore(scoringResult);

            return (
              <div className="p-4 border border-(--color-border) rounded-lg">
                <p className="text-xs font-semibold mb-2 text-(--color-text-muted)">
                  Business Viability
                </p>
                <p className="text-lg font-bold text-(--color-success)">
                  {businessViabilityScore}/100
                </p>
                <div className="flex-1 rounded-full h-1.5 relative overflow-hidden bg-(--color-border) mt-2">
                  <div
                    className="h-1.5 rounded-full bg-(--color-success)"
                    style={{ width: `${businessViabilityScore}%` }}
                  />
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Audit Verdict */}
      {scoringResult?.audit?.audit_verdict && (
        <div>
          <SectionHeading
            variant="small"
            icon={<Target className="w-4 h-4 text-(--color-accent)" />}
          >
            Audit Verdict
          </SectionHeading>

          <div className="border-l-2 border-(--color-accent) pl-3 py-1 text-sm text-(--color-text-secondary) leading-relaxed">
            {scoringResult.audit.audit_verdict}
          </div>
        </div>
      )}

      {/* Score Breakdown */}
      {scoringResult?.score_breakdown && (
        <div>
          <SectionHeading
            variant="small"
            icon={<Target className="w-4 h-4 text-(--color-accent)" />}
          >
            Score Breakdown
          </SectionHeading>

          <div className="space-y-3">
            {Object.entries(scoringResult.score_breakdown).map(([category, data]) => (
              <div
                key={category}
                className="flex items-center gap-3 py-2 border-b border-(--color-border) last:border-0"
              >
                <div className="w-36 text-xs font-medium truncate shrink-0 text-(--color-text-muted)">
                  {category}
                </div>
                <div className="flex-1 rounded-full h-1.5 relative overflow-hidden bg-(--color-border)">
                  <div
                    className="h-1.5 rounded-full bg-(--color-accent)"
                    style={{ width: `${data.score}%` }}
                  />
                </div>
                <div className="text-xs w-8 text-right shrink-0 font-mono text-(--color-text-primary)">
                  {data.score}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evaluation Parameters */}
      {assessment?.evaluation_parameters && (
        <div>
          <SectionHeading
            variant="small"
            icon={<Target className="w-4 h-4 text-(--color-accent)" />}
          >
            Evaluation Parameters
          </SectionHeading>

          <div className="space-y-3">
            {Object.entries(parameterLabels).map(([key, paramInfo]) => {
              const value = assessment.evaluation_parameters[key];
              if (value === undefined || value === null) return null;

              return (
                <div
                  key={key}
                  className="flex justify-between items-center py-2.5 border-b border-(--color-border) last:border-0 text-sm"
                >
                  <span className="text-(--color-text-muted) w-2/3">{paramInfo.label}</span>
                  <span className="text-(--color-text-primary) w-1/3 text-right font-medium">
                    {typeof value === 'number' ? value : value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
export function OverviewTab({
  assessment,
  scoringResult,
  insights,
  variant = 'left', // 'left' or 'right' for side-by-side view
  // Legacy props for backward compatibility
  assessment1,
  assessment2,
  scoringResult1,
  scoringResult2,
  overallDelta,
  biggestGain,
  biggestDrop,
  averageDelta,
}) {
  // Handle new single-assessment variant
  if (assessment && scoringResult) {
    return (
      <SingleAssessmentOverview
        assessment={assessment}
        scoringResult={scoringResult}
        variant={variant}
      />
    );
  }

  // Legacy comparison mode - keep existing comparison sections
  return (
    <>
      {/* Derived Metrics Comparison */}
      <div className="border-t border-(--color-border) pt-8 mt-8 first:border-0 first:pt-0 first:mt-0">
        <SectionHeading variant="small" icon={<Target className="w-4 h-4 text-(--color-accent)" />}>
          Derived Metrics
        </SectionHeading>

        <div className="space-y-0">
          {Object.entries(parameterLabels).map(([key, paramInfo]) => {
            const val1 = scoringResult1?.derived_metrics?.[key] || 0;
            const val2 = scoringResult2?.derived_metrics?.[key] || 0;
            const winner = val1 > val2 ? 1 : val2 > val1 ? 2 : null;
            return (
              <div
                key={key}
                className="flex justify-between items-center py-2.5 border-b border-(--color-border) last:border-0 text-sm"
              >
                <span className="text-(--color-text-muted)">{paramInfo.label}</span>
                <div className="flex items-center gap-4">
                  <span
                    className={`font-medium ${winner === 1 ? 'text-(--color-success)' : 'text-(--color-text-muted)'}`}
                  >
                    A1: {val1}
                  </span>
                  <span
                    className={`font-medium ${winner === 2 ? 'text-(--color-success)' : 'text-(--color-text-muted)'}`}
                  >
                    A2: {val2}
                  </span>
                </div>
              </div>
            );
          })}

          <div className="flex justify-between items-center py-2.5 border-b border-(--color-border) last:border-0 text-sm">
            <span className="text-(--color-text-muted)">Risk Level</span>
            <div className="flex items-center gap-4">
              <Chip
                variant="tag"
                className={`text-xs ${
                  scoringResult1?.derived_metrics?.risk_level === 'low'
                    ? 'text-(--color-success)'
                    : scoringResult1?.derived_metrics?.risk_level === 'medium'
                      ? 'text-(--color-warning)'
                      : 'text-(--color-error)'
                }`}
              >
                A1: {scoringResult1?.derived_metrics?.risk_level || 'N/A'}
              </Chip>
              <Chip
                variant="tag"
                className={`text-xs ${
                  scoringResult2?.derived_metrics?.risk_level === 'low'
                    ? 'text-(--color-success)'
                    : scoringResult2?.derived_metrics?.risk_level === 'medium'
                      ? 'text-(--color-warning)'
                      : 'text-(--color-error)'
                }`}
              >
                A2: {scoringResult2?.derived_metrics?.risk_level || 'N/A'}
              </Chip>
            </div>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      {insights && insights.length > 0 && (
        <div className="border-t border-(--color-border) pt-8 mt-8 first:border-0 first:pt-0 first:mt-0">
          <SectionHeading
            variant="small"
            icon={<Lightbulb className="w-4 h-4 text-(--color-accent)" />}
          >
            Key Insights
          </SectionHeading>

          <div className="space-y-4">
            {insights.map((insight, idx) => {
              const IconComponent = insight.icon;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-4 rounded-r-lg transition-all duration-200 hover:shadow-md border-l-4 ${
                    insight.type === 'positive'
                      ? 'border-l-(--color-success) bg-transparent text-(--color-text-primary)'
                      : insight.type === 'negative'
                        ? 'border-l-(--color-error) bg-transparent text-(--color-text-primary)'
                        : 'border-l-(--color-accent) bg-transparent text-(--color-text-primary)'
                  }`}
                >
                  <IconComponent className="shrink-0" strokeWidth={2.5} size={20} />
                  <p className="text-sm font-medium m-0">{insight.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Change Snapshot */}
      <div className="border-t border-(--color-border) pt-8 mt-8 first:border-0 first:pt-0 first:mt-0">
        <SectionHeading variant="small" icon={<Target className="w-4 h-4 text-(--color-accent)" />}>
          Scores & Change Snapshot
        </SectionHeading>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assessment 1 Score */}
          <div className="p-5 border border-(--color-border) rounded-lg hover:shadow-md transition-all duration-200">
            <p className="text-xs mb-2 font-semibold uppercase tracking-wide truncate text-(--color-text-muted)">
              {assessment1.title}
            </p>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-4xl font-bold ${
                  (scoringResult1?.overall_score || 0) >= 75
                    ? 'text-(--color-success)'
                    : (scoringResult1?.overall_score || 0) >= 50
                      ? 'text-(--color-warning)'
                      : 'text-(--color-error)'
                }`}
              >
                {scoringResult1?.overall_score || 0}
              </span>
              <span className="text-sm text-(--color-text-muted) font-medium">/100</span>
            </div>
            <div className="flex-1 rounded-full h-1.5 relative overflow-hidden bg-(--color-border) mt-2">
              <div
                className="h-1.5 rounded-full bg-(--color-accent)"
                style={{ width: `${scoringResult1?.overall_score || 0}%` }}
              />
            </div>
          </div>

          {/* Overall Delta */}
          <div className="p-5 border border-(--color-border) rounded-lg hover:shadow-md transition-all duration-200">
            <p className="text-xs mb-2 font-semibold uppercase tracking-wide truncate text-(--color-text-muted)">
              Overall Delta
            </p>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-4xl font-bold ${
                  (overallDelta || 0) > 0
                    ? 'text-(--color-success)'
                    : (overallDelta || 0) < 0
                      ? 'text-(--color-error)'
                      : 'text-(--color-text-muted)'
                }`}
              >
                {overallDelta > 0 ? '+' : ''}
                {overallDelta || 0}
              </span>
            </div>
            <p className="text-xs text-(--color-text-muted) font-medium mt-1">
              {biggestGain?.factor &&
                `Biggest gain: ${titleize(biggestGain.factor)} (+${biggestGain.delta})`}
            </p>
          </div>

          {/* Assessment 2 Score */}
          <div className="p-5 border border-(--color-border) rounded-lg hover:shadow-md transition-all duration-200">
            <p className="text-xs mb-2 font-semibold uppercase tracking-wide truncate text-(--color-text-muted)">
              {assessment2.title}
            </p>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-4xl font-bold ${
                  (scoringResult2?.overall_score || 0) >= 75
                    ? 'text-(--color-success)'
                    : (scoringResult2?.overall_score || 0) >= 50
                      ? 'text-(--color-warning)'
                      : 'text-(--color-error)'
                }`}
              >
                {scoringResult2?.overall_score || 0}
              </span>
              <span className="text-sm text-(--color-text-muted) font-medium">/100</span>
            </div>
            <div className="flex-1 rounded-full h-1.5 relative overflow-hidden bg-(--color-border) mt-2">
              <div
                className="h-1.5 rounded-full bg-(--color-accent)"
                style={{ width: `${scoringResult2?.overall_score || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

OverviewTab.propTypes = {
  // New single-assessment props
  assessment: PropTypes.object,
  scoringResult: PropTypes.object,
  variant: PropTypes.oneOf(['left', 'right']),

  // Legacy props for backward compatibility
  assessment1: PropTypes.object,
  assessment2: PropTypes.object,
  scoringResult1: PropTypes.object,
  scoringResult2: PropTypes.object,
  insights: PropTypes.array,
  overallDelta: PropTypes.number,
  biggestGain: PropTypes.object,
  biggestDrop: PropTypes.object,
  averageDelta: PropTypes.number,
};

export default OverviewTab;
