import PropTypes from 'prop-types';

import { Chip } from '@/components/common';
import { formatFactorName } from '@/lib/scoring';

export default function ParameterConsistencyCard({ scoringResult }) {
  if (!scoringResult?.parameter_consistency) return null;

  return (
    <div className="border-t border-(--color-border) pt-8 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-1">
            Self-Assessment Reliability
          </h3>
          <p className="text-sm text-(--color-text-secondary)">
            Internal consistency of your 8 parameter scores
          </p>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl text-(--color-text-primary)">
            {scoringResult.parameter_consistency.score}
            <span className="text-sm text-(--color-text-muted)">/100</span>
          </div>
          <div className="text-xs text-(--color-text-muted)">
            {scoringResult.parameter_consistency.rating} Consistency
          </div>
        </div>
      </div>

      <div className="text-sm text-(--color-text-secondary) leading-relaxed mb-4">
        {scoringResult.parameter_consistency.interpretation}
      </div>

      {scoringResult.parameter_consistency.issues?.length > 0 && (
        <div className="space-y-2">
          {scoringResult.parameter_consistency.issues.map((issue, i) => (
            <div
              key={i}
              className="p-3 border-l-2 border-(--color-accent) bg-(--color-accent-light) rounded-r-sm"
            >
              <p className="text-xs text-(--color-text-secondary)">{issue.issue}</p>
              <div className="flex gap-1 mt-1">
                {issue.factors?.map((f) => (
                  <Chip key={f} variant="tag">
                    {formatFactorName(f)}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

ParameterConsistencyCard.propTypes = {
  scoringResult: PropTypes.object.isRequired,
};
