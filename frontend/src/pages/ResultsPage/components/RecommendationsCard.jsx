/**
 * @module RecommendationsCard
 * @description Bulleted technical recommendations from the scoring audit (with defaults when empty).
 */

import PropTypes from 'prop-types';

import { SectionHeading } from '@/components/common';

/**
 * Renders audit `technical_recommendations` or sensible defaults when none exist.
 *
 * @param {Object} props
 * @param {Object} props.actualResult - Scoring result containing `audit.technical_recommendations`.
 * @returns {import('react').ReactElement}
 */
export default function RecommendationsCard({ actualResult }) {
  return (
    <div className="rounded-3xl border-2 border-(--color-border-ui) bg-transparent">
      <div className="p-2 sm:p-4">
        <SectionHeading variant="small" className="mb-6">
          Recommendations
        </SectionHeading>
        <p className="-mt-4 mb-4 text-sm text-(--color-text-muted)">
          Targeted steps to improve your circularity score
        </p>

        <div className="rounded-xl bg-blue-400/15 p-4">
          <ul className="space-y-3 text-sm">
            {actualResult.audit?.technical_recommendations?.length > 0
              ? actualResult.audit.technical_recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="mt-0.5 font-semibold text-(--color-accent)">•</span>
                    <span className="text-(--color-text-primary)">{rec}</span>
                  </li>
                ))
              : [
                  'Consider incorporating predictive maintenance strategies',
                  'Explore partnerships with recycling facilities',
                  'Develop metrics for tracking circularity performance',
                ].map((recommendation, i) => (
                  <li key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="mt-0.5 font-semibold text-(--color-accent)">•</span>
                    <span className="text-(--color-text-primary)">{recommendation}</span>
                  </li>
                ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

RecommendationsCard.propTypes = {
  actualResult: PropTypes.object,
};
