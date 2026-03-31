import { PieChart } from 'lucide-react';
import PropTypes from 'prop-types';

import { Chip } from '@/components/common';

export function ScoreCategoryBreakdown({ actualResult }) {
  if (!actualResult?.score_breakdown) return null;

  return (
    <div className="border-t border-(--color-border) pt-8 mt-8">
      {/* Section heading with icon */}
      <div className="flex items-center gap-2 mb-6">
        <PieChart className="w-4 h-4 text-(--color-accent)" />
        <h3 className="text-xs uppercase tracking-widest text-(--color-text-muted)">
          Score Breakdown
        </h3>
      </div>

      {/* Description */}
      <p className="text-sm text-(--color-text-secondary) mb-6">
        Detailed breakdown by value category
      </p>

      {/* Category grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(actualResult.score_breakdown).map(([category, data]) => (
          <div key={category} className="border border-(--color-border) rounded-md p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-(--color-text-primary)">{category}</div>
              <div className="text-sm font-mono text-(--color-text-primary)">{data.score}</div>
            </div>
            <div className="text-xs text-(--color-text-muted) mb-3">{data.weight}</div>
            <p className="text-xs text-(--color-text-secondary) mb-4 leading-relaxed">
              {data.description}
            </p>
            <div className="space-y-1">
              {data.factors?.map((factor, i) => (
                <Chip key={i} variant="tag" className="text-xs">
                  {factor.name}: {factor.score}
                </Chip>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

ScoreCategoryBreakdown.propTypes = {
  actualResult: PropTypes.object,
};

export default ScoreCategoryBreakdown;
