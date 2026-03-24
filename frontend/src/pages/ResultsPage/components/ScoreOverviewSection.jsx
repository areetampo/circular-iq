import { Card, Chip, ProgressBar } from '@heroui/react';
import { BarChart3, Globe, Lightbulb, Lock, Target, TrendingUp } from 'lucide-react';
import PropTypes from 'prop-types';

import { titleize } from '@/lib/formatting';
import { getRiskBadgeColor } from '@/lib/scoring';

export function ScoreOverviewSection({
  actualResult,
  overallScore,
  casesSummaries,
  strengths,
  gaps,
  isViewFromMyAssessments,
  currentData,
  optimisticIsPublic,
  topFactor,
  focusFactor,
  avgFactorScore,
  resolvedBusinessViabilityScore,
  reportTips,
}) {
  return (
    <>
      {/* Executive Summary */}
      <Card
        className="border rounded-2xl p-6 sm:p-8 mb-2"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                Executive Summary
              </h2>
              {isViewFromMyAssessments && currentData && (
                <Chip variant="secondary" size="sm" className="gap-1 ml-1">
                  {(optimisticIsPublic !== null ? optimisticIsPublic : currentData.is_public) ===
                  false ? (
                    <>
                      <Lock size={12} />
                      Private
                    </>
                  ) : (
                    <>
                      <Globe size={12} />
                      Contributing
                    </>
                  )}
                </Chip>
              )}
            </div>
            {actualResult.metadata?.short_description && (
              <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>
                {actualResult.metadata.short_description}
              </p>
            )}
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              AI-powered circularity assessment and recommendations
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Chip
              variant="soft"
              color="warning"
              size="sm"
              className="font-semibold text-xs px-3 py-1"
            >
              Confidence: {actualResult.confidence_level || 0}%
            </Chip>
            {actualResult.processing_info?.processing_time_ms && (
              <Chip variant="secondary" size="sm" className="text-xs">
                Analysed in {(actualResult.processing_info.processing_time_ms / 1000).toFixed(1)}s
              </Chip>
            )}
          </div>
        </div>

        {actualResult.audit?.audit_verdict && (
          <div
            className="mb-4 pl-4 py-3 pr-3 rounded-r"
            style={{
              borderLeft: '4px solid var(--success)',
              backgroundColor: 'var(--success-soft)',
            }}
          >
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              {actualResult.audit.audit_verdict}
            </p>
          </div>
        )}

        {actualResult.audit?.comparative_analysis && (
          <div
            className="mb-4 pl-4 py-3 pr-3 rounded-r"
            style={{ borderLeft: '4px solid var(--info)', backgroundColor: 'var(--info-soft)' }}
          >
            <p className="text-xs font-semibold uppercase mb-1" style={{ color: 'var(--info)' }}>
              Key Finding
            </p>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              {actualResult.audit.comparative_analysis}
            </p>
          </div>
        )}

        {/* Score hero block */}
        <div
          className="border rounded-2xl p-6 sm:p-8 mb-2"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {/* CE tier badge */}
          <span className="chip chip-accent-soft inline-block mb-4">
            {actualResult.metadata?.tier || 'UNRATED'}
          </span>

          {/* Big score */}
          <div className="flex items-end gap-2 mb-6">
            <span
              className="metric-value text-[72px] leading-none"
              style={{
                color:
                  overallScore >= 75
                    ? 'var(--success)'
                    : overallScore >= 50
                      ? 'var(--warning)'
                      : 'var(--danger)',
              }}
            >
              {overallScore}
            </span>
            <span className="text-[20px] mb-2" style={{ color: 'var(--muted)' }}>
              / 100
            </span>
          </div>

          {/* 4 stat pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Confidence', value: actualResult.confidence },
              { label: 'Tech Feasibility', value: actualResult.tech_feasibility },
              { label: 'Economic Viability', value: actualResult.economic_viability },
              { label: 'Circularity', value: actualResult.circularity },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="border rounded-xl p-3 text-center"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-raised)' }}
              >
                <div className="metric-value text-[18px]">{value ?? '—'}</div>
                <div className="label-overline mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 3 analysis cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            className="p-4 rounded-lg"
            style={{
              background:
                'linear-gradient(to bottom right, var(--info-soft), transparent, var(--info-soft))',
              border: '2px solid var(--info)',
            }}
          >
            <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>
              Database Cases Analyzed
            </p>
            <p className="text-3xl font-bold" style={{ color: 'var(--info)' }}>
              {casesSummaries.length || 0}
            </p>
          </div>

          <div
            className="p-4 rounded-lg"
            style={{
              background:
                'linear-gradient(to bottom right, var(--success-soft), transparent, var(--success-soft))',
              border: '2px solid var(--success)',
            }}
          >
            <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>
              Strengths Identified
            </p>
            <p className="text-3xl font-bold" style={{ color: 'var(--success)' }}>
              {strengths.length || 0}
            </p>
          </div>

          <div
            className="p-4 rounded-lg"
            style={{
              background:
                'linear-gradient(to bottom right, var(--warning-soft), transparent, var(--warning-soft))',
              border: '2px solid var(--warning)',
            }}
          >
            <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>
              Improvement Areas
            </p>
            <p className="text-3xl font-bold" style={{ color: 'var(--warning)' }}>
              {gaps.length || 0}
            </p>
          </div>
        </div>
      </Card>

      {/* Score Highlights */}
      <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
        <div className="p-1 sm:p-3">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Score Highlights</h3>
          <p className="text-sm text-slate-600 mb-4">Key performance indicators</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-linear-to-br from-green-50 via-green-50 to-green-100 border-l-4 border-green-600 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-green-900 uppercase tracking-wide">
                  Strongest Factor
                </p>
                <TrendingUp className="text-green-600" size={16} />
              </div>
              <p className="text-xl font-bold text-green-900 mb-1">
                {topFactor ? titleize(topFactor[0]) : 'N/A'}
              </p>
              <p className="text-sm font-semibold text-green-700">
                {topFactor ? `${topFactor[1]}/100` : '—'}
              </p>
            </div>

            <div className="p-5 bg-linear-to-br from-orange-50 via-orange-50 to-orange-100 border-l-4 border-orange-600 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-orange-900 uppercase tracking-wide">
                  Focus Area
                </p>
                <Target className="text-orange-600" size={16} />
              </div>
              <p className="text-xl font-bold text-orange-900 mb-1">
                {focusFactor ? titleize(focusFactor[0]) : 'N/A'}
              </p>
              <p className="text-sm font-semibold text-orange-700">
                {focusFactor ? `${focusFactor[1]}/100` : '—'}
              </p>
            </div>

            <div className="p-5 bg-linear-to-br from-blue-50 via-blue-50 to-blue-100 border-l-4 border-blue-600 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                  Average Score
                </p>
                <BarChart3 className="text-blue-600" size={16} />
              </div>
              <p className="text-xl font-bold text-blue-900 mb-1">
                {avgFactorScore}
                <span className="text-sm text-slate-600">/100</span>
              </p>
              <p className="text-xs text-blue-700">
                Business: {resolvedBusinessViabilityScore}/100
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Tips for New Users */}
      <Card className="border-2 border-dashed border-blue-400/80 bg-blue-50/60 shadow-sm rounded-xl">
        <div className="p-1 sm:p-3">
          <Card.Header className="px-0 pb-4 pt-0 flex items-center gap-3">
            <div className="mt-0.5 rounded-lg bg-blue-100/70 p-2">
              <Lightbulb className="text-blue-700" size={20} />
            </div>
            <div>
              <Card.Title className="text-lg text-blue-900 text-center">
                How to Use This Report
              </Card.Title>
              <Card.Description className="text-sm text-center text-slate-600 mt-1">
                Your guide to understanding and acting on these insights
              </Card.Description>
            </div>
          </Card.Header>
          <Card.Content className="px-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {reportTips.map((tip) => (
                <Card
                  key={tip.title}
                  className="border border-blue-200/80 bg-white/90 rounded-xl shadow-sm"
                  variant="secondary"
                >
                  <Card.Header className="">
                    <Card.Title className="text-sm text-blue-900 flex items-center gap-2">
                      <tip.Icon className={tip.iconClassName} size={16} />
                      {tip.title}
                    </Card.Title>
                  </Card.Header>
                  <Card.Content className="-mt-1">
                    <p className="text-xs text-[var(--muted)] leading-relaxed">{tip.description}</p>
                  </Card.Content>
                </Card>
              ))}
            </div>
          </Card.Content>
        </div>
      </Card>

      {/* Derived Metrics */}
      {actualResult.derived_metrics && (
        <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
          <div className="p-1 sm:p-3">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
              <BarChart3 className="text-blue-600" size={20} /> Derived Metrics
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Additional consolidated metrics derived from your factor scores.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {[
                { key: 'technical_feasibility', label: 'Technical Feasibility' },
                { key: 'economic_viability', label: 'Economic Viability' },
                { key: 'circularity_potential', label: 'Circularity Potential' },
              ].map(({ key, label }) => {
                const value = actualResult.derived_metrics[key];
                const numeric = typeof value === 'number' ? value : 0;
                const color = numeric >= 70 ? 'success' : numeric >= 40 ? 'warning' : 'error';
                return (
                  <div key={key} className="p-4 bg-white border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold text-slate-900">{label}</div>
                      <div className="text-sm font-bold text-slate-900">{numeric}</div>
                    </div>
                    <ProgressBar
                      value={Math.min(100, Math.max(0, numeric))}
                      color={
                        color === 'success' ? 'success' : color === 'warning' ? 'warning' : 'danger'
                      }
                      className="h-2 rounded"
                    />
                  </div>
                );
              })}
              <div className="p-4 bg-white border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-slate-900">Risk Level</div>
                  <Chip
                    variant="soft"
                    className={`text-xs font-bold ${getRiskBadgeColor(actualResult.derived_metrics.risk_level)}`}
                  >
                    {actualResult.derived_metrics.risk_level?.toUpperCase() || 'UNKNOWN'}
                  </Chip>
                </div>
                <div className="text-sm text-slate-600 mt-2">Overall project risk assessment</div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}

ScoreOverviewSection.propTypes = {
  actualResult: PropTypes.object.isRequired,
  overallScore: PropTypes.number.isRequired,
  casesSummaries: PropTypes.arrayOf(PropTypes.string),
  strengths: PropTypes.array,
  gaps: PropTypes.array,
  isViewFromMyAssessments: PropTypes.bool,
  currentData: PropTypes.object,
  optimisticIsPublic: PropTypes.bool,
  topFactor: PropTypes.array,
  focusFactor: PropTypes.array,
  avgFactorScore: PropTypes.number.isRequired,
  resolvedBusinessViabilityScore: PropTypes.number.isRequired,
  reportTips: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      description: PropTypes.string,
      Icon: PropTypes.elementType,
      iconClassName: PropTypes.string,
    }),
  ).isRequired,
};

export default ScoreOverviewSection;
