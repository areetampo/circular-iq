import PropTypes from 'prop-types';

import { SectionHeading } from '@/components/common';
import { categoryMapping, validKeys } from '@/constants/evaluationData';
import { cn } from '@/utils/cn';

export function CategoryAnalysis({ actualResult, resolvedBusinessViabilityScore }) {
  const getScoreColor = (numValue) => {
    return numValue >= 75
      ? 'var(--color-success)' // green
      : numValue >= 50
        ? 'var(--color-warning)' // amber
        : 'var(--color-error)'; // red
  };

  return (
    <div className="rounded-3xl border-2 border-(--color-border-ui) bg-transparent">
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
                className="rounded-2xl border-2 border-(--color-border-card) bg-(--color-bg-card-light) p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-(--color-text-primary)">
                      {category.name}
                    </h4>
                    <p className="mt-0.5 text-sm text-(--color-text-muted)">{category.desc}</p>
                  </div>
                  <div
                    className="ml-4 rounded-lg bg-transparent px-3 py-1 text-lg font-medium"
                    style={{ color: badgeColor }}
                  >
                    {numValue}
                  </div>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-(--color-progress-track)">
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
          <div className="rounded-2xl border-2 border-(--color-border-card) bg-(--color-bg-card-light) p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-(--color-text-primary)">
                  Business Viability
                </h4>
                <p className="mt-0.5 text-sm text-(--color-text-muted)">
                  Economic feasibility and scalability
                </p>
              </div>
              <div
                className="ml-4 rounded-lg border border-(--color-border-card) bg-transparent px-3 py-1 text-lg font-medium"
                style={{ color: getScoreColor(resolvedBusinessViabilityScore) }}
              >
                {resolvedBusinessViabilityScore}
              </div>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-(--color-progress-track)">
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
