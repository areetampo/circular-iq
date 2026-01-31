import React from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import { exportComparisonCSV } from '@/features/export';
import Loader from '@/components/common/Loader';
import AppContainer from '@/components/layout/AppContainer';
import { formatTimestamp, getCurrentTimestampFormatted, titleize } from '@/lib/formatting';
import { useAssessmentComparison } from '@/features/assessments';
import { Button } from '@/components/ui/button';

export default function AssessmentComparisonPage({ onBack = () => {} }) {
  const { id1, id2 } = useParams();

  // Fetch both assessments and comparison data using hook
  const { assessment1, assessment2, comparisonData, isLoading, isError, error } =
    useAssessmentComparison(id1, id2);

  if (isLoading)
    return (
      <Loader heading="Loading comparison..." message="Fetching assessment data for comparison." />
    );
  if (isError)
    return (
      <div className="app-container">
        <p className="text-[#dc3545] py-8 text-center">{error}</p>
      </div>
    );
  if (!assessment1 || !assessment2)
    return (
      <div className="app-container">
        <p>Assessment not found</p>
      </div>
    );

  // Use comparison data from hook and derive additional metrics for UI
  const factorDiffs = Object.entries(comparisonData.factorDiffs || {}).map(([factor, diff]) => {
    const a1 = assessment1.result_json?.sub_scores?.[factor] || 0;
    const a2 = assessment2.result_json?.sub_scores?.[factor] || 0;
    return {
      factor,
      label: titleize(factor),
      diff,
      a1,
      a2,
    };
  });

  const overallDelta = comparisonData.overallDiff;
  const biggestGain = comparisonData.biggestGain
    ? {
        ...comparisonData.biggestGain,
        label: titleize(comparisonData.biggestGain.factor),
      }
    : null;
  const biggestDrop = comparisonData.biggestDrop
    ? {
        ...comparisonData.biggestDrop,
        label: titleize(comparisonData.biggestDrop.factor),
      }
    : null;
  const averageDelta =
    factorDiffs.length > 0
      ? Math.round(factorDiffs.reduce((sum, f) => sum + f.diff, 0) / factorDiffs.length)
      : 0;

  const compareMetric = (label, val1, val2, unit = '') => {
    const diff = val2 - val1;
    const change = diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '0';
    const changeClass = diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral';

    return (
      <div className="grid gap-4 items-center py-4 px-4 bg-gray-50 rounded-md border-l-[3px] border-l-gray-300 transition-all duration-200 ease-in-out hover:bg-gray-100 hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)] grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_0.8fr]">
        <div className="font-semibold text-[#2c3e50] text-[0.95rem] col-span-1 md:col-auto text-sm md:text-base">
          {label}
        </div>
        <div className="px-3 py-3 text-base font-bold text-center rounded bg-[#e8f5e9] text-[#1b5e20]">
          {val1}
          {unit}
        </div>
        <div className="px-3 py-3 text-base font-bold text-center rounded bg-[#e3f2fd] text-[#1565c0]">
          {val2}
          {unit}
        </div>
        <div
          className={`px-2 py-2 text-sm font-bold text-center rounded ${
            changeClass === 'positive'
              ? 'text-[#28a745] bg-[#d4edda]'
              : changeClass === 'negative'
                ? 'text-[#dc3545] bg-[#f8d7da]'
                : 'text-gray-400 bg-[#e9ecef]'
          }`}
        >
          {change}
          {unit}
        </div>
      </div>
    );
  };

  // Generate insights
  const generateInsights = () => {
    const score1 = assessment1.result_json?.overall_score || 0;
    const score2 = assessment2.result_json?.overall_score || 0;
    const diff = score2 - score1;
    const insights = [];

    // Overall trend
    if (diff > 5) {
      insights.push({
        type: 'positive',
        emoji: '📈',
        text: `Significant improvement: ${diff} point gain from ${score1} to ${score2}`,
      });
    } else if (diff > 0) {
      insights.push({
        type: 'positive',
        emoji: '📈',
        text: `Modest improvement: ${diff} point increase`,
      });
    } else if (diff < -5) {
      insights.push({
        type: 'negative',
        emoji: '📉',
        text: `Decline detected: ${Math.abs(diff)} point drop from ${score1} to ${score2}`,
      });
    } else if (diff < 0) {
      insights.push({
        type: 'negative',
        emoji: '📉',
        text: `Minor decline: ${Math.abs(diff)} point decrease`,
      });
    } else {
      insights.push({ type: 'neutral', emoji: '➡️', text: 'Overall scores remain stable' });
    }

    // Strongest and weakest factors
    const strongest = factorDiffs.reduce((a, b) => (a.diff > b.diff ? a : b), factorDiffs[0] || {});
    const weakest = factorDiffs.reduce((a, b) => (a.diff < b.diff ? a : b), factorDiffs[0] || {});

    if (strongest && strongest.diff > 2) {
      insights.push({
        type: 'positive',
        emoji: '⭐',
        text: `Strongest improvement in ${strongest.label || titleize(strongest.factor)} (+${strongest.diff} points)`,
      });
    }

    if (weakest && weakest.diff < -2) {
      insights.push({
        type: 'negative',
        emoji: '⚠️',
        text: `Notable decline in ${weakest.label || titleize(weakest.factor)} (${weakest.diff} points)`,
      });
    }

    // Top performer
    const sub2 = assessment2.result_json?.sub_scores || {};
    const topScore = Math.max(...Object.values(sub2));
    const topFactor = Object.keys(sub2).find((k) => sub2[k] === topScore);
    if (topFactor && topScore >= 80) {
      insights.push({
        type: 'positive',
        emoji: '💪',
        text: `${topFactor.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} is a strength (${topScore} / 100)`,
      });
    }

    // Areas needing work
    const lowScore = Math.min(...Object.values(sub2));
    const lowFactor = Object.keys(sub2).find((k) => sub2[k] === lowScore);
    if (lowFactor && lowScore < 50) {
      insights.push({
        type: 'negative',
        emoji: '🎯',
        text: `Priority improvement: ${lowFactor.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} (${lowScore} / 100)`,
      });
    }

    return insights;
  };

  const insights = generateInsights();

  return (
    <AppContainer
      headerProps={{
        title: 'Assessment Comparison',
        subtitle: `Side-by-side analysis of ${assessment1.title} and ${assessment2.title}`,
        showEvaluationCriteriaButton: true,
      }}
    >
      {/* Key Insights Section */}
      {insights && insights.length > 0 && (
        <div className="bg-gradient-to-br from-[#fff9e6] to-[#fffbf0] py-8 px-8 md:px-6 rounded-[10px] border-2 border-[#ff9800] mb-8 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <h3 className="text-[#ff6f00] mt-0 flex items-center gap-2 mb-6 text-[1.3rem] border-b-2 border-[#ff9800] pb-3 font-bold">
            💡 Key Insights
          </h3>
          <div className="flex flex-col gap-3">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 py-3 px-3 rounded-md text-[0.95rem] ${
                  insight.type === 'positive'
                    ? 'bg-[#e8f5e9] border-l-[3px] border-l-[#34a83a]'
                    : insight.type === 'negative'
                      ? 'bg-[#ffebee] border-l-[3px] border-l-[#e74c3c]'
                      : 'bg-gray-100 border-l-[3px] border-l-gray-500'
                }`}
              >
                <div className="text-[1.3rem] min-w-[30px]">{insight.emoji}</div>
                <div className="text-[#2c3e50] font-medium flex-1">{insight.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Change Snapshot */}
      <div className="bg-white py-8 px-8 md:px-6 rounded-[10px] border border-gray-300 mb-8 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <h3 className="mt-0 mb-6 text-[#2c3e50] text-[1.3rem] border-b-2 border-[#34a83a] pb-3 font-bold">
          📊 Change Snapshot
        </h3>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
          <div className="bg-[#f9fafb] border border-gray-300 rounded-[10px] py-4 px-4 shadow-[0_2px_6px_rgba(0,0,0,0.04)]">
            <div className="text-[0.85rem] text-gray-600 mb-1.5 font-semibold">Overall Change</div>
            <div
              className={`text-[1.6rem] font-extrabold flex items-baseline gap-1 ${
                overallDelta > 0
                  ? 'text-[#2e7d32]'
                  : overallDelta < 0
                    ? 'text-[#c62828]'
                    : 'text-[#607d8b]'
              }`}
            >
              {overallDelta > 0 ? '+' : ''}
              {overallDelta}
              <span className="text-[0.85rem] font-semibold">pts</span>
            </div>
          </div>
          {biggestGain && (
            <div className="bg-[#f9fafb] border border-gray-300 rounded-[10px] py-4 px-4 shadow-[0_2px_6px_rgba(0,0,0,0.04)]">
              <div className="text-[0.85rem] text-gray-600 mb-1.5 font-semibold">Biggest Gain</div>
              <div className="text-[1.6rem] font-extrabold text-[#2e7d32] flex items-baseline gap-1">
                +{biggestGain.diff}
                <span className="text-[0.85rem] font-semibold">pts</span>
              </div>
              <div className="mt-1 text-gray-600 text-[0.85rem]">{biggestGain.label}</div>
            </div>
          )}
          {biggestDrop && (
            <div className="bg-[#f9fafb] border border-gray-300 rounded-[10px] py-4 px-4 shadow-[0_2px_6px_rgba(0,0,0,0.04)]">
              <div className="text-[0.85rem] text-gray-600 mb-1.5 font-semibold">Biggest Drop</div>
              <div className="text-[1.6rem] font-extrabold text-[#c62828] flex items-baseline gap-1">
                {biggestDrop.diff}
                <span className="text-[0.85rem] font-semibold">pts</span>
              </div>
              <div className="mt-1 text-gray-600 text-[0.85rem]">{biggestDrop.label}</div>
            </div>
          )}
          <div className="bg-[#f9fafb] border border-gray-300 rounded-[10px] py-4 px-4 shadow-[0_2px_6px_rgba(0,0,0,0.04)]">
            <div className="text-[0.85rem] text-gray-600 mb-1.5 font-semibold">Avg Change</div>
            <div
              className={`text-[1.6rem] font-extrabold flex items-baseline gap-1 ${
                averageDelta > 0
                  ? 'text-[#2e7d32]'
                  : averageDelta < 0
                    ? 'text-[#c62828]'
                    : 'text-[#607d8b]'
              }`}
            >
              {averageDelta > 0 ? '+' : ''}
              {averageDelta}
              <span className="text-[0.85rem] font-semibold">pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Header with Assessment Titles */}
      <div className="grid items-center gap-8 mb-12 grid-cols-1 lg:grid-cols-[1fr_auto_1fr] lg:gap-4">
        <div
          className="bg-white py-8 px-8 md:px-4 rounded-[10px] border-l-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
          style={{ borderLeftColor: '#34a83a' }}
        >
          <h2 className="mt-0 mb-2 text-[#2c3e50] text-[1.3rem] font-bold">{assessment1.title}</h2>
          <p className="m-0 text-sm text-gray-400">{formatTimestamp(assessment1.created_at)}</p>
        </div>
        <div className="hidden text-2xl font-bold text-center text-gray-400 lg:block">vs</div>
        <div
          className="bg-white py-8 px-8 md:px-4 rounded-[10px] border-l-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
          style={{ borderLeftColor: '#4a90e2' }}
        >
          <h2 className="mt-0 mb-2 text-[#2c3e50] text-[1.3rem] font-bold">{assessment2.title}</h2>
          <p className="m-0 text-sm text-gray-400">{formatTimestamp(assessment2.created_at)}</p>
        </div>
      </div>

      {/* Overall Score Comparison */}
      <div className="bg-white py-8 px-8 md:px-6 rounded-[10px] border border-gray-300 mb-8 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <h3 className="mt-0 mb-6 text-[#2c3e50] text-[1.3rem] border-b-2 border-[#34a83a] pb-3 font-bold">
          🎯 Overall Score Comparison
        </h3>
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3 md:gap-4">
          <div
            className="px-8 md:px-6 py-8 md:py-6 text-center transition-all duration-300 ease-in-out border-2 rounded-lg border-[#c8e6c9] hover:shadow-[0_4px_12px_rgba(52,168,58,0.15)] hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #f1f8f5 0%, #fff 100%)' }}
          >
            <div className="mb-3 text-sm font-semibold tracking-wider text-gray-600 uppercase">
              {assessment1.title}
            </div>
            <div className="text-center text-[2.5rem] md:text-[2rem] font-bold text-[#34a83a] my-2">
              {assessment1.result_json?.overall_score || 0}
            </div>
          </div>
          <div
            className="px-8 md:px-6 py-8 md:py-6 text-center transition-all duration-300 ease-in-out border-2 border-gray-300 rounded-lg hover:shadow-[0_4px_12px_rgba(52,168,58,0.15)] hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #f5f5f5 0%, #fff 100%)' }}
          >
            <div className="mb-3 text-sm font-semibold tracking-wider text-gray-600 uppercase">
              Change
            </div>
            <div
              className={`text-center text-[2.5rem] md:text-[2rem] font-bold my-2 pt-4 mt-4 text-base border-t border-gray-300 ${
                overallDelta > 0
                  ? 'text-[#28a745]'
                  : overallDelta < 0
                    ? 'text-[#dc3545]'
                    : 'text-gray-400'
              }`}
            >
              {overallDelta > 0 ? `+${overallDelta}` : overallDelta}
            </div>
          </div>
          <div
            className="px-8 md:px-6 py-8 md:py-6 text-center transition-all duration-300 ease-in-out border-2 rounded-lg border-[#bbdefb] hover:shadow-[0_4px_12px_rgba(52,168,58,0.15)] hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #fff 100%)' }}
          >
            <div className="mb-3 text-sm font-semibold tracking-wider text-gray-600 uppercase">
              {assessment2.title}
            </div>
            <div className="text-center text-[2.5rem] md:text-[2rem] font-bold text-[#4a90e2] my-2">
              {assessment2.result_json?.overall_score || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Factor Scores Comparison */}
      <div className="bg-white py-8 px-8 md:px-6 rounded-[10px] border border-gray-300 mb-8 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <h3 className="mt-0 mb-6 text-[#2c3e50] text-[1.3rem] border-b-2 border-[#34a83a] pb-3 font-bold">
          🔍 Factor-by-Factor Comparison
        </h3>
        <div className="flex flex-col gap-3">
          {Object.entries(assessment1.result_json?.sub_scores || {}).map(([factor, val1]) => {
            const val2 = assessment2.result_json?.sub_scores?.[factor] || 0;
            return (
              <React.Fragment key={factor}>
                {compareMetric(
                  factor.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                  val1,
                  val2,
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Metadata Comparison */}
      <div className="bg-white py-8 px-8 md:px-6 rounded-[10px] border border-gray-300 mb-8 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <h3 className="mt-0 mb-6 text-[#2c3e50] text-[1.3rem] border-b-2 border-[#34a83a] pb-3 font-bold flex items-center gap-2">
          🏢 Project Details
        </h3>
        <div className="flex flex-col gap-3">
          {compareMetric(
            'Industry',
            titleize(assessment1.result_json?.metadata?.industry),
            titleize(assessment2.result_json?.metadata?.industry),
          )}
          {compareMetric(
            'Scale',
            titleize(assessment1.result_json?.metadata?.scale),
            titleize(assessment2.result_json?.metadata?.scale),
          )}
          {compareMetric(
            'Strategy',
            titleize(assessment1.result_json?.metadata?.r_strategy),
            titleize(assessment2.result_json?.metadata?.r_strategy),
          )}
          {compareMetric(
            'Material',
            titleize(assessment1.result_json?.metadata?.primary_material),
            titleize(assessment2.result_json?.metadata?.primary_material),
          )}
        </div>
      </div>

      {/* Benchmark Comparison */}
      {assessment1.result_json?.gap_analysis?.overall_benchmarks &&
        assessment2.result_json?.gap_analysis?.overall_benchmarks && (
          <div className="bg-white py-8 px-8 md:px-6 rounded-[10px] border border-gray-300 mb-8 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <h3 className="mt-0 mb-6 text-[#2c3e50] text-[1.3rem] border-b-2 border-[#34a83a] pb-3 font-bold">
              Benchmarking vs. Similar Projects
            </h3>
            <div className="flex flex-col gap-3">
              {compareMetric(
                'vs. Similar Avg',
                Math.round(assessment1.result_json?.gap_analysis.overall_benchmarks.average),
                Math.round(assessment2.result_json?.gap_analysis.overall_benchmarks.average),
              )}
              {compareMetric(
                'vs. Top 10%',
                assessment1.result_json?.gap_analysis.overall_benchmarks.top_10_percentile,
                assessment2.result_json?.gap_analysis.overall_benchmarks.top_10_percentile,
              )}
            </div>
          </div>
        )}

      {/* Audit Verdicts */}
      <div className="bg-white py-8 px-8 md:px-6 rounded-[10px] border border-gray-300 mb-8 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <h3 className="mt-0 mb-6 text-[#2c3e50] text-[1.3rem] border-b-2 border-[#34a83a] pb-3 font-bold">
          🔍 Auditor&apos;s Verdict
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div
            className="px-6 py-6 border-l-4 rounded-lg bg-[#e8f5e9]"
            style={{ borderLeftColor: '#34a83a' }}
          >
            <h4 className="mt-0 mb-3 text-[#2c3e50] text-[0.95rem] font-bold uppercase">
              {assessment1.title}
            </h4>
            <p className="m-0 text-gray-700 leading-[1.7] text-sm">
              {assessment1.result_json?.audit?.audit_verdict || 'No verdict available'}
            </p>
          </div>
          <div
            className="px-6 py-6 border-l-4 rounded-lg bg-[#e3f2fd]"
            style={{ borderLeftColor: '#4a90e2' }}
          >
            <h4 className="mt-0 mb-3 text-[#2c3e50] text-[0.95rem] font-bold uppercase">
              {assessment2.title}
            </h4>
            <p className="m-0 text-gray-700 leading-[1.7] text-sm">
              {assessment2.result_json?.audit?.audit_verdict || 'No verdict available'}
            </p>
          </div>
        </div>
      </div>

      {/* Factor Scores Visualization - Component not found: BarChartSection */}
      {/*
      {assessment1.result_json?.sub_scores && assessment2.result_json?.sub_scores && (
        <div className="bg-white py-8 px-8 md:px-6 rounded-[10px] border border-gray-300 mb-8 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <h3 className="mt-0 mb-6 text-[#2c3e50] text-[1.3rem] border-b-2 border-[#34a83a] pb-3 font-bold">
            📊 Score Distribution Comparison
          </h3>
          <BarChartSection
            data={Object.keys(assessment1.result_json?.sub_scores).map((key) => ({
              name: key.replace(/_/g, ' '),
              [assessment1.title]: assessment1.result_json?.sub_scores[key],
              [assessment2.title]: assessment2.result_json?.sub_scores[key],
            }))}
            barConfigs={[
              {
                dataKey: assessment1.title,
                fill: '#34a83a',
                name: assessment1.title,
              },
              {
                dataKey: assessment2.title,
                fill: '#007bff',
                name: assessment2.title,
              },
            ]}
            height={350}
            showLegend={true}
            showGrid={true}
            yAxisDomain={[0, 100]}
          />
        </div>
      )}
      */}

      {/* Radar Chart for Multi-Factor Comparison - Component not found: RadarChartSection */}
      {/*
      {assessment1.result_json?.sub_scores && assessment2.result_json?.sub_scores && (
        <div className="bg-white py-8 px-8 md:px-6 rounded-[10px] border border-gray-300 mb-8 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <h3 className="mt-0 mb-6 text-[#2c3e50] text-[1.3rem] border-b-2 border-[#34a83a] pb-3 font-bold">
            🎯 Multi-Factor Profile
          </h3>
          <RadarChartSection
            data={Object.keys(assessment1.result_json?.sub_scores).map((key) => ({
              factor: key.replace(/_/g, ' '),
              fullFactor: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
              'Assessment 1': assessment1.result_json?.sub_scores[key],
              'Assessment 2': assessment2.result_json?.sub_scores[key],
            }))}
            radarConfigs={[
              {
                name: assessment1.title,
                dataKey: 'Assessment 1',
                stroke: '#34a83a',
                fill: '#34a83a',
                fillOpacity: 0.5,
              },
              {
                name: assessment2.title,
                dataKey: 'Assessment 2',
                stroke: '#007bff',
                fill: '#007bff',
                fillOpacity: 0.5,
              },
            ]}
            showCard={false}
            showLegend={true}
            showTooltip={true}
          />
        </div>
      )}
      */}

      {/* Key Insights */}
      <div
        className="bg-white py-8 px-8 md:px-6 rounded-[10px] mb-8 shadow-[0_2px_8px_rgba(0,0,0,0.05)] border-2 border-[#4a90e2] border-l-4"
        style={{
          background: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8f5 100%)',
          borderLeftColor: '#34a83a',
        }}
      >
        <h3
          className="mt-0 mb-6 text-[#2c3e50] text-[1.3rem] pb-3 font-bold"
          style={{ borderBottom: '2px solid #4a90e2' }}
        >
          Key Insights
        </h3>
        <ul className="p-0 m-0 list-none">
          <li
            className="py-3 mb-2 text-[0.95rem] text-[#2c3e50] leading-[1.6]"
            style={{ borderBottom: '1px solid rgba(74, 144, 226, 0.2)' }}
          >
            <strong className="text-[#1565c0]">Score Trend:</strong>&nbsp;
            {assessment2.result_json?.overall_score > assessment1.result_json?.overall_score
              ? '📈 Score improved'
              : assessment2.result_json?.overall_score < assessment1.result_json?.overall_score
                ? '📉 Score declined'
                : '↔️ Score unchanged'}
          </li>
          {assessment1.result_json?.metadata?.industry !==
            assessment2.result_json?.metadata?.industry && (
            <li
              className="py-3 mb-2 text-[0.95rem] text-[#2c3e50] leading-[1.6]"
              style={{ borderBottom: '1px solid rgba(74, 144, 226, 0.2)' }}
            >
              <strong className="text-[#1565c0]">Industry Change:</strong>&nbsp;
              {titleize(assessment1.result_json?.metadata?.industry)} →&nbsp;
              {titleize(assessment2.result_json?.metadata?.industry)}
            </li>
          )}
          <li className="py-3 mb-2 text-[0.95rem] text-[#2c3e50] leading-[1.6] border-b-0">
            <strong className="text-[#1565c0]">Assessed:</strong>&nbsp;
            <span className="font-bold">{assessment1.title}</span>
            &nbsp;(
            {formatTimestamp(assessment1.created_at)}
            )&nbsp;&nbsp;vs.&nbsp;&nbsp;
            <span className="font-bold">{assessment2.title}</span>
            &nbsp;(
            {formatTimestamp(assessment2.created_at)})
          </li>
        </ul>
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center justify-center gap-4 pt-8 mt-12 border-t-2 border-gray-300 md:flex-row md:justify-between">
        <p className="font-medium text-slate-400">
          Last updated:&nbsp;
          {getCurrentTimestampFormatted()}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => exportComparisonCSV(assessment1, assessment2)} variant="outline">
            📤 Export Comparison (CSV)
          </Button>
          <button
            className="bg-white text-[#34a83a] border-2 border-[#34a83a] py-3 px-6 rounded-md font-semibold cursor-pointer text-base transition-all duration-300 ease-in-out hover:bg-[#34a83a] hover:text-white hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(52,168,58,0.3)]"
            onClick={onBack}
          >
            ← Back to Assessments
          </button>
        </div>
      </div>
    </AppContainer>
  );
}

AssessmentComparisonPage.propTypes = {
  onBack: PropTypes.func.isRequired,
};
