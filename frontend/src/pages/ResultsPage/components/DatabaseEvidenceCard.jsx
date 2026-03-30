import { Card, ProgressBar } from '@heroui/react';
import { ArrowRight, ExternalLink, FileText, Frown, Lightbulb, Target } from 'lucide-react';
import PropTypes from 'prop-types';

import { Button, Chip } from '@/components/common';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { getMatchStrength } from '@/utils/content';

export function DatabaseEvidenceCard({ actualResult, casesSummaries }) {
  const { openResultsDatabaseEvidenceDetailsDrawer } = useGlobalDrawer();

  return (
    <Card
      data-export-section="database-evidence"
      className="border rounded-xl card-lift"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="p-1 sm:p-3">
        <div className="flex items-center gap-2 mb-2">
          <FileText style={{ color: 'var(--success)' }} size={20} />
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
              Database Evidence
            </h3>
          </div>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
          Similar cases and benchmark comparisons from the dataset
        </p>

        <div>
          {actualResult.similar_cases && actualResult.similar_cases.length > 0 ? (
            <div className="space-y-6">
              {actualResult.similar_cases.map((caseItem, index) => {
                const matchPercentage = Math.round((caseItem.similarity || 0) * 100);
                const sourceCaseId = caseItem.id || `case-${index}`;
                const caseTitle =
                  caseItem.title || casesSummaries[index] || `Related Case ${index + 1}`;
                const problemText =
                  caseItem.problem || casesSummaries[index] || 'No problem description available.';
                const solutionText = caseItem.solution || 'No solution description available.';
                const { label: matchStrengthLabel, color: matchStrengthColor } = getMatchStrength(
                  caseItem.similarity || 0,
                );

                return (
                  <div
                    key={index}
                    className="border rounded-lg p-4"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <div className="flex flex-col gap-1 mb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4
                            className="text-lg font-semibold"
                            style={{ color: 'var(--foreground)' }}
                          >
                            {caseTitle}
                          </h4>
                          {/* Year + Location + Use type */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {caseItem.year && (
                              <Chip variant="default" className="text-xs">
                                {caseItem.year}
                              </Chip>
                            )}
                            {caseItem.location && (
                              <Chip variant="default" className="text-xs">
                                {caseItem.location}
                              </Chip>
                            )}
                            {caseItem.use_type && (
                              <Chip variant="default" className="text-xs">
                                {caseItem.use_type}
                              </Chip>
                            )}
                            {caseItem.source_display && (
                              <a
                                href={caseItem.source_url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs hover:underline"
                                style={{ color: 'var(--accent)' }}
                              >
                                <ExternalLink size={10} />
                                {caseItem.source_display}
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Chip variant="info">{matchPercentage}% similar</Chip>
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <ProgressBar
                        value={matchPercentage}
                        color={
                          matchPercentage >= 80
                            ? 'success'
                            : matchPercentage >= 60
                              ? 'primary'
                              : matchPercentage >= 40
                                ? 'warning'
                                : 'danger'
                        }
                        className="mb-1"
                      />
                      <span
                        className="text-sm font-medium"
                        style={{
                          color:
                            matchPercentage >= 70
                              ? 'var(--success)'
                              : matchPercentage >= 50
                                ? 'var(--accent)'
                                : 'var(--warning)',
                        }}
                      >
                        {matchStrengthLabel}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div
                        className="p-3 border-l-4 rounded"
                        style={{
                          borderColor: 'var(--success)',
                          backgroundColor: 'var(--success-soft)',
                        }}
                      >
                        <h5
                          className="text-sm font-semibold mb-2 flex items-center gap-2"
                          style={{ color: 'var(--foreground)' }}
                        >
                          <Target style={{ color: 'var(--success)' }} size={16} />
                          Problem Addressed
                        </h5>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>
                          {problemText}
                        </p>
                      </div>
                      <div
                        className="p-3 border-l-4 rounded"
                        style={{
                          borderColor: 'var(--success)',
                          backgroundColor: 'var(--success-soft)',
                        }}
                      >
                        <h5
                          className="text-sm font-semibold mb-2 flex items-center gap-2"
                          style={{ color: 'var(--foreground)' }}
                        >
                          <Lightbulb style={{ color: 'var(--success)' }} size={16} />
                          Solution Approach
                        </h5>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>
                          {solutionText}
                        </p>
                      </div>
                    </div>
                    {caseItem.case_scores && (
                      <div
                        className="mb-4 p-3 border rounded-lg"
                        style={{ backgroundColor: 'var(--info-soft)', borderColor: 'var(--info)' }}
                      >
                        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--info)' }}>
                          Their scores (from database) — compare with yours
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {Object.entries(caseItem.case_scores).map(([factor, score]) => {
                            const label = factor
                              .split('_')
                              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                              .join(' ');
                            const userScore = actualResult?.sub_scores?.[factor];
                            const diff = userScore != null ? userScore - score : null;
                            const scoreColor =
                              score >= 75
                                ? 'var(--success)'
                                : score >= 50
                                  ? 'var(--info)'
                                  : 'var(--warning)';
                            return (
                              <div key={factor} className="text-center">
                                <div
                                  className="text-[10px] truncate"
                                  style={{ color: 'var(--muted)' }}
                                >
                                  {label}
                                </div>
                                <div className="text-sm font-bold" style={{ color: scoreColor }}>
                                  {score}
                                </div>
                                {diff != null && (
                                  <div
                                    className="text-[10px] font-semibold"
                                    style={{
                                      color:
                                        diff > 0
                                          ? 'var(--success)'
                                          : diff < 0
                                            ? 'var(--danger)'
                                            : 'var(--muted)',
                                    }}
                                  >
                                    {diff > 0 ? `+${diff}` : diff === 0 ? '=' : diff}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[10px] mt-1 italic" style={{ color: 'var(--subtle)' }}>
                          Diff = your score − their score
                        </p>
                      </div>
                    )}
                    {/* Impact / outcomes row */}
                    {caseItem.impact && (
                      <div
                        className="p-3 border-l-4 rounded mb-3"
                        style={{ borderColor: 'var(--info)', backgroundColor: 'var(--info-soft)' }}
                      >
                        <h5
                          className="text-sm font-semibold mb-1"
                          style={{ color: 'var(--foreground)' }}
                        >
                          Impact & Outcomes
                        </h5>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>
                          {caseItem.impact}
                        </p>
                      </div>
                    )}

                    {/* Metadata chips row */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {caseItem.circular_strategy && (
                        <Chip variant="success">{caseItem.circular_strategy}</Chip>
                      )}
                      {caseItem.materials && <Chip variant="default">{caseItem.materials}</Chip>}
                      {caseItem.industry && <Chip variant="accent">{caseItem.industry}</Chip>}
                    </div>
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="light"
                        onPress={() =>
                          openResultsDatabaseEvidenceDetailsDrawer({
                            caseItem,
                            content: caseItem.summary || caseItem.problem || '',
                            title: caseTitle,
                            matchPercentage,
                            matchStrengthLabel,
                            matchColor: matchStrengthColor,
                            sourceCaseId,
                          })
                        }
                        style={{ color: 'var(--success)' }}
                      >
                        View Full Details <ArrowRight className="ml-1" size={14} />
                      </Button>
                    </div>
                    {index < actualResult.similar_cases.length - 1 && (
                      <hr className="mt-4" style={{ borderColor: 'var(--border)' }} />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center gap-4 py-10 text-center"
              style={{ color: 'var(--muted)' }}
            >
              <Frown size={40} />
              <p className="">No similar cases were found in the database for this assessment.</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

DatabaseEvidenceCard.propTypes = {
  actualResult: PropTypes.object.isRequired,
  casesSummaries: PropTypes.arrayOf(PropTypes.string),
};

export default DatabaseEvidenceCard;
