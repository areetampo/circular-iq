import { TrendingUp } from 'lucide-react';
import PropTypes from 'prop-types';

import { Chip, SectionHeading } from '@/components/common';
import { parameterGroups } from '@/constants/evaluationData';
import { DEFAULT_CONFIG, GROUP_STYLE_CONFIG } from '@/constants/groupStyleConfig';
import { formatFactorName } from '@/lib/scoring';
import { cn } from '@/utils/cn';

export function WeightedScoreCard({ actualResult }) {
  if (!actualResult?.weighted_score_card) return null;

  return (
    <div className="mt-8 border-t border-border pt-8">
      <SectionHeading
        variant="small"
        icon={<TrendingUp className="size-4 text-(--color-accent)" />}
      >
        Score Contribution Breakdown
      </SectionHeading>

      {/* Description */}
      <p className="mb-6 text-(--color-text-secondary)">
        How each factor contributed to your overall score of{' '}
        <span className="font-mono text-(--color-text-primary)">
          {actualResult.overall_score}/100
        </span>
      </p>

      {/* Factors list */}
      <div className="space-y-3">
        {Object.entries(actualResult.weighted_score_card.factors)
          .sort(([, a], [, b]) => b.contribution - a.contribution)
          .map(([key, factor]) => (
            <div
              key={key}
              className="flex items-center gap-3 border-b border-border py-2 last:border-0"
            >
              <div
                className={cn(
                  'inline-flex items-center gap-2 rounded-2xl px-1.5 py-0.5',
                  'border-[1.5px] text-[0.68rem] font-bold tracking-[0.08rem] uppercase',
                  (() => {
                    const category = Object.entries(parameterGroups).find(([, factors]) =>
                      factors.includes(key),
                    )?.[0];
                    const cfg = GROUP_STYLE_CONFIG[category] || DEFAULT_CONFIG;
                    return cn(cfg.paramBg, cfg.paramTextColor, cfg.paramBorder);
                  })(),
                )}
              >
                {formatFactorName(key)}
              </div>
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                <div
                  className={cn(
                    'h-1.5 rounded-full',
                    (() => {
                      const category = Object.entries(parameterGroups).find(([, factors]) =>
                        factors.includes(key),
                      )?.[0];
                      const cfg = GROUP_STYLE_CONFIG[category] || DEFAULT_CONFIG;
                      return cfg.paramTextColor.replace('text-', 'bg-');
                    })(),
                  )}
                  style={{ width: `${factor.raw_score}%` }}
                />
              </div>
              <div className="w-8 shrink-0 text-right font-mono text-sm text-(--color-text-primary)">
                {factor.raw_score}
              </div>
              <div className="w-10 shrink-0 text-right text-sm text-(--color-text-muted)">
                +{factor.contribution}
              </div>
              <Chip variant="factor" className="shrink-0">
                {factor.classification}
              </Chip>
            </div>
          ))}
      </div>

      {/* Bottom summary */}
      <div className="mt-6 flex justify-between border-t border-border pt-4 text-sm text-(--color-text-muted) [&>span]:font-medium [&>span>span]:font-semibold [&>span>span]:text-(--color-text-primary)">
        <span>
          Top contributor:{' '}
          <span>{formatFactorName(actualResult.weighted_score_card.top_contributor)}</span>
        </span>
        <span>
          Needs most attention:{' '}
          <span>{formatFactorName(actualResult.weighted_score_card.bottom_contributor)}</span>
        </span>
      </div>
    </div>
  );
}

WeightedScoreCard.propTypes = {
  actualResult: PropTypes.object,
};

export default WeightedScoreCard;
