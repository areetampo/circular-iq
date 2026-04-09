import PropTypes from 'prop-types';

import { SectionHeading } from '@/components/common';
import { categoryMapping, validKeys } from '@/constants/evaluationData';
import { cn } from '@/utils/cn';

export function CategoryAnalysis({ actualResult, resolvedBusinessViabilityScore }) {
  const getScoreColor = (numValue) => {
    return numValue >= 75
      ? '#4a7c59' // muted green
      : numValue >= 50
        ? '#b07d3a' // muted amber
        : '#8b3a3a'; // muted red
  };

  return (
    <div className="rounded-3xl border-2 border-(--color-border) bg-transparent">
      <div className="p-1 sm:p-3">
        <SectionHeading variant="large">Category Analysis</SectionHeading>
        <p className="-mt-4 mb-4 pl-2 text-sm text-(--color-text-muted)">
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
                className="rounded-2xl border-2 border-[rgba(180,160,130,0.18)] bg-[rgba(245,240,232,0.5)] p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-(--color-text-primary)">
                      {category.name}
                    </h4>
                    <p className="mt-0.5 text-xs text-(--color-text-muted)">{category.desc}</p>
                  </div>
                  <div
                    className={`ml-4 rounded-lg border border-[rgba(180,160,130,0.18)] bg-transparent px-3 py-1 text-sm font-bold text-[${badgeColor}]`}
                  >
                    {numValue}
                  </div>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(180,160,130,0.2)]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      numValue >= 75 ? 'opacity-70' : 'opacity-60'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(0, numValue))}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
          {/* Business Viability Category */}
          <div className="rounded-2xl border border-[rgba(180,160,130,0.18)] bg-[rgba(245,240,232,0.5)] p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-(--color-text-primary)">
                  Business Viability
                </h4>
                <p className="mt-0.5 text-xs text-(--color-text-muted)">
                  Economic feasibility and scalability
                </p>
              </div>
              <div
                className={`ml-4 rounded-lg border border-[rgba(180,160,130,0.18)] bg-transparent px-3 py-1 text-sm font-bold text-[${getScoreColor(resolvedBusinessViabilityScore)}]`}
              >
                {resolvedBusinessViabilityScore}
              </div>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(180,160,130,0.2)]">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  resolvedBusinessViabilityScore >= 75 ? 'opacity-70' : 'opacity-60',
                )}
                style={{
                  width: `${resolvedBusinessViabilityScore}%`,
                  backgroundColor: getScoreColor(resolvedBusinessViabilityScore),
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
