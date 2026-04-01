import { ProgressBar } from '@heroui/react';
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
      <div className="border-t border-(--color-border) pt-8 mt-8 first:border-0 first:pt-0 first:mt-0">
        <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-6 flex items-center gap-2">
          <Lightbulb size={14} />
          Input Data & Context
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-3">
              Business Problem
            </p>
            <p className="text-sm text-(--color-text-secondary) leading-relaxed">
              {assessment1?.business_problem || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-3">
              Business Solution
            </p>
            <p className="text-sm text-(--color-text-secondary) leading-relaxed">
              {assessment1?.business_solution || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Derived Metrics Comparison */}
      <div className="border-t border-(--color-border) pt-8 mt-8 first:border-0 first:pt-0 first:mt-0">
        <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-6">
          Derived Metrics
        </p>

        <div className="space-y-0">
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
                className="flex justify-between items-center py-2.5 border-b border-(--color-border) last:border-0 text-sm"
              >
                <span className="text-(--color-text-muted)">{label}</span>
                <div className="flex items-center gap-4">
                  <span
                    className={`font-medium ${winner === 1 ? 'text-(--color-success)' : 'text-(--color-text-muted)'}`}
                  >
                    A1: {val1}
                  </span>
                  <span
                    className={`font-medium ${winner === 2 ? 'text-(--color-success)' : 'text-(--color-text-muted)'}`}
                  >
                    A2: {val2}
                  </span>
                </div>
              </div>
            );
          })}

          <div className="flex justify-between items-center py-2.5 border-b border-(--color-border) last:border-0 text-sm">
            <span className="text-(--color-text-muted)">Risk Level</span>
            <div className="flex items-center gap-4">
              <Chip
                variant="tag"
                className={`text-xs ${
                  scoringResult1?.derived_metrics?.risk_level === 'low'
                    ? 'text-(--color-success)'
                    : scoringResult1?.derived_metrics?.risk_level === 'medium'
                      ? 'text-(--color-warning)'
                      : 'text-(--color-danger)'
                }`}
              >
                A1: {scoringResult1?.derived_metrics?.risk_level || 'N/A'}
              </Chip>
              <Chip
                variant="tag"
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

      {/* Evaluation Parameters Summary */}
      <div className="border-t border-(--color-border) pt-8 mt-8 first:border-0 first:pt-0 first:mt-0">
        <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-6">
          Evaluation Parameters
        </p>

        <div className="space-y-0">
          {Object.entries(
            assessment1?.evaluation_parameters ||
              assessment1?.result_json?.evaluation_parameters ||
              {},
          ).map(([key, value1]) => {
            const value2 =
              assessment2?.evaluation_parameters?.[key] ||
              assessment2?.result_json?.evaluation_parameters?.[key];
            return (
              <div
                key={key}
                className="flex justify-between items-center py-2.5 border-b border-(--color-border) last:border-0 text-sm"
              >
                <span className="text-(--color-text-muted) capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-(--color-text-primary) font-medium">
                    {String(value1).substring(0, 30)}
                    {String(value1).length > 30 ? '...' : ''}
                  </span>
                  <span className="text-(--color-text-primary) font-medium">
                    {String(value2 || '').substring(0, 30)}
                    {String(value2 || '').length > 30 ? '...' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Business Context Comparison */}
      <div className="border-t border-(--color-border) pt-8 mt-8 first:border-0 first:pt-0 first:mt-0">
        <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-6">
          Business Context
        </p>

        <div className="space-y-0">
          {(() => {
            const ctx1 =
              assessment1?.result_json?.business_context || assessment1?.business_context || {};
            const ctx2 =
              assessment2?.result_json?.business_context || assessment2?.business_context || {};
            const allKeys = new Set([...Object.keys(ctx1), ...Object.keys(ctx2)]);

            if (allKeys.size === 0) {
              return (
                <div className="text-center py-6 text-(--color-text-muted)">
                  No business context data available
                </div>
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
                <div
                  key={key}
                  className="flex justify-between items-center py-2.5 border-b border-(--color-border) last:border-0 text-sm"
                >
                  <span className="text-(--color-text-muted) capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-4">
                    <span
                      className={`font-medium ${
                        val1Str === val2Str ? 'text-(--color-text-muted)' : 'text-(--color-warning)'
                      }`}
                    >
                      {val1Str.substring(0, 30)}
                      {val1Str.length > 30 ? '...' : ''}
                    </span>
                    <span
                      className={`font-medium ${
                        val1Str === val2Str ? 'text-(--color-text-muted)' : 'text-(--color-warning)'
                      }`}
                    >
                      {val2Str.substring(0, 30)}
                      {val2Str.length > 30 ? '...' : ''}
                    </span>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
      {/* Key Insights */}
      {insights && insights.length > 0 && (
        <div className="border-t border-(--color-border) pt-8 mt-8 first:border-0 first:pt-0 first:mt-0">
          <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-6 flex items-center gap-2">
            <Lightbulb size={14} />
            Key Insights
          </p>

          <div className="space-y-4">
            {insights.map((insight, idx) => {
              const IconComponent = insight.icon;
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
      <div className="border-t border-(--color-border) pt-8 mt-8 first:border-0 first:pt-0 first:mt-0">
        <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-6 flex items-center gap-2">
          <Lightbulb size={14} />
          Executive Summary
        </p>

        {/* Audit Verdicts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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
          <div className="p-5 pl-4 border-l-4 border-(--color-info) bg-(--color-info-soft) rounded-r-lg mb-8">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

              return (
                <div key={assessment.id} className="space-y-4">
                  <p
                    className={`text-xs font-bold ${
                      color === 'emerald' ? 'text-(--color-success)' : 'text-(--color-info)'
                    } uppercase tracking-wide`}
                  >
                    {assessment.title}
                  </p>

                  <div className="space-y-4">
                    {/* Strongest Factor */}
                    <div className="p-4 border border-(--color-border) rounded-lg">
                      <p className="text-xs font-semibold mb-2 text-(--color-text-muted)">
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
                    <div className="p-4 border border-(--color-border) rounded-lg">
                      <p className="text-xs font-semibold mb-2 text-(--color-text-muted)">
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
                    <div className="p-4 border border-(--color-border) rounded-lg">
                      <p className="text-xs font-semibold mb-2 text-(--color-text-muted)">
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

      {/* Change Snapshot */}
      <div className="border-t border-(--color-border) pt-8 mt-8 first:border-0 first:pt-0 first:mt-0">
        <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-6 flex items-center gap-2">
          <Target size={14} />
          Scores & Change Snapshot
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assessment 1 Score */}
          <div className="p-5 border border-(--color-border) rounded-lg hover:shadow-md transition-all duration-200">
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
          <div className="p-5 border border-(--color-border) rounded-lg hover:shadow-md transition-all duration-200">
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
          <div className="p-5 border border-(--color-border) rounded-lg hover:shadow-md transition-all duration-200">
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

      {/* Score Breakdown Comparison */}
      {scoringResult1?.score_breakdown && scoringResult2?.score_breakdown && (
        <div className="border-t border-(--color-border) pt-8 mt-8 first:border-0 first:pt-0 first:mt-0">
          <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-6">
            Score Breakdown
          </p>

          <div className="space-y-4">
            {Object.keys(scoringResult1.score_breakdown).map((category) => {
              const data1 = scoringResult1.score_breakdown[category];
              const data2 = scoringResult2.score_breakdown[category];
              return (
                <div key={category} className="p-4 border border-(--color-border) rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-bold text-(--color-text-primary)">{category}</div>
                    <div className="flex gap-4">
                      <div className="text-sm font-bold text-(--color-success)">
                        A1: {data1.score}
                      </div>
                      <div className="text-sm font-bold text-(--color-info)">A2: {data2.score}</div>
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
