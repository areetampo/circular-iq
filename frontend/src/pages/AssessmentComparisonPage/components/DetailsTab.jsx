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
      <Card
        className="border-2 rounded-xl"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <Card.Header className="flex items-center gap-3 pb-4">
          <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'var(--accent-soft)' }}>
            <FileText style={{ color: 'var(--accent)' }} size={20} />
          </div>
          <Card.Title className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
            Project Details
          </Card.Title>
        </Card.Header>
        <Card.Content className="p-0">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Project details table" className="min-w-md">
                <Table.Header>
                  <Table.Column className="w-1/3" isRowHeader>
                    ATTRIBUTE
                  </Table.Column>
                  <Table.Column className="text-center">{assessment1.title}</Table.Column>
                  <Table.Column className="text-center">{assessment2.title}</Table.Column>
                </Table.Header>
                <Table.Body>
                  <Table.Row className="hover:bg-[var(--accent-soft)] transition-colors duration-150">
                    <Table.Cell className="font-semibold" style={{ color: 'var(--foreground)' }}>
                      Industry
                    </Table.Cell>
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
                  <Table.Row className="hover:bg-[var(--accent-soft)] transition-colors duration-150">
                    <Table.Cell className="font-semibold" style={{ color: 'var(--foreground)' }}>
                      Scale
                    </Table.Cell>
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
                  <Table.Row className="hover:bg-[var(--accent-soft)] transition-colors duration-150">
                    <Table.Cell className="font-semibold" style={{ color: 'var(--foreground)' }}>
                      Strategy
                    </Table.Cell>
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
                  <Table.Row className="hover:bg-[var(--accent-soft)] transition-colors duration-150">
                    <Table.Cell className="font-semibold" style={{ color: 'var(--foreground)' }}>
                      Material
                    </Table.Cell>
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
        <Card
          className="border-2 rounded-xl"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <Card.Header className="flex items-center gap-3 pb-4">
            <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'var(--accent-soft)' }}>
              <Award style={{ color: 'var(--accent)' }} size={20} />
            </div>
            <Card.Title className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
              Gap Analysis vs Similar Projects
            </Card.Title>
          </Card.Header>
          <Card.Content className="p-0 overflow-x-auto">
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Gap analysis comparison" className="min-w-md">
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
                      const statusStyle = (s) => ({
                        color:
                          s === 'above_average'
                            ? 'var(--success)'
                            : s === 'below_average'
                              ? 'var(--danger)'
                              : 'var(--info)',
                      });
                      return (
                        <Table.Row key={factor}>
                          <Table.Cell
                            className="font-medium"
                            style={{ color: 'var(--foreground)' }}
                          >
                            {formatFactorName(factor)}
                          </Table.Cell>
                          <Table.Cell className="text-center">
                            {comp1 ? (
                              <div className="flex flex-col items-center gap-1">
                                <span
                                  className="text-sm font-bold"
                                  style={{ color: 'var(--foreground)' }}
                                >
                                  {comp1.userScore}
                                </span>
                                <span
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                  style={statusStyle(comp1.status)}
                                >
                                  {comp1.status?.replace(/_/g, ' ') || '—'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                                —
                              </span>
                            )}
                          </Table.Cell>
                          <Table.Cell className="text-center">
                            {comp2 ? (
                              <div className="flex flex-col items-center gap-1">
                                <span
                                  className="text-sm font-bold"
                                  style={{ color: 'var(--foreground)' }}
                                >
                                  {comp2.userScore}
                                </span>
                                <span
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                  style={statusStyle(comp2.status)}
                                >
                                  {comp2.status?.replace(/_/g, ' ') || '—'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                                —
                              </span>
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
        <Card
          className="border-2 rounded-xl"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <Card.Header className="flex items-center gap-3 pb-3">
            <Card.Title className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
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
                      className="p-4 rounded-xl border text-sm"
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: 'var(--border)',
                        color: 'var(--muted)',
                      }}
                    >
                      No tier data
                    </div>
                  );
                const tierColor =
                  tier.badge_color === 'green'
                    ? 'var(--success)'
                    : tier.badge_color === 'blue'
                      ? 'var(--info)'
                      : tier.badge_color === 'amber'
                        ? 'var(--warning)'
                        : 'var(--danger)';
                const tierBg =
                  tier.badge_color === 'green'
                    ? 'var(--success-soft)'
                    : tier.badge_color === 'blue'
                      ? 'var(--info-soft)'
                      : tier.badge_color === 'amber'
                        ? 'var(--warning-soft)'
                        : 'var(--danger-soft)';
                return (
                  <div
                    key={title}
                    className="p-4 rounded-xl border-2"
                    style={{ borderColor: tierColor, backgroundColor: tierBg }}
                  >
                    <p
                      className="text-xs font-semibold uppercase tracking-wide mb-1"
                      style={{ color: 'var(--muted)' }}
                    >
                      {title}
                    </p>
                    <p className="text-2xl font-bold" style={{ color: tierColor }}>
                      {tier.tier}
                    </p>
                    <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>
                      {tier.range} · {tier.percentile_estimate}
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                      {tier.next_milestone}
                    </p>
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
        <Card
          className="border-2 rounded-xl"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <Card.Header className="flex items-center gap-3 pb-3">
            <Card.Title className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
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
                      className="p-4 rounded-xl border text-sm"
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: 'var(--border)',
                        color: 'var(--muted)',
                      }}
                    >
                      No alignment data
                    </div>
                  );
                const sc =
                  ra.alignment_score >= 75
                    ? 'var(--success)'
                    : ra.alignment_score >= 55
                      ? 'var(--info)'
                      : 'var(--warning)';
                return (
                  <div
                    key={title}
                    className="p-4 rounded-xl border"
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    <p
                      className="text-xs font-semibold uppercase tracking-wide mb-1"
                      style={{ color: 'var(--muted)' }}
                    >
                      {title}
                    </p>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-2xl font-bold" style={{ color: sc }}>
                        {ra.alignment_score}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--muted)' }}>
                        /100
                      </span>
                    </div>
                    <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>
                      {ra.rating}
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                      {ra.message}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Parameter Consistency Comparison */}
      {(scoringResult1?.parameter_consistency || scoringResult2?.parameter_consistency) && (
        <Card
          className="border-2 rounded-xl"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <Card.Header className="flex items-center gap-3 pb-3">
            <Card.Title className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
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
                      className="p-4 rounded-xl border text-sm"
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: 'var(--border)',
                        color: 'var(--muted)',
                      }}
                    >
                      No data
                    </div>
                  );
                const sc =
                  pc.score >= 85
                    ? 'var(--success)'
                    : pc.score >= 65
                      ? 'var(--info)'
                      : 'var(--warning)';
                return (
                  <div
                    key={title}
                    className="p-4 rounded-xl border"
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    <p
                      className="text-xs font-semibold uppercase tracking-wide mb-2"
                      style={{ color: 'var(--muted)' }}
                    >
                      {title}
                    </p>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-2xl font-bold" style={{ color: sc }}>
                        {pc.score}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--muted)' }}>
                        /100
                      </span>
                    </div>
                    <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>
                      {pc.rating} Consistency
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                      {pc.interpretation}
                    </p>
                    {pc.issues?.length > 0 && (
                      <p className="text-xs mt-1" style={{ color: 'var(--warning)' }}>
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
      <Card
        className="border-2 rounded-xl"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <Card.Header className="flex gap-3 items-center pb-3">
          <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'var(--accent-soft)' }}>
            <Lightbulb style={{ color: 'var(--accent)' }} size={20} />
          </div>
          <Card.Title className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
            Auditor&apos;s Verdict
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className="p-5 pl-4 border-l-4 rounded-r-lg"
              style={{ borderLeftColor: 'var(--success)', backgroundColor: 'var(--success-soft)' }}
            >
              <p
                className="text-sm font-bold uppercase mb-2 tracking-wide"
                style={{ color: 'var(--success)' }}
              >
                {assessment1.title}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                {scoringResult1?.audit?.audit_verdict || 'No verdict available'}
              </p>
            </div>

            <div
              className="p-5 pl-4 border-l-4 rounded-r-lg"
              style={{ borderLeftColor: 'var(--info)', backgroundColor: 'var(--info-soft)' }}
            >
              <p
                className="text-sm font-bold uppercase mb-2 tracking-wide"
                style={{ color: 'var(--info)' }}
              >
                {assessment2.title}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                {scoringResult2?.audit?.audit_verdict || 'No verdict available'}
              </p>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Summary */}
      <Card
        className="border-2 rounded-xl"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <Card.Content className="gap-4 p-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'var(--accent-soft)' }}>
              <Lightbulb style={{ color: 'var(--accent)' }} size={20} />
            </div>
            <h3 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
              Summary
            </h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <strong style={{ color: 'var(--foreground)' }}>Score Trend:</strong>
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
                    <strong style={{ color: 'var(--foreground)' }}>Industry Change:</strong>
                    <span
                      className="flex items-center gap-1 font-medium"
                      style={{ color: 'var(--muted)' }}
                    >
                      {titleize(a1)}
                      <ArrowRight size={12} />
                      {titleize(a2)}
                    </span>
                  </div>
                );
              }
              return null;
            })()}

            <div className="pt-2 border-t" style={{ borderTopColor: 'var(--border)' }}>
              <strong style={{ color: 'var(--foreground)' }}>Compared: </strong>
              <span className="text-md font-bold" style={{ color: 'var(--foreground)' }}>
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
