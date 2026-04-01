import { ProgressBar, Table } from '@heroui/react';
import { Lightbulb, Target } from 'lucide-react';
import PropTypes from 'prop-types';

import { Chip } from '@/components/common';
import { titleize } from '@/lib/formatting';

export function OverviewTab({
  assessment1,
  assessment2,
  scoringResult1,
  scoringResult2,
  insights,
  overallDelta,
  biggestGain,
  biggestDrop,
  averageDelta,
}) {
  return (
    <>
      {/* Input Data Comparison */}
      <div className="border rounded-xl bg-(--color-bg-card) border-(--color-border)">
        <div className="flex items-center gap-3 pb-4 p-6">
          <div className="p-2.5 rounded-lg bg-(--color-accent-light)">
            <Lightbulb size={20} className="text-(--color-accent)" />
          </div>
          <h3 className="font-bold text-lg text-(--color-text-primary)">Input Data & Context</h3>
        </div>
        <div className="space-y-6 p-6 pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Business Problem */}
            <div className="border rounded-xl bg-(--color-bg-card) border-(--color-border)">
              <div className="flex items-center gap-3 pb-4 p-6">
                <h3 className="font-bold text-lg text-(--color-text-primary)">Business Problem</h3>
              </div>
              <div className="p-0">
                <Table>
                  <Table.ScrollContainer>
                    <Table.Content aria-label="Business problem comparison" className="min-w-150">
                      <Table.Header>
                        <Table.Column className="w-1/2" isRowHeader>
                          Assessment 1
                        </Table.Column>
                        <Table.Column className="w-1/2">Assessment 2</Table.Column>
                      </Table.Header>
                      <Table.Body>
                        <Table.Row className="transition-colors duration-150 hover:bg-accent-soft">
                          <Table.Cell>
                            <div>
                              <p className="text-sm font-semibold mb-2 text-(--color-text-primary)">
                                {assessment1?.title || 'Assessment 1'}
                              </p>
                              <p className="text-sm leading-relaxed text-(--color-text-muted)">
                                {assessment1?.business_problem || 'N/A'}
                              </p>
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <div>
                              <p className="text-sm font-semibold mb-2 text-(--color-text-primary)">
                                {assessment2?.title || 'Assessment 2'}
                              </p>
                              <p className="text-sm leading-relaxed text-(--color-text-muted)">
                                {assessment2?.business_problem || 'N/A'}
                              </p>
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      </Table.Body>
                    </Table.Content>
                  </Table.ScrollContainer>
                </Table>
              </div>
            </div>

            {/* Business Solution */}
            <div className="border rounded-xl border-(--color-info) bg-transparent">
              <div className="flex items-center gap-3 pb-4 p-6">
                <h3 className="font-bold text-lg text-(--color-text-primary)">Business Solution</h3>
              </div>
              <div className="p-0">
                <Table>
                  <Table.ScrollContainer>
                    <Table.Content aria-label="Business solution comparison" className="min-w-150">
                      <Table.Header>
                        <Table.Column className="w-1/2" isRowHeader>
                          Assessment 1
                        </Table.Column>
                        <Table.Column className="w-1/2">Assessment 2</Table.Column>
                      </Table.Header>
                      <Table.Body>
                        <Table.Row className="transition-colors duration-150 hover:bg-accent-soft">
                          <Table.Cell className="align-top">
                            <div>
                              <p className="text-sm font-semibold mb-2 text-(--color-text-primary)">
                                {assessment1?.title || 'Assessment 1'}
                              </p>
                              <p className="text-sm leading-relaxed text-(--color-text-muted)">
                                {assessment1?.business_solution || 'N/A'}
                              </p>
                            </div>
                          </Table.Cell>
                          <Table.Cell className="align-top">
                            <div>
                              <p className="text-sm font-semibold mb-2 text-(--color-text-primary)">
                                {assessment2?.title || 'Assessment 2'}
                              </p>
                              <p className="text-sm leading-relaxed text-(--color-text-muted)">
                                {assessment2?.business_solution || 'N/A'}
                              </p>
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      </Table.Body>
                    </Table.Content>
                  </Table.ScrollContainer>
                </Table>
              </div>
            </div>
          </div>

          {/* Derived Metrics Comparison */}
          <div className="border rounded-xl border-(--color-success) bg-transparent">
            <div className="flex items-center gap-3 pb-4 p-6">
              <h3 className="font-bold text-lg text-(--color-text-primary)">Derived Metrics</h3>
            </div>
            <div className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
                {[
                  { key: 'technical_feasibility', label: 'Technical Feasibility' },
                  { key: 'economic_viability', label: 'Economic Viability' },
                  { key: 'circularity_potential', label: 'Circularity Potential' },
                ].map(({ key, label }) => {
                  const val1 = scoringResult1?.derived_metrics?.[key] || 0;
                  const val2 = scoringResult2?.derived_metrics?.[key] || 0;
                  const winner = val1 > val2 ? 1 : val2 > val1 ? 2 : null;
                  return (
                    <div key={key} className="p-3 rounded-lg bg-transparent">
                      <div className="text-xs font-bold text-(--color-text-primary)">{label}</div>
                      <div className="flex items-center justify-between">
                        <div
                          className={`text-sm font-bold ${winner === 1 ? 'text-(--color-success)' : 'text-(--color-text-muted)'}`}
                        >
                          A1: {val1}
                        </div>
                        <div
                          className={`text-sm font-bold ${winner === 2 ? 'text-(--color-success)' : 'text-(--color-text-muted)'}`}
                        >
                          A2: {val2}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="p-3 rounded-lg bg-transparent">
                  <div className="text-xs font-bold text-(--color-text-primary)">Risk Level</div>
                  <div className="flex items-center justify-between">
                    <Chip
                      variant="default"
                      className={`text-xs ${scoringResult1?.derived_metrics?.risk_level === 'low' ? 'text-(--color-success)' : scoringResult1?.derived_metrics?.risk_level === 'medium' ? 'text-(--color-warning)' : 'text-(--color-danger)'}`}
                    >
                      A1: {scoringResult1?.derived_metrics?.risk_level || 'N/A'}
                    </Chip>
                    <Chip
                      variant="default"
                      className={`text-xs ${
                        scoringResult2?.derived_metrics?.risk_level === 'low'
                          ? 'text-(--color-success)'
                          : scoringResult2?.derived_metrics?.risk_level === 'medium'
                            ? 'text-(--color-warning)'
                            : 'text-(--color-danger)'
                      }`}
                    >
                      A2: {scoringResult2?.derived_metrics?.risk_level || 'N/A'}
                    </Chip>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Evaluation Parameters Summary */}
          <div className="border rounded-xl border-(--color-border) bg-transparent">
            <div className="flex items-center gap-3 pb-4 p-6">
              <h3 className="font-bold text-lg text-(--color-text-primary)">
                Evaluation Parameters
              </h3>
            </div>
            <div className="p-0 overflow-x-auto">
              <Table>
                <Table.ScrollContainer>
                  <Table.Content
                    aria-label="Evaluation parameters comparison"
                    className="min-w-150"
                  >
                    <Table.Header>
                      <Table.Column className="w-2/5" isRowHeader>
                        PARAMETER
                      </Table.Column>
                      <Table.Column className="text-center w-1.5/5">
                        {assessment1?.title || 'Assessment 1'}
                      </Table.Column>
                      <Table.Column className="text-center w-1.5/5">
                        {assessment2?.title || 'Assessment 2'}
                      </Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {Object.entries(
                        assessment1?.evaluation_parameters ||
                          assessment1?.result_json?.evaluation_parameters ||
                          {},
                      ).map(([key, value1]) => {
                        const value2 =
                          assessment2?.evaluation_parameters?.[key] ||
                          assessment2?.result_json?.evaluation_parameters?.[key];
                        return (
                          <Table.Row
                            key={key}
                            className="hover:bg-accent-soft transition-colors duration-150"
                          >
                            <Table.Cell className="font-medium capitalize text-(--color-text-primary)">
                              {key.replace(/_/g, ' ')}
                            </Table.Cell>
                            <Table.Cell className="text-center text-(--color-text-muted)">
                              {String(value1).substring(0, 30)}
                              {String(value1).length > 30 ? '...' : ''}
                            </Table.Cell>
                            <Table.Cell className="text-center text-(--color-text-muted)">
                              {String(value2 || '').substring(0, 30)}
                              {String(value2 || '').length > 30 ? '...' : ''}
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            </div>
          </div>

          {/* Business Context Comparison */}
          <div className="border rounded-xl border-(--color-warning) bg-transparent">
            <div className="flex items-center gap-3 pb-4 p-6">
              <h3 className="font-bold text-lg text-(--color-text-primary)">Business Context</h3>
            </div>
            <div className="p-0 overflow-x-auto">
              <Table>
                <Table.ScrollContainer>
                  <Table.Content aria-label="Business context comparison" className="min-w-150">
                    <Table.Header>
                      <Table.Column className="w-2/5" isRowHeader>
                        CONTEXT FIELD
                      </Table.Column>
                      <Table.Column className="text-center w-1.5/5">
                        {assessment1?.title || 'Assessment 1'}
                      </Table.Column>
                      <Table.Column className="text-center w-1.5/5">
                        {assessment2?.title || 'Assessment 2'}
                      </Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {(() => {
                        const ctx1 =
                          assessment1?.result_json?.business_context ||
                          assessment1?.business_context ||
                          {};
                        const ctx2 =
                          assessment2?.result_json?.business_context ||
                          assessment2?.business_context ||
                          {};
                        const allKeys = new Set([...Object.keys(ctx1), ...Object.keys(ctx2)]);

                        if (allKeys.size === 0) {
                          return (
                            <Table.Row>
                              <Table.Cell className="text-center py-6 text-(--color-text-muted)">
                                No business context data available
                              </Table.Cell>
                            </Table.Row>
                          );
                        }

                        return Array.from(allKeys).map((key) => {
                          const value1 = ctx1[key];
                          const value2 = ctx2[key];
                          const val1Str =
                            value1 === null || value1 === undefined
                              ? 'Not specified'
                              : typeof value1 === 'boolean'
                                ? value1
                                  ? 'Yes'
                                  : 'No'
                                : String(value1);
                          const val2Str =
                            value2 === null || value2 === undefined
                              ? 'Not specified'
                              : typeof value2 === 'boolean'
                                ? value2
                                  ? 'Yes'
                                  : 'No'
                                : String(value2);

                          return (
                            <Table.Row
                              key={key}
                              className={`hover:bg-accent-soft transition-colors duration-150 ${
                                val1Str === val2Str ? '' : 'bg-warning-soft/30'
                              }`}
                            >
                              <Table.Cell className="font-medium capitalize text-(--color-text-primary)">
                                {key.replace(/_/g, ' ')}
                              </Table.Cell>
                              <Table.Cell
                                className={`text-center ${val1Str === val2Str ? '' : 'font-semibold'} ${
                                  val1Str === val2Str
                                    ? 'text-(--color-text-muted)'
                                    : 'text-(--color-warning)'
                                }`}
                              >
                                {val1Str.substring(0, 30)}
                                {val1Str.length > 30 ? '...' : ''}
                              </Table.Cell>
                              <Table.Cell
                                className={`text-center ${val1Str === val2Str ? '' : 'font-semibold'} ${
                                  val1Str === val2Str
                                    ? 'text-(--color-text-muted)'
                                    : 'text-(--color-warning)'
                                }`}
                              >
                                {val2Str.substring(0, 30)}
                                {val2Str.length > 30 ? '...' : ''}
                              </Table.Cell>
                            </Table.Row>
                          );
                        });
                      })()}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      {insights && insights.length > 0 && (
        <div className="border rounded-xl border-(--color-info) bg-transparent">
          <div className="flex items-center gap-3 pb-4 p-6">
            <div className="p-2.5 rounded-lg bg-(--color-info-soft)">
              <Lightbulb className="text-(--color-info)" size={20} />
            </div>
            <h3 className="font-bold text-lg text-(--color-text-primary)">Key Insights</h3>
          </div>
          <div className="gap-3 flex flex-col p-6 pt-0">
            {insights.map((insight, idx) => {
              const IconComponent = insight.icon;
              const colorClass =
                insight.type === 'positive'
                  ? 'border-l-4'
                  : insight.type === 'negative'
                    ? 'border-l-4'
                    : 'border-l-4';

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-4 rounded-r-lg transition-all duration-200 hover:shadow-md border-l-4 ${
                    insight.type === 'positive'
                      ? 'bg-(--color-success-soft) border-(--color-success) text-(--color-success)'
                      : insight.type === 'negative'
                        ? 'bg-(--color-danger-soft) border-(--color-danger) text-(--color-danger)'
                        : 'bg-transparent border-(--color-border) text-(--color-text-primary)'
                  }`}
                >
                  <IconComponent className="shrink-0" strokeWidth={2.5} size={20} />
                  <p className="text-sm font-medium m-0">{insight.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Executive Summary & Score Highlights */}
      <div className="border rounded-xl border-(--color-border) bg-transparent">
        <div className="flex items-center gap-3 pb-4 p-6">
          <div className="p-2.5 rounded-lg bg-(--color-accent-soft)">
            <Lightbulb className="text-(--color-accent)" size={20} />
          </div>
          <h3 className="font-bold text-lg text-(--color-text-primary)">Executive Summary</h3>
        </div>
        <div className="space-y-6 p-6 pt-0">
          {/* Audit Verdicts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              { sr: scoringResult1, assessment: assessment1, color: 'emerald' },
              { sr: scoringResult2, assessment: assessment2, color: 'blue' },
            ].map(({ sr, assessment, color }) => {
              return (
                <div
                  key={assessment.id}
                  className={`p-5 pl-4 border-l-4 ${
                    color === 'emerald'
                      ? 'border-(--color-success) bg-(--color-success-soft)'
                      : 'border-(--color-info) bg-(--color-info-soft)'
                  } rounded-r-lg hover:shadow-md transition-all duration-200`}
                >
                  <p
                    className={`text-sm font-bold ${
                      color === 'emerald' ? 'text-(--color-success)' : 'text-(--color-info)'
                    } uppercase mb-2 tracking-wide`}
                  >
                    {assessment.title}
                  </p>
                  <p className="text-sm text-(--color-text-primary) leading-relaxed">
                    {sr?.audit?.audit_verdict || 'No verdict available'}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Comparative Analysis */}
          {(scoringResult1?.audit?.comparative_analysis ||
            scoringResult2?.audit?.comparative_analysis) && (
            <div className="p-5 pl-4 border-l-4 border-(--color-info) bg-(--color-info-soft) rounded-r-lg">
              <p className="text-xs font-semibold text-(--color-info) uppercase mb-2 tracking-wide">
                Key Findings
              </p>
              <div className="space-y-3">
                {[
                  { sr: scoringResult1, assessment: assessment1 },
                  { sr: scoringResult2, assessment: assessment2 },
                ].map(
                  ({ sr, assessment }) =>
                    sr?.audit?.comparative_analysis && (
                      <div key={assessment.id}>
                        <p className="text-xs font-semibold text-(--color-text-primary) mb-1">
                          {assessment.title}
                        </p>
                        <p className="text-sm text-(--color-text-primary) leading-relaxed">
                          {sr.audit.comparative_analysis}
                        </p>
                      </div>
                    ),
                )}
              </div>
            </div>
          )}

          {/* Score Highlights */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-(--color-text-primary)">Score Highlights</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[
                { sr: scoringResult1, assessment: assessment1, color: 'emerald' },
                { sr: scoringResult2, assessment: assessment2, color: 'blue' },
              ].map(({ sr, assessment, color }) => {
                const subScores = sr?.sub_scores || {};
                const topFactor = Object.entries(subScores).reduce(
                  (a, b) => (b[1] > a[1] ? b : a),
                  ['N/A', 0],
                );
                const focusFactor = Object.entries(subScores).reduce(
                  (a, b) => (b[1] < a[1] ? b : a),
                  ['N/A', 0],
                );
                const avgScore =
                  Object.values(subScores).length > 0
                    ? Math.round(
                        Object.values(subScores).reduce((a, b) => a + b, 0) /
                          Object.values(subScores).length,
                      )
                    : 0;

                const borderColor =
                  color === 'emerald' ? 'border-(--color-success)' : 'border-(--color-info)';
                const bgCard =
                  color === 'emerald' ? 'bg-(--color-success-soft)' : 'bg-(--color-info-soft)';

                return (
                  <div
                    key={assessment.id}
                    className={`p-4 rounded-lg border-2 ${borderColor} ${bgCard} space-y-4`}
                  >
                    <p
                      className={`text-xs font-bold ${
                        color === 'emerald' ? 'text-(--color-success)' : 'text-(--color-info)'
                      } uppercase tracking-wide`}
                    >
                      {assessment.title}
                    </p>

                    <div className="space-y-3">
                      {/* Strongest Factor */}
                      <div className="p-3 rounded-lg border bg-transparent border-(--color-border)">
                        <p className="text-xs font-semibold mb-1 text-(--color-text-muted)">
                          Strongest Factor
                        </p>
                        <p
                          className={`text-lg font-bold ${
                            color === 'emerald' ? 'text-(--color-success)' : 'text-(--color-info)'
                          }`}
                        >
                          {topFactor[0] !== 'N/A' ? titleize(topFactor[0]) : 'N/A'}
                        </p>
                        <p className="text-sm font-semibold text-(--color-text-muted)">
                          {topFactor[0] !== 'N/A' ? `${topFactor[1]}/100` : '—'}
                        </p>
                      </div>

                      {/* Focus Area */}
                      <div className="p-3 rounded-lg border bg-transparent border-(--color-border)">
                        <p className="text-xs font-semibold mb-1 text-(--color-text-muted)">
                          Focus Area
                        </p>
                        <p className="text-lg font-bold text-(--color-warning)">
                          {focusFactor[0] !== 'N/A' ? titleize(focusFactor[0]) : 'N/A'}
                        </p>
                        <p className="text-sm font-semibold text-(--color-text-muted)">
                          {focusFactor[0] !== 'N/A' ? `${focusFactor[1]}/100` : '—'}
                        </p>
                      </div>

                      {/* Average Score */}
                      <div className="p-3 rounded-lg border bg-transparent border-(--color-border)">
                        <p className="text-xs font-semibold mb-1 text-(--color-text-muted)">
                          Average Score
                        </p>
                        <p className="text-lg font-bold text-(--color-accent)">{avgScore}/100</p>
                        <ProgressBar
                          value={avgScore}
                          className="mt-2 h-2 rounded-full bg-(--color-accent)"
                          aria-label={`${assessment.title} average score`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Change Snapshot */}
      <div className="border rounded-xl border-(--color-border) bg-transparent">
        <div className="flex items-center gap-3 pb-4 p-6">
          <div className="p-2.5 rounded-lg bg-(--color-accent-soft)">
            <Target className="text-(--color-accent)" size={20} />
          </div>
          <h3 className="font-bold text-lg text-(--color-text-primary)">
            Scores & Change Snapshot
          </h3>
        </div>
        <div className="p-6 pt-0">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Assessment 1 Score */}
            <div className="p-5 border rounded-xl hover:shadow-md transition-all duration-200">
              <p className="text-xs mb-2 font-semibold uppercase tracking-wide truncate text-(--color-text-muted)">
                {assessment1.title}
              </p>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-4xl font-bold ${
                    (scoringResult1?.overall_score || 0) >= 75
                      ? 'text-(--color-success)'
                      : (scoringResult1?.overall_score || 0) >= 50
                        ? 'text-(--color-warning)'
                        : 'text-(--color-danger)'
                  }`}
                >
                  {scoringResult1?.overall_score || 0}
                </span>
                <span className="text-sm text-slate-500 font-medium">/100</span>
              </div>
              <ProgressBar
                value={scoringResult1?.overall_score || 0}
                className={`mt-2 h-2 rounded-full ${
                  (scoringResult1?.overall_score || 0) >= 75
                    ? 'bg-(--color-success)'
                    : (scoringResult1?.overall_score || 0) >= 50
                      ? 'bg-(--color-warning)'
                      : 'bg-(--color-danger)'
                }`}
                aria-label="Assessment 1 score"
              />
            </div>

            {/* Overall Delta */}
            <div className="p-5 border rounded-xl hover:shadow-md transition-all duration-200">
              <p className="text-xs mb-2 font-semibold uppercase tracking-wide truncate text-(--color-text-muted)">
                Overall Delta
              </p>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-4xl font-bold ${
                    (overallDelta || 0) > 0
                      ? 'text-(--color-success)'
                      : (overallDelta || 0) < 0
                        ? 'text-(--color-danger)'
                        : 'text-(--color-text-muted)'
                  }`}
                >
                  {overallDelta > 0 ? '+' : ''}
                  {overallDelta || 0}
                </span>
              </div>
              <p className="text-xs text-(--color-text-muted) font-medium mt-1">
                {biggestGain?.factor &&
                  `Biggest gain: ${titleize(biggestGain.factor)} (+${biggestGain.delta})`}
              </p>
            </div>

            {/* Assessment 2 Score */}
            <div className="p-5 border rounded-xl hover:shadow-md transition-all duration-200">
              <p className="text-xs mb-2 font-semibold uppercase tracking-wide truncate text-(--color-text-muted)">
                {assessment2.title}
              </p>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-4xl font-bold ${
                    (scoringResult2?.overall_score || 0) >= 75
                      ? 'text-(--color-success)'
                      : (scoringResult2?.overall_score || 0) >= 50
                        ? 'text-(--color-warning)'
                        : 'text-(--color-danger)'
                  }`}
                >
                  {scoringResult2?.overall_score || 0}
                </span>
                <span className="text-sm text-slate-500 font-medium">/100</span>
              </div>
              <ProgressBar
                value={scoringResult2?.overall_score || 0}
                className={`mt-2 h-2 rounded-full ${
                  (scoringResult2?.overall_score || 0) >= 75
                    ? 'bg-(--color-success)'
                    : (scoringResult2?.overall_score || 0) >= 50
                      ? 'bg-(--color-warning)'
                      : 'bg-(--color-danger)'
                }`}
                aria-label="Assessment 2 score"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Score Breakdown Comparison */}
      {scoringResult1?.score_breakdown && scoringResult2?.score_breakdown && (
        <div className="border rounded-xl bg-transparent">
          <div className="flex items-center gap-3 pb-4 p-6">
            <h3 className="font-bold text-lg text-(--color-text-primary)">Score Breakdown</h3>
          </div>
          <div className="p-0">
            <div className="space-y-4 p-4">
              {Object.keys(scoringResult1.score_breakdown).map((category) => {
                const data1 = scoringResult1.score_breakdown[category];
                const data2 = scoringResult2.score_breakdown[category];
                return (
                  <div key={category} className="p-4 rounded-lg bg-(--color-muted-soft)">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-bold text-(--color-text-primary)">
                        {category}
                      </div>
                      <div className="flex gap-4">
                        <div className="text-sm font-bold text-(--color-success)">
                          A1: {data1.score}
                        </div>
                        <div className="text-sm font-bold text-(--color-info)">
                          A2: {data2.score}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs mb-2 text-(--color-text-muted)">{data1.weight}</div>
                    <div className="flex gap-4">
                      <ProgressBar value={data1.score} className="flex-1 h-2" color="success" />
                      <ProgressBar value={data2.score} className="flex-1 h-2" color="info" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

OverviewTab.propTypes = {
  /** First assessment object */
  assessment1: PropTypes.object.isRequired,
  /** Second assessment object */
  assessment2: PropTypes.object.isRequired,
  /** First assessment's scoring result */
  scoringResult1: PropTypes.object.isRequired,
  /** Second assessment's scoring result */
  scoringResult2: PropTypes.object.isRequired,
  /** Key insights about the comparison */
  insights: PropTypes.string,
  /** Overall score delta between assessments */
  overallDelta: PropTypes.number,
  /** Factor with biggest score gain */
  biggestGain: PropTypes.object,
  /** Factor with biggest score drop */
  biggestDrop: PropTypes.object,
  /** Average delta across all factors */
  averageDelta: PropTypes.number,
};

export default OverviewTab;
