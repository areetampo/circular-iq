import { Card, Chip, Table } from '@heroui/react';
import {
  ArrowRight,
  Award,
  FileText,
  Lightbulb,
  Minus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import PropTypes from 'prop-types';

import { formatTimestamp, titleize } from '@/lib/formatting';
import { formatFactorName } from '@/lib/scoring';

export function DetailsTab({ assessment1, assessment2, scoringResult1, scoringResult2 }) {
  return (
    <>
      {/* Project Details */}
      <Card className="border-2 border-violet-200 shadow-md rounded-xl bg-linear-to-br from-violet-50/30 to-white">
        <Card.Header className="flex items-center gap-3 pb-4">
          <div className="p-2.5 rounded-lg bg-linear-to-br from-violet-100 to-violet-200">
            <FileText className="text-violet-700" size={20} />
          </div>
          <Card.Title className="font-bold text-lg text-slate-900">Project Details</Card.Title>
        </Card.Header>
        <Card.Content className="p-0">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Project details table" className="min-w-[600px]">
                <Table.Header>
                  <Table.Column className="w-[35%]" isRowHeader>
                    ATTRIBUTE
                  </Table.Column>
                  <Table.Column className="text-center">{assessment1.title}</Table.Column>
                  <Table.Column className="text-center">{assessment2.title}</Table.Column>
                </Table.Header>
                <Table.Body>
                  <Table.Row className="hover:bg-slate-50/50 transition-colors duration-150">
                    <Table.Cell className="font-semibold text-slate-900">Industry</Table.Cell>
                    <Table.Cell className="text-center">
                      <Chip variant="secondary" size="sm" className="transition-all duration-200">
                        <Chip.Label>
                          {titleize(
                            scoringResult1?.metadata?.industry || assessment1.industry || '',
                          )}
                        </Chip.Label>
                      </Chip>
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <Chip variant="secondary" size="sm" className="transition-all duration-200">
                        <Chip.Label>
                          {titleize(
                            scoringResult2?.metadata?.industry || assessment2.industry || '',
                          )}
                        </Chip.Label>
                      </Chip>
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row className="hover:bg-slate-50/50 transition-colors duration-150">
                    <Table.Cell className="font-semibold text-slate-900">Scale</Table.Cell>
                    <Table.Cell className="text-center">
                      <Chip variant="secondary" size="sm" className="transition-all duration-200">
                        <Chip.Label>{titleize(scoringResult1?.metadata?.scale)}</Chip.Label>
                      </Chip>
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <Chip variant="secondary" size="sm" className="transition-all duration-200">
                        <Chip.Label>{titleize(scoringResult2?.metadata?.scale)}</Chip.Label>
                      </Chip>
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row className="hover:bg-slate-50/50 transition-colors duration-150">
                    <Table.Cell className="font-semibold text-slate-900">Strategy</Table.Cell>
                    <Table.Cell className="text-center">
                      <Chip variant="secondary" size="sm" className="transition-all duration-200">
                        <Chip.Label>{titleize(scoringResult1?.metadata?.r_strategy)}</Chip.Label>
                      </Chip>
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <Chip variant="secondary" size="sm" className="transition-all duration-200">
                        <Chip.Label>{titleize(scoringResult2?.metadata?.r_strategy)}</Chip.Label>
                      </Chip>
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row className="hover:bg-slate-50/50 transition-colors duration-150">
                    <Table.Cell className="font-semibold text-slate-900">Material</Table.Cell>
                    <Table.Cell className="text-center">
                      <Chip variant="secondary" size="sm" className="transition-all duration-200">
                        <Chip.Label>
                          {titleize(scoringResult1?.metadata?.primary_material)}
                        </Chip.Label>
                      </Chip>
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <Chip variant="secondary" size="sm" className="transition-all duration-200">
                        <Chip.Label>
                          {titleize(scoringResult2?.metadata?.primary_material)}
                        </Chip.Label>
                      </Chip>
                    </Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card.Content>
      </Card>

      {/* Gap Analysis Comparison */}
      {(scoringResult1?.gap_analysis?.has_benchmarks ||
        scoringResult2?.gap_analysis?.has_benchmarks) && (
        <Card className="border-2 border-amber-200 shadow-md rounded-xl bg-linear-to-br from-amber-50/30 to-white">
          <Card.Header className="flex items-center gap-3 pb-4">
            <div className="p-2.5 rounded-lg bg-linear-to-br from-amber-100 to-amber-200">
              <Award className="text-amber-700" size={20} />
            </div>
            <Card.Title className="font-bold text-lg text-slate-900">
              Gap Analysis vs Similar Projects
            </Card.Title>
          </Card.Header>
          <Card.Content className="p-0 overflow-x-auto">
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Gap analysis comparison" className="min-w-[600px]">
                  <Table.Header>
                    <Table.Column className="w-[35%]" isRowHeader>
                      FACTOR
                    </Table.Column>
                    <Table.Column className="text-center">{assessment1.title}</Table.Column>
                    <Table.Column className="text-center">{assessment2.title}</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {Object.keys(
                      scoringResult1?.sub_scores || scoringResult2?.sub_scores || {},
                    ).map((factor) => {
                      const comp1 = scoringResult1?.gap_analysis?.comparisons?.[factor];
                      const comp2 = scoringResult2?.gap_analysis?.comparisons?.[factor];
                      const statusCls = (s) =>
                        s === 'above_average'
                          ? 'text-green-700 bg-green-100'
                          : s === 'below_average'
                            ? 'text-red-700 bg-red-100'
                            : 'text-blue-700 bg-blue-100';
                      return (
                        <Table.Row key={factor}>
                          <Table.Cell className="font-medium text-slate-900">
                            {formatFactorName(factor)}
                          </Table.Cell>
                          <Table.Cell className="text-center">
                            {comp1 ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-sm font-bold text-slate-800">
                                  {comp1.userScore}
                                </span>
                                <span
                                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusCls(comp1.status)}`}
                                >
                                  {comp1.status?.replace(/_/g, ' ') || '—'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </Table.Cell>
                          <Table.Cell className="text-center">
                            {comp2 ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-sm font-bold text-slate-800">
                                  {comp2.userScore}
                                </span>
                                <span
                                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusCls(comp2.status)}`}
                                >
                                  {comp2.status?.replace(/_/g, ' ') || '—'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </Card.Content>
        </Card>
      )}

      {/* Circular Economy Tier Comparison */}
      {(scoringResult1?.circular_economy_tier || scoringResult2?.circular_economy_tier) && (
        <Card className="border-2 border-green-200 shadow-md rounded-xl bg-white">
          <Card.Header className="flex items-center gap-3 pb-3">
            <Card.Title className="font-bold text-lg text-slate-900">
              Circular Economy Tier
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { sr: scoringResult1, title: assessment1.title },
                { sr: scoringResult2, title: assessment2.title },
              ].map(({ sr, title }) => {
                const tier = sr?.circular_economy_tier;
                if (!tier)
                  return (
                    <div
                      key={title}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-sm"
                    >
                      No tier data
                    </div>
                  );
                const tierCls =
                  tier.badge_color === 'green'
                    ? 'border-green-300 bg-green-50 text-green-700'
                    : tier.badge_color === 'blue'
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : tier.badge_color === 'amber'
                        ? 'border-amber-300 bg-amber-50 text-amber-700'
                        : 'border-red-300 bg-red-50 text-red-700';
                return (
                  <div key={title} className={`p-4 rounded-xl border-2 ${tierCls}`}>
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">
                      {title}
                    </p>
                    <p className="text-2xl font-bold">{tier.tier}</p>
                    <p className="text-xs opacity-70 mb-2">
                      {tier.range} · {tier.percentile_estimate}
                    </p>
                    <p className="text-xs leading-relaxed opacity-90">{tier.next_milestone}</p>
                  </div>
                );
              })}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* R-Strategy Alignment Comparison */}
      {(scoringResult1?.r_strategy_alignment?.alignment_score != null ||
        scoringResult2?.r_strategy_alignment?.alignment_score != null) && (
        <Card className="border-2 border-purple-200 shadow-md rounded-xl bg-white">
          <Card.Header className="flex items-center gap-3 pb-3">
            <Card.Title className="font-bold text-lg text-slate-900">
              R-Strategy Alignment
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { sr: scoringResult1, title: assessment1.title },
                { sr: scoringResult2, title: assessment2.title },
              ].map(({ sr, title }) => {
                const ra = sr?.r_strategy_alignment;
                if (!ra?.alignment_score)
                  return (
                    <div
                      key={title}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-sm"
                    >
                      No alignment data
                    </div>
                  );
                const sc =
                  ra.alignment_score >= 75
                    ? 'text-green-600'
                    : ra.alignment_score >= 55
                      ? 'text-blue-600'
                      : 'text-amber-600';
                return (
                  <div key={title} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                      {title}
                    </p>
                    <p className="text-sm font-semibold text-slate-700 mb-1">
                      Strategy: {ra.strategy}
                    </p>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className={`text-2xl font-bold ${sc}`}>{ra.alignment_score}</span>
                      <span className="text-sm text-slate-400">/100</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-1">{ra.rating}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{ra.message}</p>
                  </div>
                );
              })}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Parameter Consistency Comparison */}
      {(scoringResult1?.parameter_consistency || scoringResult2?.parameter_consistency) && (
        <Card className="border-2 border-indigo-200 shadow-md rounded-xl bg-white">
          <Card.Header className="flex items-center gap-3 pb-3">
            <Card.Title className="font-bold text-lg text-slate-900">
              Self-Assessment Reliability
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { sr: scoringResult1, title: assessment1.title },
                { sr: scoringResult2, title: assessment2.title },
              ].map(({ sr, title }) => {
                const pc = sr?.parameter_consistency;
                if (!pc)
                  return (
                    <div
                      key={title}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-sm"
                    >
                      No data
                    </div>
                  );
                const sc =
                  pc.score >= 85
                    ? 'text-green-600'
                    : pc.score >= 65
                      ? 'text-blue-600'
                      : 'text-amber-600';
                return (
                  <div key={title} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                      {title}
                    </p>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className={`text-2xl font-bold ${sc}`}>{pc.score}</span>
                      <span className="text-sm text-slate-400">/100</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-1">{pc.rating} Consistency</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{pc.interpretation}</p>
                    {pc.issues?.length > 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        {pc.issues_found} issue{pc.issues_found !== 1 ? 's' : ''} detected
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Auditor's Verdict */}
      <Card className="border-2 border-green-200 shadow-md rounded-xl bg-linear-to-br from-green-50/30 to-white">
        <Card.Header className="flex gap-3 items-center pb-3">
          <div className="p-2.5 rounded-lg bg-linear-to-br from-green-100 to-green-200">
            <Lightbulb className="text-green-700" size={20} />
          </div>
          <Card.Title className="font-bold text-lg text-slate-900">
            Auditor&apos;s Verdict
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 pl-4 border-l-4 border-emerald-500 bg-linear-to-r from-emerald-50/50 to-white rounded-r-lg hover:shadow-md transition-all duration-200">
              <p className="text-sm font-bold text-emerald-700 uppercase mb-2 tracking-wide">
                {assessment1.title}
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                {scoringResult1?.audit?.audit_verdict || 'No verdict available'}
              </p>
            </div>

            <div className="p-5 pl-4 border-l-4 border-blue-500 bg-linear-to-r from-blue-50/50 to-white rounded-r-lg hover:shadow-md transition-all duration-200">
              <p className="text-sm font-bold text-blue-700 uppercase mb-2 tracking-wide">
                {assessment2.title}
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                {scoringResult2?.audit?.audit_verdict || 'No verdict available'}
              </p>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Summary */}
      <Card className="border-2 border-teal-300 bg-linear-to-br from-teal-50/40 via-emerald-50/30 to-cyan-50/40 shadow-md rounded-xl">
        <Card.Content className="gap-4 p-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-linear-to-br from-teal-100 to-teal-200">
              <Lightbulb className="text-teal-700" size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Summary</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <strong className="text-slate-900">Score Trend:</strong>
              {scoringResult2?.overall_score > scoringResult1?.overall_score ? (
                <Chip
                  color="success"
                  variant="soft"
                  size="sm"
                  className="transition-all duration-200"
                >
                  <TrendingUp size={12} />
                  <Chip.Label className="font-semibold">Score improved</Chip.Label>
                </Chip>
              ) : scoringResult2?.overall_score < scoringResult1?.overall_score ? (
                <Chip
                  color="danger"
                  variant="soft"
                  size="sm"
                  className="transition-all duration-200"
                >
                  <TrendingDown size={12} />
                  <Chip.Label className="font-semibold">Score declined</Chip.Label>
                </Chip>
              ) : (
                <Chip
                  color="default"
                  variant="soft"
                  size="sm"
                  className="transition-all duration-200"
                >
                  <Minus size={12} />
                  <Chip.Label className="font-semibold">Score unchanged</Chip.Label>
                </Chip>
              )}
            </div>

            {(function () {
              const a1 = scoringResult1?.metadata?.industry || assessment1.industry || '';
              const a2 = scoringResult2?.metadata?.industry || assessment2.industry || '';
              if (a1 && a2 && a1 !== a2) {
                return (
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900">Industry Change:</strong>
                    <span className="flex items-center gap-1 text-slate-600 font-medium">
                      {titleize(a1)}
                      <ArrowRight size={12} />
                      {titleize(a2)}
                    </span>
                  </div>
                );
              }
              return null;
            })()}

            <div className="text-slate-600 pt-2 border-t border-slate-200">
              <strong className="text-slate-900">Compared: </strong>
              <span className="text-md font-bold">
                {assessment1.title}
                <span className="italic font-normal">
                  {' '}
                  ({formatTimestamp(assessment1.created_at)}) vs.{' '}
                </span>
                {assessment2.title}
                <span className="italic font-normal">
                  {' '}
                  ({formatTimestamp(assessment2.created_at)})
                </span>
              </span>
            </div>
          </div>
        </Card.Content>
      </Card>
    </>
  );
}

DetailsTab.propTypes = {
  /** First assessment object with title, industry, created_at, etc. */
  assessment1: PropTypes.object.isRequired,
  /** Second assessment object with title, industry, created_at, etc. */
  assessment2: PropTypes.object.isRequired,
  /** First assessment's calculated scoring result */
  scoringResult1: PropTypes.object.isRequired,
  /** Second assessment's calculated scoring result */
  scoringResult2: PropTypes.object.isRequired,
};

export default DetailsTab;
