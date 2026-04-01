import PropTypes from 'prop-types';

import { Chip } from '@/components/common';

export default function SimilarCasesCard({ scoringResult }) {
  if (!scoringResult?.similar_cases || scoringResult.similar_cases.length === 0) return null;

  return (
    <div className="border-t border-(--color-border) pt-8 mt-8">
      <h3 className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-6">
        Similar Cases
      </h3>
      <div className="space-y-4">
        {scoringResult.similar_cases.map((caseItem, index) => {
          const summary = scoringResult.audit?.similar_cases_summaries?.[index];
          const similarity = Math.round((caseItem.similarity || 0) * 100);

          return (
            <div key={index} className="p-4 border border-(--color-border) rounded-lg">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-(--color-text-primary)">
                    {caseItem.title || `Case ${index + 1}`}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {caseItem.industry && (
                      <Chip variant="tag" className="text-xs">
                        {caseItem.industry}
                      </Chip>
                    )}
                    {caseItem.category && (
                      <Chip variant="tag" className="text-xs">
                        {caseItem.category}
                      </Chip>
                    )}
                  </div>
                </div>
                <Chip variant="tag" className="text-xs shrink-0 text-(--color-accent)">
                  {similarity}% match
                </Chip>
              </div>
              {summary && (
                <p className="text-xs mt-2 leading-relaxed text-(--color-text-muted)">{summary}</p>
              )}

              {/* Problem preview */}
              {caseItem.problem && !summary && (
                <p className="text-xs mt-2 leading-relaxed text-(--color-text-muted)">
                  <span className="font-semibold text-(--color-text-primary)">Problem: </span>
                  {caseItem.problem.substring(0, 200)}
                  {caseItem.problem.length > 200 ? '…' : ''}
                </p>
              )}

              {/* Metadata chips */}
              <div className="flex flex-wrap gap-1 mt-2">
                {caseItem.circular_strategy && (
                  <Chip variant="tag" className="text-xs">
                    {caseItem.circular_strategy}
                  </Chip>
                )}
                {caseItem.materials && (
                  <Chip variant="tag" className="text-xs">
                    {caseItem.materials}
                  </Chip>
                )}
              </div>

              {/* Similarity bar */}
              <div className="mt-3 w-full rounded-full h-1.5 overflow-hidden bg-(--color-border)">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-(--color-accent)"
                  style={{ width: `${similarity}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

SimilarCasesCard.propTypes = { scoringResult: PropTypes.object };
