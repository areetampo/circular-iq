import { Button, Card, Chip } from '@heroui/react';
import { ArrowRight, FileText, Frown } from 'lucide-react';
import PropTypes from 'prop-types';

import { formatFactorName } from '@/lib/scoring';

export function DatabaseEvidenceTab({
  assessment1,
  assessment2,
  scoringResult1,
  scoringResult2,
  openResultsDatabaseEvidenceDetailsDrawer,
}) {
  return (
    <>
      {[
        { sr: scoringResult1, assessment: assessment1, color: 'emerald' },
        { sr: scoringResult2, assessment: assessment2, color: 'blue' },
      ].map(({ sr, assessment, color }) => {
        const cases = sr?.similar_cases;
        const summaries = sr?.audit?.similar_cases_summaries || [];
        const border = color === 'emerald' ? 'border-emerald-200' : 'border-blue-200';
        const grad =
          color === 'emerald' ? 'from-emerald-100 to-emerald-200' : 'from-blue-100 to-blue-200';
        const icon = color === 'emerald' ? 'text-emerald-700' : 'text-blue-700';

        return (
          <Card key={assessment.id} className={`border-2 ${border} shadow-md rounded-xl bg-white`}>
            <Card.Header className="flex items-center gap-3 pb-3">
              <div className={`p-2.5 rounded-lg bg-linear-to-br ${grad}`}>
                <FileText className={icon} size={20} />
              </div>
              <Card.Title className="font-bold text-lg text-slate-900">
                {assessment.title} — Similar Cases
              </Card.Title>
            </Card.Header>
            <Card.Content>
              {cases && cases.length > 0 ? (
                <div className="space-y-5">
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
                        ? '#22c55e'
                        : pct >= 60
                          ? '#3b82f6'
                          : pct >= 40
                            ? '#f59e0b'
                            : '#ef4444';

                    return (
                      <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{title}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {caseItem.year && (
                                <Chip size="sm" variant="secondary" className="text-xs">
                                  {caseItem.year}
                                </Chip>
                              )}
                              {caseItem.location && (
                                <Chip size="sm" variant="secondary" className="text-xs">
                                  {caseItem.location}
                                </Chip>
                              )}
                              {caseItem.use_type && (
                                <Chip size="sm" variant="secondary" className="text-xs">
                                  {caseItem.use_type}
                                </Chip>
                              )}
                              {caseItem.circular_strategy && (
                                <Chip size="sm" variant="flat" color="success" className="text-xs">
                                  {caseItem.circular_strategy}
                                </Chip>
                              )}
                              {caseItem.materials && (
                                <Chip size="sm" variant="secondary" className="text-xs">
                                  {caseItem.materials}
                                </Chip>
                              )}
                            </div>
                          </div>
                          <Chip
                            size="sm"
                            variant="flat"
                            color={pct >= 70 ? 'success' : pct >= 50 ? 'primary' : 'warning'}
                            className="shrink-0 text-xs"
                          >
                            {pct}% match
                          </Chip>
                        </div>

                        {/* Summary */}
                        {summ && (
                          <p className="text-xs text-slate-600 italic mb-3 leading-relaxed">
                            {summ}
                          </p>
                        )}

                        {/* Score comparison */}
                        {caseItem.case_scores && (
                          <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <p className="text-xs font-semibold text-purple-700 mb-2">
                              Case scores vs yours
                            </p>
                            <div className="grid grid-cols-4 gap-1">
                              {Object.entries(caseItem.case_scores).map(([factor, caseScore]) => (
                                <div key={factor} className="text-xs text-slate-700">
                                  <strong>{formatFactorName(factor)}:</strong> {caseScore}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Impact */}
                        {caseItem.impact && (
                          <div className="p-2 bg-blue-50 border-l-4 border-blue-400 rounded mb-2">
                            <p className="text-xs font-semibold text-blue-700 mb-0.5">Impact</p>
                            <p className="text-xs text-slate-700">{caseItem.impact}</p>
                          </div>
                        )}

                        {/* View Full Details drawer button */}
                        <div className="flex justify-end mt-2">
                          <Button
                            size="sm"
                            variant="light"
                            className="text-emerald-600"
                            onPress={() =>
                              openResultsDatabaseEvidenceDetailsDrawer({
                                assessmentId: assessment.id,
                                caseItem,
                                caseIndex: idx,
                              })
                            }
                          >
                            View Full Details <ArrowRight className="ml-1" size={14} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-8 text-center text-slate-500">
                  <Frown size={32} />
                  <p className="text-sm">No similar cases found for this assessment.</p>
                </div>
              )}
            </Card.Content>
          </Card>
        );
      })}
    </>
  );
}

DatabaseEvidenceTab.propTypes = {
  /** First assessment object */
  assessment1: PropTypes.object.isRequired,
  /** Second assessment object */
  assessment2: PropTypes.object.isRequired,
  /** First assessment's scoring result with similar cases */
  scoringResult1: PropTypes.object.isRequired,
  /** Second assessment's scoring result with similar cases */
  scoringResult2: PropTypes.object.isRequired,
  /** Callback function to open database evidence details drawer */
  openResultsDatabaseEvidenceDetailsDrawer: PropTypes.func.isRequired,
};

export default DatabaseEvidenceTab;
