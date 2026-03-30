import { Card } from '@heroui/react';

import { Chip } from '@/components/common';
import { formatFactorName } from '@/lib/scoring';

export default function ParameterConsistencyCard({ scoringResult }) {
  if (!scoringResult?.parameter_consistency) return null;

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
              style={{
                color:
                  scoringResult.parameter_consistency.score >= 85
                    ? 'var(--success)'
                    : scoringResult.parameter_consistency.score >= 65
                      ? 'var(--info)'
                      : scoringResult.parameter_consistency.score >= 40
                        ? 'var(--warning)'
                        : 'var(--danger)',
              }}
            >
              {scoringResult.parameter_consistency.score}
              <span style={{ color: 'var(--muted)' }} className="text-sm">
                /100
              </span>
            </div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>
              {scoringResult.parameter_consistency.rating} Consistency
            </div>
          </div>
        </div>
        <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
          {scoringResult.parameter_consistency.interpretation}
        </p>
        {scoringResult.parameter_consistency.issues?.length > 0 && (
          <div className="space-y-2">
            {scoringResult.parameter_consistency.issues.map((issue, i) => (
              <div
                key={i}
                className="p-2 rounded-lg"
                style={{
                  backgroundColor: 'var(--warning-soft)',
                  borderColor: 'var(--warning)',
                  border: '1px solid',
                }}
              >
                <p className="text-xs" style={{ color: 'var(--warning)' }}>
                  {issue.issue}
                </p>
                <div className="flex gap-1 mt-1">
                  {issue.factors?.map((f) => (
                    <Chip
                      key={f}
                      variant="default"
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
