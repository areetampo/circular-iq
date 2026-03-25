import { Card, Chip } from '@heroui/react';
import PropTypes from 'prop-types';

import { formatFactorName } from '@/lib/scoring';

export function ParameterConsistencyCard({ actualResult }) {
  if (!actualResult?.parameter_consistency) return null;

  return (
    <Card
      className="border rounded-xl card-lift"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
              Self-Assessment Reliability
            </h3>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Internal consistency of your 8 parameter scores
            </p>
          </div>
          <div className="text-right">
            <div
              className="text-3xl font-bold"
              style={{
                color:
                  actualResult.parameter_consistency.score >= 85
                    ? 'var(--success)'
                    : actualResult.parameter_consistency.score >= 65
                      ? 'var(--info)'
                      : actualResult.parameter_consistency.score >= 40
                        ? 'var(--warning)'
                        : 'var(--danger)',
              }}
            >
              {actualResult.parameter_consistency.score}
              <span className="text-sm" style={{ color: 'var(--muted)' }}>
                /100
              </span>
            </div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>
              {actualResult.parameter_consistency.rating} Consistency
            </div>
          </div>
        </div>
        <p className="text-sm mb-3" style={{ color: 'var(--foreground)' }}>
          {actualResult.parameter_consistency.interpretation}
        </p>
        {actualResult.parameter_consistency.issues.length > 0 && (
          <div className="space-y-2">
            {actualResult.parameter_consistency.issues.map((issue, i) => (
              <div
                key={i}
                className="p-2 border rounded-lg"
                style={{ backgroundColor: 'var(--warning-soft)', borderColor: 'var(--warning)' }}
              >
                <p className="text-xs" style={{ color: 'var(--warning)' }}>
                  {issue.issue}
                </p>
                <div className="flex gap-1 mt-1">
                  {issue.factors.map((f) => (
                    <Chip
                      key={f}
                      size="sm"
                      variant="soft"
                      className="text-xs"
                      style={{ backgroundColor: 'var(--warning-soft)', color: 'var(--warning)' }}
                    >
                      {formatFactorName(f)}
                    </Chip>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

ParameterConsistencyCard.propTypes = {
  actualResult: PropTypes.object,
};

export default ParameterConsistencyCard;
