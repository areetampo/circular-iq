import PropTypes from 'prop-types';

import { SectionHeading } from '@/components/common/SectionHeading';

export function RecommendationsCard({ actualResult }) {
  return (
    <div className="border-2 border-[rgba(180,160,130,0.25)] rounded-3xl bg-transparent">
      <div className="p-2 sm:p-4">
        <SectionHeading variant="small" className="mb-6">
          Recommendations
        </SectionHeading>
        <p className="text-sm mb-4 -mt-4" style={{ color: 'var(--muted)' }}>
          Targeted steps to improve your circularity score
        </p>

        <div
          className="p-4 rounded-xl border-0"
          style={{
            background: 'linear-gradient(to bottom right, var(--accent-soft), var(--accent-soft))',
            borderColor: 'var(--accent)',
          }}
        >
          <ul className="space-y-3 text-sm">
            {actualResult.audit?.technical_recommendations?.length > 0 ? (
              actualResult.audit.technical_recommendations.map((rec, i) => (
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
  );
}

RecommendationsCard.propTypes = {
  actualResult: PropTypes.object,
};

export default RecommendationsCard;
