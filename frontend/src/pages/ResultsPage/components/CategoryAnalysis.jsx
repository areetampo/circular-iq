import PropTypes from 'prop-types';

import { SectionHeading } from '@/components/common/SectionHeading';
import { categoryMapping, validKeys } from '@/constants/evaluationData';

export function CategoryAnalysis({ actualResult, resolvedBusinessViabilityScore }) {
  const getScoreColor = (numValue) => {
    return numValue >= 75
      ? '#4a7c59' // muted green
      : numValue >= 50
        ? '#b07d3a' // muted amber
        : '#8b3a3a'; // muted red
  };

  return (
    <div className="border-2 border-[rgba(180,160,130,0.25)] rounded-3xl bg-transparent">
      <div className="p-1 sm:p-3">
        <SectionHeading variant="large">Category Analysis</SectionHeading>
        <p className="text-sm text-(--color-text-muted) mb-4 -mt-4">
          Detailed breakdown across all evaluation criteria
        </p>
        <div className="space-y-3">
          {validKeys.map((key) => {
            const value = actualResult.sub_scores?.[key];
            if (!(actualResult.sub_scores && key in actualResult.sub_scores)) return null;

            const category = categoryMapping[key];
            if (!category) return null;

            const numValue = value != null && !isNaN(value) ? Number(value) : 0;
            const barColor = getScoreColor(numValue);
            const badgeColor = getScoreColor(numValue);

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
                  color: getScoreColor(resolvedBusinessViabilityScore),
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
                  backgroundColor: getScoreColor(resolvedBusinessViabilityScore),
                  opacity: resolvedBusinessViabilityScore >= 75 ? 0.7 : 0.6,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

CategoryAnalysis.propTypes = {
  actualResult: PropTypes.object,
  resolvedBusinessViabilityScore: PropTypes.number,
};

export default CategoryAnalysis;
