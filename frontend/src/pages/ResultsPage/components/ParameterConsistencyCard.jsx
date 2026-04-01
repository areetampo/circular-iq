import PropTypes from 'prop-types';

import { Chip } from '@/components/common';
import { formatFactorName } from '@/lib/scoring';

import ScoreCard from './ScoreCard';

export function ParameterConsistencyCard({ actualResult }) {
  if (!actualResult?.parameter_consistency) return null;

  const { score, rating, interpretation, issues } = actualResult.parameter_consistency;

  const getScoreColor = (score) => {
    if (score >= 85) return '#6b8f71';
    if (score >= 65) return '#7a9eb5';
    if (score >= 40) return '#d4b896';
    return '#c4956a';
  };

  return (
    <ScoreCard
      title="Self-Assessment Reliability"
      description="Internal consistency of your 8 parameter scores"
      score={score}
      rating={`${rating} Consistency`}
      message={interpretation}
      scoreColor={getScoreColor(score)}
    >
      {issues.length > 0 && (
        <div className="space-y-2 mt-3">
          {issues.map((issue, i) => (
            <div
              key={i}
              className="p-2 border rounded-lg bg-(--color-warning-soft) border-(--color-warning)"
            >
              <p className="text-xs text-(--color-warning)">{issue.issue}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {issue.factors.map((f) => (
                  <Chip key={f} variant="tag" className="text-xs">
                    {formatFactorName(f)}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </ScoreCard>
  );
}

ParameterConsistencyCard.propTypes = {
  actualResult: PropTypes.object,
};

export default ParameterConsistencyCard;
