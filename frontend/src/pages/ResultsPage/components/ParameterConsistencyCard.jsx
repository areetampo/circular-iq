import PropTypes from 'prop-types';

import { Chip } from '@/components/common';
import { formatFactorName } from '@/lib/scoring';

import ScoreCard from './ScoreCard';

/**
 * ParameterConsistencyCard - Component displaying parameter consistency analysis
 * Shows internal consistency score, rating, interpretation, and identified issues
 *
 * @param {Object} props - Component props
 * @param {Object} props.actualResult - Assessment result object containing parameter consistency data
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element|null} Rendered ParameterConsistencyCard or null if no data
 *
 * @example
 * Basic usage
 * <ParameterConsistencyCard actualResult={assessmentResult} />
 *
 * @example
 * With missing data
 * <ParameterConsistencyCard actualResult={null} />
 */
export default function ParameterConsistencyCard({ actualResult, ...props }) {
  if (!actualResult?.parameter_consistency) return null;

  const { score, rating, interpretation, issues } = actualResult.parameter_consistency;

  const getScoreColor = (score) => {
    if (score >= 85) return 'var(--color-parameter-high)';
    if (score >= 65) return 'var(--color-parameter-mid)';
    if (score >= 40) return 'var(--color-parameter-low)';
    return 'var(--color-parameter-fail)';
  };

  return (
    <ScoreCard
      title="Self-Assessment Reliability"
      description="Internal consistency of your 8 parameter scores"
      score={score}
      rating={`${rating} Consistency`}
      message={interpretation}
      scoreColor={getScoreColor(score)}
      {...props}
    >
      {issues.length > 0 && (
        <div className="space-y-2">
          {issues.map((issue, i) => (
            <div key={i} className="rounded-xl bg-(--color-warning-soft-mid) px-4 py-2">
              <p className="text-sm">{issue.issue}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {issue.factors.map((f) => (
                  <Chip key={f} variant="factor" className="text-xs">
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
