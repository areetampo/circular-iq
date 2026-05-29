/**
 * Hero score overview (overall score, tier, confidence) on Results.
 */

import PropTypes from 'prop-types';

import { formatDuration, toTitleCase } from '@/lib/formatting';

/**
 * Hero block: industry, confidence, processing time, overall score, top and focus factors.
 */
export default function ScoreOverviewSection({
  actualResult,
  overallScore,
  topFactor,
  focusFactor,
  ...props
}) {
  return (
    <div {...props} className="mt-8">
      {/* Industry and Confidence Row */}
      <div className="mb-6 flex justify-center gap-4">
        {[
          actualResult.metadata?.industry && {
            label: toTitleCase(actualResult.metadata.industry),
          },
          actualResult.confidence_level && {
            label: `${actualResult.confidence_level}% Confidence`,
          },
          actualResult.processing_info?.processing_time_ms && {
            label: `Analysed in — ${formatDuration({ ms: actualResult.processing_info.processing_time_ms, combineSecAndMs: true })}`,
          },
        ]
          .filter(Boolean)
          .map((badge, index) => (
            <div key={index} className="rounded-lg bg-(--color-accent-light) px-3 py-1.5">
              <span className="text-sm font-medium text-(--color-text-primary)">{badge.label}</span>
            </div>
          ))}
      </div>

      {/* Main Score Display */}
      <div className="mb-8 text-center">
        <div className="font-mono text-[4.5rem] font-light tracking-[-0.04em] text-(--color-text-primary)">
          {overallScore || 0}
        </div>
        <div className="text-2xl text-(--color-text-muted)">/100</div>
        <div className="mt-2 text-sm tracking-widest text-(--color-text-muted) uppercase">
          Circularity Score
        </div>
        {actualResult.metadata?.short_description && (
          <p className="mx-auto mt-6 mb-2 max-w-2xl font-sans text-[1.25rem] leading-[1.4] text-(--color-text-primary) not-italic">
            {actualResult.metadata.short_description}
          </p>
        )}
      </div>

      {/* Score Summary Stats */}
      <div className="mb-8 flex justify-center gap-6">
        <div className="text-sm text-(--color-text-secondary)">
          High • Strong Performance • {actualResult.confidence_level || '-'}% Confidence
        </div>
      </div>

      {/* Audit verdict if present */}
      {actualResult.audit?.audit_verdict && (
        <div className="mb-4 border-l-2 border-(--color-accent) py-1 pl-3 text-sm/relaxed text-(--color-text-secondary)">
          {actualResult.audit.audit_verdict}
        </div>
      )}

      {/* Comparative analysis if present */}
      {actualResult.audit?.comparative_analysis && (
        <div className="mb-4 border-l-2 border-(--color-accent) py-1 pl-3 text-sm/relaxed text-(--color-text-secondary)">
          <p className="mb-1 text-xs font-semibold text-(--color-accent) uppercase">Key Finding</p>
          {actualResult.audit.comparative_analysis}
        </div>
      )}

      {/* Strongest Factor and Focus Area */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {[
          { title: 'Strongest Factor', data: topFactor },
          { title: 'Focus Area', data: focusFactor },
        ].map(
          ({ title, data }) =>
            data && (
              <div
                key={title}
                className="rounded-xl border-2 border-(--color-border-ui) bg-transparent p-4"
              >
                <div className="mb-1 text-sm font-semibold tracking-widest text-black/50 uppercase">
                  {title}
                </div>
                <div className="font-semibold text-(--color-accent)">{data[0]}</div>
                <div className="font-medium text-(--color-text-muted)">Score: {data[1]}</div>
              </div>
            ),
        )}
      </div>
    </div>
  );
}

ScoreOverviewSection.propTypes = {
  actualResult: PropTypes.object.isRequired,
  overallScore: PropTypes.number.isRequired,
  topFactor: PropTypes.array,
  focusFactor: PropTypes.array,
};
