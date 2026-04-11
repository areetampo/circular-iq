import { PieChart } from 'lucide-react';
import PropTypes from 'prop-types';

import { SectionHeading } from '@/components/common';
import { parameterGroups } from '@/constants/evaluationData';
import { DEFAULT_CONFIG, GROUP_STYLE_CONFIG } from '@/constants/groupStyleConfig';
import { cn } from '@/utils/cn';

export function ScoreCategoryBreakdown({ actualResult }) {
  if (!actualResult?.score_breakdown) return null;

  return (
    <div className="mt-8 border-t border-border pt-8">
      <SectionHeading variant="small" icon={<PieChart className="size-4 text-(--color-accent)" />}>
        Score Breakdown
      </SectionHeading>

      {/* Description */}
      <p className="mb-6 text-sm text-(--color-text-secondary)">
        Detailed breakdown by value category
      </p>

      {/* Category grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {Object.entries(actualResult.score_breakdown).map(([category, data]) => (
          <div key={category} className="rounded-xl border-2 border-border p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-(--color-text-primary)">{category}</div>
              <div className="text-lg font-medium text-(--color-text-primary)">{data.score}</div>
            </div>
            <div className="mb-3 text-sm text-(--color-text-muted)">({data.weight})</div>
            <p className="mb-4 text-xs/relaxed text-(--color-text-secondary)">{data.description}</p>
            <div className="space-y-1 space-x-2">
              {data.factors?.map((factor, i) => (
                <div
                  key={i}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-2xl px-1.5 py-0.5',
                    'border-[1.5px] text-[0.68rem] font-bold tracking-[0.08rem] uppercase',
                    (() => {
                      const categoryParam = Object.entries(parameterGroups).find(([, factors]) =>
                        factors.includes(factor.name),
                      )?.[0];
                      const cfg = GROUP_STYLE_CONFIG[categoryParam] || DEFAULT_CONFIG;
                      return cn(cfg.paramBg, cfg.paramTextColor, cfg.paramBorder);
                    })(),
                  )}
                >
                  {factor.name}: {factor.score}
                </div>
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
