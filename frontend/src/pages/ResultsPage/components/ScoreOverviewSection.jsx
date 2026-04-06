import PropTypes from 'prop-types';

import { formatProcessingTime, titleize } from '@/lib/formatting';

export function ScoreOverviewSection({
  actualResult,
  overallScore,
  casesSummaries,
  strengths,
  gaps,
  isViewFromMyAssessments,
  currentData,
  optimisticIsPublic,
  topFactor,
  focusFactor,
  avgFactorScore,
  resolvedBusinessViabilityScore,
  reportTips,
}) {
  return (
    <div className="mt-8">
      {/* Industry and Confidence Row */}
      <div className="flex justify-center gap-4 mb-6">
        {[
          actualResult.metadata?.industry && {
            label: titleize(actualResult.metadata.industry),
          },
          actualResult.confidence_level && {
            label: `${actualResult.confidence_level}% Confidence`,
          },
          actualResult.processing_info?.processing_time_ms && {
            label: `Analysed in ${formatProcessingTime(actualResult.processing_info.processing_time_ms)}`,
          },
        ]
          .filter(Boolean)
          .map((badge, index) => (
            <div
              key={index}
              className="px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: 'var(--color-accent-light)' }}
            >
              <span className="text-sm font-medium text-(--color-text-primary)">{badge.label}</span>
            </div>
          ))}
      </div>

      {/* Main Score Display */}
      <div className="text-center mb-8">
        <div className="font-(--font-mono) text-[4.5rem] font-light text-(--color-text-primary) tracking-[-0.04em]">
          {overallScore || 0}
        </div>
        <div className="text-2xl text-(--color-text-muted)">/100</div>
        <div className="text-sm text-(--color-text-muted) uppercase tracking-widest mt-2">
          Circularity Score
        </div>
        {actualResult.metadata?.short_description && (
          <p className="font-sans text-[1.25rem] text-(--color-text-primary) leading-[1.4] not-italic mb-2 mt-6 max-w-2xl mx-auto">
            {actualResult.metadata.short_description}
          </p>
        )}
      </div>

      {/* Score Summary Stats */}
      <div className="flex gap-6 justify-center mb-8">
        <div className="text-sm text-(--color-text-secondary)">
          High • Strong Performance • {actualResult.confidence_level || 0}% Confidence
        </div>
      </div>

      {/* Audit verdict if present */}
      {actualResult.audit?.audit_verdict && (
        <div className="border-l-2 border-(--color-accent) pl-3 py-1 text-sm text-(--color-text-secondary) leading-relaxed mb-4">
          {actualResult.audit.audit_verdict}
        </div>
      )}

      {/* Comparative analysis if present */}
      {actualResult.audit?.comparative_analysis && (
        <div className="border-l-2 border-(--color-accent) pl-3 py-1 text-sm text-(--color-text-secondary) leading-relaxed mb-4">
          <p className="text-xs font-semibold uppercase mb-1 text-(--color-accent)">Key Finding</p>
          {actualResult.audit.comparative_analysis}
        </div>
      )}

      {/* Strongest Factor and Focus Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {topFactor && (
          <div className="border-2 border-[rgba(180,160,130,0.25)] rounded-[12px] p-4 bg-transparent">
            <div className="text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-(--color-text-muted) mb-1">
              Strongest Factor
            </div>
            <div className="text-[0.875rem] font-semibold text-(--color-accent)">{topFactor[0]}</div>
            <div className="text-[0.75rem] text-(--color-text-muted)">Score: {topFactor[1]}</div>
          </div>
        )}

        {focusFactor && (
          <div className="border-2 border-[rgba(180,160,130,0.25)] rounded-[12px] p-4 bg-transparent">
            <div className="text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-(--color-text-muted) mb-1">
              Focus Area
            </div>
            <div className="text-[0.875rem] font-semibold text-(--color-accent)">{focusFactor[0]}</div>
            <div className="text-[0.75rem] text-(--color-text-muted)">Score: {focusFactor[1]}</div>
          </div>
        )}
      </div>
    </div>
  );
}

ScoreOverviewSection.propTypes = {
  actualResult: PropTypes.object.isRequired,
  overallScore: PropTypes.number.isRequired,
  casesSummaries: PropTypes.arrayOf(PropTypes.string),
  strengths: PropTypes.array,
  gaps: PropTypes.array,
  isViewFromMyAssessments: PropTypes.bool,
  currentData: PropTypes.object,
  optimisticIsPublic: PropTypes.bool,
  topFactor: PropTypes.array,
  focusFactor: PropTypes.array,
  avgFactorScore: PropTypes.number.isRequired,
  resolvedBusinessViabilityScore: PropTypes.number.isRequired,
  reportTips: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      description: PropTypes.string,
      Icon: PropTypes.elementType,
      iconClassName: PropTypes.string,
    }),
  ).isRequired,
};

export default ScoreOverviewSection;
