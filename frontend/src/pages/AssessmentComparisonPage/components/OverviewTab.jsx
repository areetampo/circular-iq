import { Card, Chip, ProgressBar, Table } from '@heroui/react';
import { Lightbulb, Target } from 'lucide-react';
import PropTypes from 'prop-types';

import { titleize } from '@/lib/formatting';
import { getRiskBadgeColor } from '@/lib/scoring';

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
      <div
        className="border-2 shadow-md rounded-xl"
        style={{
          background: 'linear-gradient(to bottom right, var(--accent-soft), var(--surface))',
          borderColor: 'var(--accent)',
        }}
      >
        <div className="flex items-center gap-3 pb-4 p-6">
          <div
            className="p-2.5 rounded-lg"
            style={{
              background: 'linear-gradient(to bottom right, var(--accent-soft), var(--accent))',
            }}
          >
            <Lightbulb size={20} style={{ color: 'var(--accent)' }} />
          </div>
          <h3
            className="font-bold text-lg"
            style={{
              color: 'var(--foreground)',
            }}
          >
            Input Data & Context
          </h3>
        </div>
        <div className="space-y-6 p-6 pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Business Problem */}
            <div
              className="border-2 shadow-md rounded-xl"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="flex items-center gap-3 pb-4 p-6">
                <h3
                  className="font-bold text-lg"
                  style={{
                    color: 'var(--foreground)',
                  }}
                >
                  Business Problem
                </h3>
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
                        <Table.Row
                          className="transition-colors duration-150"
                          style={{ backgroundColor: 'var(--accent-soft)' }}
                        >
                          <Table.Cell>
                            <div>
                              <p
                                className="text-sm font-semibold mb-2"
                                style={{
                                  color: 'var(--foreground)',
                                }}
                              >
                                {assessment1?.title || 'Assessment 1'}
                              </p>
                              <p
                                className="text-sm leading-relaxed"
                                style={{
                                  color: 'var(--muted)',
                                }}
                              >
                                {assessment1?.business_problem || 'N/A'}
                              </p>
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <div>
                              <p
                                className="text-sm font-semibold mb-2"
                                style={{
                                  color: 'var(--foreground)',
                                }}
                              >
                                {assessment2?.title || 'Assessment 2'}
                              </p>
                              <p
                                className="text-sm leading-relaxed"
                                style={{
                                  color: 'var(--muted)',
                                }}
                              >
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
            <Card
              className="border-2 shadow-md rounded-xl"
              style={{ borderColor: 'var(--info)', backgroundColor: 'var(--surface)' }}
            >
              <Card.Header className="flex items-center gap-3 pb-4">
                <Card.Title className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                  Business Solution
                </Card.Title>
              </Card.Header>
              <Card.Content className="p-0">
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
                        <Table.Row className="hover:bg-[var(--surface-hover)] transition-colors duration-150">
                          <Table.Cell className="align-top">
                            <div>
                              <p
                                className="text-sm font-semibold mb-2"
                                style={{ color: 'var(--foreground)' }}
                              >
                                {assessment1?.title || 'Assessment 1'}
                              </p>
                              <p
                                className="text-sm leading-relaxed"
                                style={{ color: 'var(--muted)' }}
                              >
                                {assessment1?.business_solution || 'N/A'}
                              </p>
                            </div>
                          </Table.Cell>
                          <Table.Cell className="align-top">
                            <div>
                              <p
                                className="text-sm font-semibold mb-2"
                                style={{ color: 'var(--foreground)' }}
                              >
                                {assessment2?.title || 'Assessment 2'}
                              </p>
                              <p
                                className="text-sm leading-relaxed"
                                style={{ color: 'var(--muted)' }}
                              >
                                {assessment2?.business_solution || 'N/A'}
                              </p>
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      </Table.Body>
                    </Table.Content>
                  </Table.ScrollContainer>
                </Table>
              </Card.Content>
            </Card>
          </div>

          {/* Derived Metrics Comparison */}
          <Card
            className="border-2 shadow-md rounded-xl"
            style={{ borderColor: 'var(--success)', backgroundColor: 'var(--surface)' }}
          >
            <Card.Header className="flex items-center gap-3 pb-4">
              <Card.Title className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                Derived Metrics
              </Card.Title>
            </Card.Header>
            <Card.Content className="p-0">
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
                    <div
                      key={key}
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: 'var(--surface)' }}
                    >
                      <div
                        className="text-xs font-bold mb-2"
                        style={{ color: 'var(--foreground)' }}
                      >
                        {label}
                      </div>
                      <div className="flex items-center justify-between">
                        <div
                          className={`text-sm font-bold ${winner === 1 ? 'text-success' : ''}`}
                          style={{ color: winner === 1 ? 'var(--success)' : 'var(--muted)' }}
                        >
                          A1: {val1}
                        </div>
                        <div
                          className={`text-sm font-bold ${winner === 2 ? 'text-success' : ''}`}
                          style={{ color: winner === 2 ? 'var(--success)' : 'var(--muted)' }}
                        >
                          A2: {val2}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
                  <div className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
                    Risk Level
                  </div>
                  <div className="flex items-center justify-between">
                    <Chip
                      variant="soft"
                      className={`text-xs ${getRiskBadgeColor(scoringResult1?.derived_metrics?.risk_level)}`}
                    >
                      A1: {scoringResult1?.derived_metrics?.risk_level || 'N/A'}
                    </Chip>
                    <Chip
                      variant="soft"
                      className={`text-xs ${getRiskBadgeColor(scoringResult2?.derived_metrics?.risk_level)}`}
                    >
                      A2: {scoringResult2?.derived_metrics?.risk_level || 'N/A'}
                    </Chip>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Evaluation Parameters Summary */}
          <Card
            className="border-2 shadow-md rounded-xl"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
          >
            <Card.Header className="flex items-center gap-3 pb-4">
              <Card.Title className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                Evaluation Parameters
              </Card.Title>
            </Card.Header>
            <Card.Content className="p-0 overflow-x-auto">
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
                            className="hover:bg-[var(--surface-hover)] transition-colors duration-150"
                          >
                            <Table.Cell
                              className="font-medium capitalize"
                              style={{ color: 'var(--foreground)' }}
                            >
                              {key.replace(/_/g, ' ')}
                            </Table.Cell>
                            <Table.Cell className="text-center" style={{ color: 'var(--muted)' }}>
                              {String(value1).substring(0, 30)}
                              {String(value1).length > 30 ? '...' : ''}
                            </Table.Cell>
                            <Table.Cell className="text-center" style={{ color: 'var(--muted)' }}>
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
            </Card.Content>
          </Card>

          {/* Business Context Comparison */}
          <Card
            className="border-2 shadow-md rounded-xl"
            style={{ borderColor: 'var(--warning)', backgroundColor: 'var(--surface)' }}
          >
            <Card.Header className="flex items-center gap-3 pb-4">
              <Card.Title className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                Business Context
              </Card.Title>
            </Card.Header>
            <Card.Content className="p-0 overflow-x-auto">
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
                              <Table.Cell
                                className="text-center py-6"
                                style={{ color: 'var(--muted)' }}
                              >
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
                              className={`hover:bg-[var(--surface-hover)] transition-colors duration-150 ${
                                val1Str === val2Str ? '' : 'bg-[var(--warning-soft)]/30'
                              }`}
                            >
                              <Table.Cell
                                className="font-medium capitalize"
                                style={{ color: 'var(--foreground)' }}
                              >
                                {key.replace(/_/g, ' ')}
                              </Table.Cell>
                              <Table.Cell
                                className={`text-center ${val1Str === val2Str ? '' : 'font-semibold'}`}
                                style={{
                                  color: val1Str === val2Str ? 'var(--muted)' : 'var(--warning)',
                                }}
                              >
                                {val1Str.substring(0, 30)}
                                {val1Str.length > 30 ? '...' : ''}
                              </Table.Cell>
                              <Table.Cell
                                className={`text-center ${val1Str === val2Str ? '' : 'font-semibold'}`}
                                style={{
                                  color: val1Str === val2Str ? 'var(--muted)' : 'var(--warning)',
                                }}
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
            </Card.Content>
          </Card>
        </div>
      </div>

      {/* Key Insights */}
      {insights && insights.length > 0 && (
        <Card
          className="border-2 shadow-md rounded-xl"
          style={{
            borderColor: 'var(--info)',
            background: 'linear-gradient(to bottom right, var(--info-soft)/30, var(--background))',
          }}
        >
          <Card.Header className="flex items-center gap-3 pb-4">
            <div
              className="p-2.5 rounded-lg"
              style={{
                background: 'linear-gradient(to bottom right, var(--info-soft), var(--info-soft))',
              }}
            >
              <Lightbulb style={{ color: 'var(--info)' }} size={20} />
            </div>
            <Card.Title className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
              Key Insights
            </Card.Title>
          </Card.Header>
          <Card.Content className="gap-3 flex flex-col">
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
                  className="flex items-center gap-3 p-4 rounded-r-lg transition-all duration-200 hover:shadow-md"
                  style={{
                    backgroundColor:
                      insight.type === 'positive'
                        ? 'var(--success-soft)'
                        : insight.type === 'negative'
                          ? 'var(--danger-soft)'
                          : 'var(--surface)',
                    borderLeftColor:
                      insight.type === 'positive'
                        ? 'var(--success)'
                        : insight.type === 'negative'
                          ? 'var(--danger)'
                          : 'var(--border)',
                    borderLeftWidth: '4px',
                    color:
                      insight.type === 'positive'
                        ? 'var(--success)'
                        : insight.type === 'negative'
                          ? 'var(--danger)'
                          : 'var(--foreground)',
                  }}
                >
                  <IconComponent className="shrink-0" strokeWidth={2.5} size={20} />
                  <p className="text-sm font-medium m-0">{insight.text}</p>
                </div>
              );
            })}
          </Card.Content>
        </Card>
      )}

      {/* Executive Summary & Score Highlights */}
      <Card className="border-2 border-purple-200 shadow-md rounded-xl bg-linear-to-br from-purple-50/30 to-white">
        <Card.Header className="flex items-center gap-3 pb-4">
          <div className="p-2.5 rounded-lg bg-linear-to-br from-purple-100 to-purple-200">
            <Lightbulb className="text-purple-700" size={20} />
          </div>
          <Card.Title className="font-bold text-lg text-slate-900">Executive Summary</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-6">
          {/* Audit Verdicts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              { sr: scoringResult1, assessment: assessment1, color: 'emerald' },
              { sr: scoringResult2, assessment: assessment2, color: 'blue' },
            ].map(({ sr, assessment, color }) => {
              const borderColor = color === 'emerald' ? 'border-emerald-500' : 'border-blue-500';
              const bgColor = color === 'emerald' ? 'bg-emerald-50' : 'bg-blue-50';
              return (
                <div
                  key={assessment.id}
                  className={`p-5 pl-4 border-l-4 ${borderColor} ${bgColor} rounded-r-lg hover:shadow-md transition-all duration-200`}
                >
                  <p
                    className={`text-sm font-bold ${color === 'emerald' ? 'text-emerald-700' : 'text-blue-700'} uppercase mb-2 tracking-wide`}
                  >
                    {assessment.title}
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {sr?.audit?.audit_verdict || 'No verdict available'}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Comparative Analysis */}
          {(scoringResult1?.audit?.comparative_analysis ||
            scoringResult2?.audit?.comparative_analysis) && (
            <div className="p-5 pl-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
              <p className="text-xs font-semibold text-blue-900 uppercase mb-2 tracking-wide">
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
                        <p className="text-xs font-semibold text-slate-700 mb-1">
                          {assessment.title}
                        </p>
                        <p className="text-sm text-slate-700 leading-relaxed">
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
            <h4 className="text-sm font-bold text-slate-900 mb-4">Score Highlights</h4>
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

                const borderColor = color === 'emerald' ? 'border-emerald-300' : 'border-blue-300';
                const bgCard = color === 'emerald' ? 'bg-emerald-50/50' : 'bg-blue-50/50';

                return (
                  <div
                    key={assessment.id}
                    className={`p-4 rounded-lg border-2 ${borderColor} ${bgCard} space-y-4`}
                  >
                    <p
                      className={`text-xs font-bold ${color === 'emerald' ? 'text-emerald-900' : 'text-blue-900'} uppercase tracking-wide`}
                    >
                      {assessment.title}
                    </p>

                    <div className="space-y-3">
                      {/* Strongest Factor */}
                      <div className="p-3 bg-white rounded-lg border border-slate-200">
                        <p className="text-xs font-semibold text-slate-600 mb-1">
                          Strongest Factor
                        </p>
                        <p
                          className={`text-lg font-bold ${color === 'emerald' ? 'text-emerald-700' : 'text-blue-700'}`}
                        >
                          {topFactor[0] !== 'N/A' ? titleize(topFactor[0]) : 'N/A'}
                        </p>
                        <p className="text-sm text-slate-600 font-semibold">
                          {topFactor[0] !== 'N/A' ? `${topFactor[1]}/100` : '—'}
                        </p>
                      </div>

                      {/* Focus Area */}
                      <div className="p-3 bg-white rounded-lg border border-slate-200">
                        <p className="text-xs font-semibold text-slate-600 mb-1">Focus Area</p>
                        <p className="text-lg font-bold text-orange-700">
                          {focusFactor[0] !== 'N/A' ? titleize(focusFactor[0]) : 'N/A'}
                        </p>
                        <p className="text-sm text-slate-600 font-semibold">
                          {focusFactor[0] !== 'N/A' ? `${focusFactor[1]}/100` : '—'}
                        </p>
                      </div>

                      {/* Average Score */}
                      <div className="p-3 bg-white rounded-lg border border-slate-200">
                        <p className="text-xs font-semibold text-slate-600 mb-1">Average Score</p>
                        <p className="text-lg font-bold text-purple-700">{avgScore}/100</p>
                        <ProgressBar
                          value={avgScore}
                          className="mt-2 h-2 rounded-full bg-purple-500"
                          aria-label={`${assessment.title} average score`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Change Snapshot */}
      <Card className="border-2 border-orange-200 shadow-md rounded-xl bg-linear-to-br from-orange-50/30 to-white">
        <Card.Header className="flex items-center gap-3 pb-4">
          <div className="p-2.5 rounded-lg bg-linear-to-br from-orange-100 to-orange-200">
            <Target className="text-orange-700" size={20} />
          </div>
          <Card.Title className="font-bold text-lg text-slate-900">
            Scores & Change Snapshot
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Assessment 1 Score */}
            <div className="p-5 bg-linear-to-br from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <p className="text-xs text-slate-600 mb-2 font-semibold uppercase tracking-wide truncate">
                {assessment1.title}
              </p>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-4xl font-bold ${
                    (scoringResult1?.overall_score || 0) >= 75
                      ? 'text-emerald-700'
                      : (scoringResult1?.overall_score || 0) >= 50
                        ? 'text-amber-600'
                        : 'text-red-600'
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
                    ? 'bg-emerald-500'
                    : (scoringResult1?.overall_score || 0) >= 50
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                }`}
                aria-label="Assessment 1 score"
              />
            </div>

            {/* Assessment 2 Score */}
            <div className="p-5 bg-linear-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <p className="text-xs text-slate-600 mb-2 font-semibold uppercase tracking-wide truncate">
                {assessment2.title}
              </p>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-4xl font-bold ${
                    (scoringResult2?.overall_score || 0) >= 75
                      ? 'text-emerald-700'
                      : (scoringResult2?.overall_score || 0) >= 50
                        ? 'text-amber-600'
                        : 'text-red-600'
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
                    ? 'bg-emerald-500'
                    : (scoringResult2?.overall_score || 0) >= 50
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                }`}
                aria-label="Assessment 2 score"
              />
            </div>

            {/* Overall Change */}
            <div className="p-5 bg-linear-to-br from-slate-50 to-white border-2 border-slate-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <p className="text-xs text-slate-600 mb-2 font-semibold uppercase tracking-wide">
                Overall Change
              </p>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-4xl font-bold ${
                    overallDelta > 0
                      ? 'text-emerald-600'
                      : overallDelta < 0
                        ? 'text-red-600'
                        : 'text-slate-500'
                  }`}
                >
                  {overallDelta > 0 ? '+' : ''}
                  {overallDelta}
                </span>
                <span className="text-sm text-slate-500 font-medium">pts</span>
              </div>
            </div>

            {biggestGain && (
              <div className="p-5 bg-linear-to-br from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                <p className="text-xs text-slate-600 mb-2 font-semibold uppercase tracking-wide">
                  Biggest Gain
                </p>
                <p className="text-4xl font-bold text-emerald-700">+{biggestGain.diff}</p>
                <p className="text-xs text-slate-600 truncate mt-1 font-medium">
                  {biggestGain.label}
                </p>
              </div>
            )}

            {biggestDrop && (
              <div className="p-5 bg-linear-to-br from-red-50 to-orange-50 border-2 border-red-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                <p className="text-xs text-slate-600 mb-2 font-semibold uppercase tracking-wide">
                  Biggest Drop
                </p>
                <p className="text-4xl font-bold text-red-700">{biggestDrop.diff}</p>
                <p className="text-xs text-slate-600 truncate mt-1 font-medium">
                  {biggestDrop.label}
                </p>
              </div>
            )}

            <div className="p-5 bg-linear-to-br from-purple-50 to-violet-50 border-2 border-purple-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <p className="text-xs text-slate-600 mb-2 font-semibold uppercase tracking-wide">
                Avg Change
              </p>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-4xl font-bold ${
                    averageDelta > 0
                      ? 'text-emerald-600'
                      : averageDelta < 0
                        ? 'text-red-600'
                        : 'text-slate-500'
                  }`}
                >
                  {averageDelta > 0 ? '+' : ''}
                  {averageDelta}
                </span>
                <span className="text-sm text-slate-500 font-medium">pts</span>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Score Breakdown Comparison */}
      {scoringResult1?.score_breakdown && scoringResult2?.score_breakdown && (
        <Card className="border-2 border-purple-200 shadow-md rounded-xl bg-white">
          <Card.Header className="flex items-center gap-3 pb-4">
            <Card.Title className="font-bold text-lg text-slate-900">Score Breakdown</Card.Title>
          </Card.Header>
          <Card.Content className="p-0">
            <div className="space-y-4 p-4">
              {Object.keys(scoringResult1.score_breakdown).map((category) => {
                const data1 = scoringResult1.score_breakdown[category];
                const data2 = scoringResult2.score_breakdown[category];
                return (
                  <div key={category} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-bold text-slate-900">{category}</div>
                      <div className="flex gap-4">
                        <div className="text-sm font-bold text-emerald-700">A1: {data1.score}</div>
                        <div className="text-sm font-bold text-blue-700">A2: {data2.score}</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 mb-2">{data1.weight}</div>
                    <div className="flex gap-4">
                      <ProgressBar value={data1.score} className="flex-1 h-2" color="success" />
                      <ProgressBar value={data2.score} className="flex-1 h-2" color="primary" />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card.Content>
        </Card>
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
