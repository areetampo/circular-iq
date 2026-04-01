import { Globe, Lock } from 'lucide-react';
import PropTypes from 'prop-types';

import { Chip } from '@/components/common';
import { titleize } from '@/lib/formatting';

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
    <div className="border-t border-(--color-border) pt-8 mt-8">
      {/* Assessment Name and Meta Info */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-lg sm:text-xl font-bold text-(--color-text-primary)">
              {actualResult.metadata?.short_description || 'Circular Economy Assessment'}
            </h2>
            {isViewFromMyAssessments && currentData && (
              <Chip variant="tag" className="gap-1 ml-1">
                {(optimisticIsPublic !== null ? optimisticIsPublic : currentData.is_public) ===
                false ? (
                  <>
                    <Lock size={12} />
                    Private
                  </>
                ) : (
                  <>
                    <Globe size={12} />
                    Public
                  </>
                )}
              </Chip>
            )}
          </div>
          <div className="flex gap-4 text-sm text-(--color-text-secondary)">
            {actualResult.metadata?.industry && (
              <span>{titleize(actualResult.metadata.industry)}</span>
            )}
            {actualResult.metadata?.assessment_date && (
              <span>{new Date(actualResult.metadata.assessment_date).toLocaleDateString()}</span>
            )}
            {actualResult.confidence_level && (
              <span>{actualResult.confidence_level}% Confidence</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Score Display */}
      <div className="text-center mb-8">
        <div className="text-7xl font-bold text-(--color-text-primary)">{overallScore || 0}</div>
        <div className="text-2xl text-(--color-text-muted)">/100</div>
        <div className="text-sm text-(--color-text-muted) uppercase tracking-widest mt-2">
          Circularity Score
        </div>
        {actualResult.metadata?.short_description && (
          <p className="font-semibold text-lg text-(--color-text-primary) leading-snug mb-2 mt-6 max-w-2xl mx-auto">
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
