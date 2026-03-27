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
          <Card
            key={assessment.id}
            className={`border-2 ${border} shadow-md rounded-xl`}
            style={{ backgroundColor: 'var(--surface)' }}
          >
            <Card.Header className="flex items-center gap-3 pb-3">
              <div
                className="p-2.5 rounded-lg"
                style={{
                  background: `linear-gradient(to bottom right, var(--${color === 'emerald' ? 'success' : 'info'}-soft), var(--surface))`,
                }}
              >
                <FileText className={icon} size={20} />
              </div>
              <Card.Title className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
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
                      <div
                        key={idx}
                        className="p-4 border rounded-xl"
                        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p
                              className="text-sm font-semibold"
                              style={{ color: 'var(--foreground)' }}
                            >
                              {title}
                            </p>
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
                            style={{
                              color:
                                pct >= 70
                                  ? 'var(--success)'
                                  : pct >= 50
                                    ? 'var(--accent)'
                                    : 'var(--warning)',
                            }}
                          >
                            {pct}% match
                          </Chip>
                        </div>

                        {/* Summary */}
                        {summ && (
                          <p
                            className="text-xs italic mb-3 leading-relaxed"
                            style={{ color: 'var(--muted)' }}
                          >
                            {summ}
                          </p>
                        )}

                        {/* Score comparison */}
                        {caseItem.case_scores && (
                          <div
                            className="p-3 border-l-4 rounded-lg"
                            style={{
                              backgroundColor: 'var(--surface)',
                              borderColor: 'var(--info)',
                            }}
                          >
                            <p
                              className="text-xs font-semibold"
                              style={{ color: 'var(--foreground)' }}
                            >
                              Case scores vs yours
                            </p>
                            <div className="grid grid-cols-4 gap-1">
                              {Object.entries(caseItem.case_scores).map(([factor, caseScore]) => (
                                <div
                                  key={factor}
                                  className="text-xs"
                                  style={{ color: 'var(--foreground)' }}
                                >
                                  <strong>{formatFactorName(factor)}:</strong> {caseScore}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Impact */}
                        {caseItem.impact && (
                          <div
                            className="p-2 border-l-4 rounded mb-2"
                            style={{
                              borderColor: 'var(--info)',
                              backgroundColor: 'var(--info-soft)',
                            }}
                          >
                            <p className="text-xs font-semibold" style={{ color: 'var(--info)' }}>
                              Impact
                            </p>
                            <p className="text-xs" style={{ color: 'var(--foreground)' }}>
                              {caseItem.impact}
                            </p>
                          </div>
                        )}

                        {/* View Full Details drawer button */}
                        <div className="flex justify-end mt-2">
                          <Button
                            size="sm"
                            variant="light"
                            style={{ color: 'var(--accent)' }}
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
                <div
                  className="flex flex-col items-center justify-center gap-3 py-8 text-center"
                  style={{ color: 'var(--muted)' }}
                >
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
