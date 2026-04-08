import PropTypes from 'prop-types';

import { SectionHeading } from '@/components/common';

export function RecommendationsCard({ actualResult }) {
  return (
    <div className="rounded-3xl border-2 border-[rgba(180,160,130,0.25)] bg-transparent">
      <div className="p-2 sm:p-4">
        <SectionHeading variant="small" className="mb-6">
          Recommendations
        </SectionHeading>
        <p className="-mt-4 mb-4 text-sm text-(--color-text-muted)">
          Targeted steps to improve your circularity score
        </p>

        <div className="rounded-xl border-0 border-(--color-accent) bg-accent-soft/50 p-4">
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

export default RecommendationsCard;
