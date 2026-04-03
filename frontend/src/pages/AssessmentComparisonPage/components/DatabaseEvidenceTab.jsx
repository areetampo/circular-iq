import { FileText, Frown } from 'lucide-react';
import PropTypes from 'prop-types';

import { Chip } from '@/components/common';
import { formatFactorName } from '@/lib/scoring';

// Single assessment evidence component
function SingleAssessmentEvidence({
  assessment,
  scoringResult,
  openResultsDatabaseEvidenceDetailsDrawer,
}) {
  const cases = scoringResult?.similar_cases;
  const summaries = scoringResult?.audit?.similar_cases_summaries || [];

  return (
    <div className="border-2 border-(--color-border) rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-(--color-accent)" />
        <span className="text-sm font-semibold text-(--color-text-primary)">
          {assessment.title} — Similar Cases
        </span>
      </div>

      {/* Content */}
      <div>
        {cases && cases.length > 0 ? (
          <div className="space-y-4">
            {cases.map((caseItem, idx) => {
              const pct = Math.round((caseItem.similarity || 0) * 100);
              const title = caseItem.title || summaries[idx] || `Related Case ${idx + 1}`;
              const summ = summaries[idx] || caseItem.summary || '';
              const strengthLabel =
                pct >= 80
                  ? 'Very Strong Match'
                  : pct >= 60
                    ? 'Strong Match'
                    : pct >= 40
                      ? 'Moderate Match'
                      : 'Weak Match';
              const strengthColor =
                pct >= 80
                  ? 'var(--color-success)'
                  : pct >= 60
                    ? 'var(--color-info)'
                    : pct >= 40
                      ? 'var(--color-warning)'
                      : 'var(--color-danger)';

              return (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-4 border-2 rounded-xl border-(--color-border) hover:bg-(--color-accent-light) transition-all duration-200 cursor-pointer group"
                  onClick={() =>
                    openResultsDatabaseEvidenceDetailsDrawer({
                      assessmentId: assessment.id,
                      caseItem,
                      caseIndex: idx,
                    })
                  }
                >
                  {/* Content */}
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="text-sm font-semibold text-(--color-text-primary)">{title}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {caseItem.year && (
                            <Chip variant="tag" className="text-xs">
                              {caseItem.year}
                            </Chip>
                          )}
                          {caseItem.location && (
                            <Chip variant="tag" className="text-xs">
                              {caseItem.location}
                            </Chip>
                          )}
                          {caseItem.use_type && (
                            <Chip variant="tag" className="text-xs">
                              {caseItem.use_type}
                            </Chip>
                          )}
                          {caseItem.circular_strategy && (
                            <Chip variant="tag" className="text-xs text-(--color-success)">
                              {caseItem.circular_strategy}
                            </Chip>
                          )}
                          {caseItem.materials && (
                            <Chip variant="tag" className="text-xs">
                              {caseItem.materials}
                            </Chip>
                          )}
                        </div>
                      </div>
                      <Chip
                        variant="match"
                        color={pct >= 75 ? 'strong' : pct >= 50 ? 'decent' : 'weak'}
                        className="shrink-0 text-xs"
                      >
                        {pct}% match
                      </Chip>
                    </div>

                    {/* Summary */}
                    {summ && (
                      <p className="text-xs italic mb-3 leading-relaxed text-(--color-text-muted)">
                        {summ}
                      </p>
                    )}

                    {/* Score comparison */}
                    {caseItem.case_scores && (
                      <div className="p-3 border-l-4 border-(--color-accent) rounded-lg mb-3 bg-(--color-accent-light)">
                        <p className="text-xs font-semibold text-(--color-accent)">
                          Case scores vs yours
                        </p>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {Object.entries(caseItem.case_scores).map(([factor, caseScore]) => (
                            <div key={factor} className="text-xs text-(--color-text-primary)">
                              <strong>{formatFactorName(factor)}:</strong> {caseScore}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Impact */}
                    {caseItem.impact && (
                      <div className="p-2 border-l-4 border-(--color-accent) rounded mb-3 bg-(--color-accent-light)">
                        <p className="text-xs font-semibold text-(--color-accent)">Impact</p>
                        <p className="text-xs text-(--color-text-primary)">{caseItem.impact}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center text-(--color-text-muted)">
            <Frown size={32} />
            <p className="text-sm">No similar cases found for this assessment.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function DatabaseEvidenceTab({
  // New single assessment props
  assessment,
  scoringResult,
  variant = 'single', // 'single' for side-by-side view
  openResultsDatabaseEvidenceDetailsDrawer,
  // Legacy props for backward compatibility
  assessment1,
  assessment2,
  scoringResult1,
  scoringResult2,
}) {
  // Handle new single-assessment variant
  if (assessment && scoringResult) {
    return (
      <SingleAssessmentEvidence
        assessment={assessment}
        scoringResult={scoringResult}
        openResultsDatabaseEvidenceDetailsDrawer={openResultsDatabaseEvidenceDetailsDrawer}
      />
    );
  }

  // Legacy comparison mode
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SingleAssessmentEvidence
        assessment={assessment1}
        scoringResult={scoringResult1}
        openResultsDatabaseEvidenceDetailsDrawer={openResultsDatabaseEvidenceDetailsDrawer}
      />
      <SingleAssessmentEvidence
        assessment={assessment2}
        scoringResult={scoringResult2}
        openResultsDatabaseEvidenceDetailsDrawer={openResultsDatabaseEvidenceDetailsDrawer}
      />
    </div>
  );
}

DatabaseEvidenceTab.propTypes = {
  // New single assessment props
  assessment: PropTypes.object,
  scoringResult: PropTypes.object,
  variant: PropTypes.oneOf(['single']),

  // Legacy props for backward compatibility
  assessment1: PropTypes.object,
  assessment2: PropTypes.object,
  scoringResult1: PropTypes.object,
  scoringResult2: PropTypes.object,
  /** Callback function to open database evidence details drawer */
  openResultsDatabaseEvidenceDetailsDrawer: PropTypes.func.isRequired,
};

export default DatabaseEvidenceTab;
