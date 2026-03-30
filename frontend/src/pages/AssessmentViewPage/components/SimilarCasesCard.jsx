import { Card } from '@heroui/react';
import PropTypes from 'prop-types';

import { Chip } from '@/components/common';

export default function SimilarCasesCard({ scoringResult }) {
  if (!scoringResult?.similar_cases || scoringResult.similar_cases.length === 0) return null;

  return (
    <Card
      className="border rounded-xl"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="p-4">
        <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          Similar Cases
        </h3>
        <div className="space-y-4">
          {scoringResult.similar_cases.map((caseItem, index) => {
            const summary = scoringResult.audit?.similar_cases_summaries?.[index];
            const similarity = Math.round((caseItem.similarity || 0) * 100);
            const barColor =
              similarity >= 80
                ? 'var(--success)'
                : similarity >= 60
                  ? 'var(--info)'
                  : 'var(--warning)';

            return (
              <div
                key={index}
                className="p-4 border rounded-lg"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                      {caseItem.title || `Case ${index + 1}`}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {caseItem.industry && (
                        <Chip variant="default" className="text-xs">
                          {caseItem.industry}
                        </Chip>
                      )}
                      {caseItem.category && (
                        <Chip variant="default" className="text-xs">
                          {caseItem.category}
                        </Chip>
                      )}
                    </div>
                  </div>
                  <Chip
                    variant="default"
                    className="text-xs shrink-0"
                    style={{
                      color: barColor,
                    }}
                  >
                    {similarity}% match
                  </Chip>
                </div>
                {summary && (
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
                    {summary}
                  </p>
                )}

                {/* Problem preview */}
                {caseItem.problem && !summary && (
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
                    <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                      Problem:{' '}
                    </span>
                    {caseItem.problem.substring(0, 200)}
                    {caseItem.problem.length > 200 ? '…' : ''}
                  </p>
                )}

                {/* Metadata chips */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {caseItem.circular_strategy && (
                    <Chip variant="default" className="text-xs" style={{ color: 'var(--success)' }}>
                      {caseItem.circular_strategy}
                    </Chip>
                  )}
                  {caseItem.materials && (
                    <Chip variant="default" className="text-xs">
                      {caseItem.materials}
                    </Chip>
                  )}
                </div>

                {/* Similarity bar */}
                <div
                  className="mt-3 w-full rounded-full h-1.5 overflow-hidden"
                  style={{ backgroundColor: 'var(--border)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${similarity}%`, backgroundColor: barColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

SimilarCasesCard.propTypes = { scoringResult: PropTypes.object };
