import { Card, Chip, ProgressBar } from '@heroui/react';
import { ArrowRight, ExternalLink, FileText, Frown, Lightbulb, Target } from 'lucide-react';
import PropTypes from 'prop-types';

import { Button } from '@/components/common';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { getMatchStrength } from '@/utils/content';

export function DatabaseEvidenceCard({ actualResult, casesSummaries }) {
  const { openResultsDatabaseEvidenceDetailsDrawer } = useGlobalDrawer();

  return (
    <Card
      data-export-section="database-evidence"
      className="border border-slate-300 shadow-sm rounded-xl bg-white"
    >
      <div className="p-1 sm:p-3">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="text-emerald-600" size={20} />
          <div>
            <h3 className="text-lg font-bold text-slate-900">Database Evidence</h3>
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-4">
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
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex flex-col gap-1 mb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{caseTitle}</h4>
                          {/* Year + Location + Use type */}
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
                            {caseItem.source_display && (
                              <a
                                href={caseItem.source_url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                              >
                                <ExternalLink size={10} />
                                {caseItem.source_display}
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Chip size="sm" variant="flat" color="secondary">
                            {matchPercentage}% similar
                          </Chip>
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
                      <span className={`text-sm font-medium ${matchStrengthColor}`}>
                        {matchStrengthLabel}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="p-3 border-l-4 border-emerald-600 rounded bg-gray-50">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Target className="text-emerald-600" size={16} />
                          Problem Addressed
                        </h5>
                        <p className="text-sm text-gray-600">{problemText}</p>
                      </div>
                      <div className="p-3 border-l-4 border-emerald-600 rounded bg-gray-50">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Lightbulb className="text-emerald-600" size={16} />
                          Solution Approach
                        </h5>
                        <p className="text-sm text-gray-600">{solutionText}</p>
                      </div>
                    </div>
                    {caseItem.case_scores && (
                      <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-xs font-semibold text-purple-700 mb-2">
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
                                ? 'text-green-700'
                                : score >= 50
                                  ? 'text-blue-700'
                                  : 'text-amber-700';
                            return (
                              <div key={factor} className="text-center">
                                <div className="text-[10px] text-slate-500 truncate">{label}</div>
                                <div className={`text-sm font-bold ${scoreColor}`}>{score}</div>
                                {diff != null && (
                                  <div
                                    className={`text-[10px] font-semibold ${
                                      diff > 0
                                        ? 'text-green-600'
                                        : diff < 0
                                          ? 'text-red-500'
                                          : 'text-slate-400'
                                    }`}
                                  >
                                    {diff > 0 ? `+${diff}` : diff === 0 ? '=' : diff}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 italic">
                          Diff = your score − their score
                        </p>
                      </div>
                    )}
                    {/* Impact / outcomes row */}
                    {caseItem.impact && (
                      <div className="p-3 border-l-4 border-blue-500 rounded bg-blue-50 mb-3">
                        <h5 className="text-sm font-semibold text-gray-700 mb-1">
                          Impact & Outcomes
                        </h5>
                        <p className="text-sm text-gray-600">{caseItem.impact}</p>
                      </div>
                    )}

                    {/* Metadata chips row */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {caseItem.circular_strategy && (
                        <Chip size="sm" variant="flat" color="success">
                          {caseItem.circular_strategy}
                        </Chip>
                      )}
                      {caseItem.materials && (
                        <Chip size="sm" variant="flat" color="default">
                          {caseItem.materials}
                        </Chip>
                      )}
                      {caseItem.industry && (
                        <Chip size="sm" variant="flat" color="primary">
                          {caseItem.industry}
                        </Chip>
                      )}
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
                        className="text-emerald-600"
                      >
                        View Full Details <ArrowRight className="ml-1" size={14} />
                      </Button>
                    </div>
                    {index < actualResult.similar_cases.length - 1 && (
                      <hr className="mt-4 border-gray-300" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-center text-gray-600">
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
