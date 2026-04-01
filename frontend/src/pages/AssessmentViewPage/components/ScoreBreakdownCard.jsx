import PropTypes from 'prop-types';

import { Chip } from '@/components/common';

export default function ScoreBreakdownCard({ scoringResult }) {
  if (!scoringResult?.score_breakdown) return null;

  return (
    <div className="border-t border-(--color-border) pt-8 mt-8">
      <h3 className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-6">
        Score Breakdown
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(scoringResult.score_breakdown).map(([category, data]) => (
          <div key={category} className="p-4 border border-(--color-border) rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-bold text-(--color-text-primary)">{category}</div>
              <div className="text-sm font-bold text-(--color-text-primary)">{data.score}</div>
            </div>
            <div className="text-xs mb-2 text-(--color-text-muted)">{data.weight}</div>
            <p className="text-xs mb-3 text-(--color-text-muted)">{data.description}</p>
            <div className="flex flex-wrap gap-1">
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

ScoreBreakdownCard.propTypes = {
  scoringResult: PropTypes.object.isRequired,
};
