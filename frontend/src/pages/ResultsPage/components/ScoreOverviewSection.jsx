import { Card, Chip, ProgressBar } from '@heroui/react';
import { BarChart3, Globe, Lock, Target, TrendingUp } from 'lucide-react';
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
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
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
            <p className="text-sm text-muted leading-relaxed">
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
      <Card
        className="border rounded-xl card-lift"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="p-1 sm:p-3">
          <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--foreground)' }}>
            Score Highlights
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
            Key performance indicators
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className="p-5 border-l-4 rounded-lg"
              style={{ borderColor: 'var(--success)', backgroundColor: 'var(--success-soft)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <p
                  className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: 'var(--success)' }}
                >
                  Strongest Factor
                </p>
                <TrendingUp style={{ color: 'var(--success)' }} size={16} />
              </div>
              <p className="text-xl font-bold mb-1" style={{ color: 'var(--success)' }}>
                {topFactor ? titleize(topFactor[0]) : 'N/A'}
              </p>
              <p className="text-sm font-semibold" style={{ color: 'var(--success)' }}>
                {topFactor ? `${topFactor[1]}/100` : '—'}
              </p>
            </div>

            <div
              className="p-5 border-l-4 rounded-lg"
              style={{ borderColor: 'var(--warning)', backgroundColor: 'var(--warning-soft)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <p
                  className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: 'var(--warning)' }}
                >
                  Focus Area
                </p>
                <Target style={{ color: 'var(--warning)' }} size={16} />
              </div>
              <p className="text-xl font-bold mb-1" style={{ color: 'var(--warning)' }}>
                {focusFactor ? titleize(focusFactor[0]) : 'N/A'}
              </p>
              <p className="text-sm font-semibold" style={{ color: 'var(--warning)' }}>
                {focusFactor ? `${focusFactor[1]}/100` : '—'}
              </p>
            </div>

            <div
              className="p-5 border-l-4 rounded-lg"
              style={{ borderColor: 'var(--info)', backgroundColor: 'var(--info-soft)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <p
                  className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: 'var(--info)' }}
                >
                  Average Score
                </p>
                <BarChart3 style={{ color: 'var(--info)' }} size={16} />
              </div>
              <p className="text-xl font-bold mb-1" style={{ color: 'var(--info)' }}>
                {avgFactorScore}
              </p>
              <p className="text-sm">
                <span style={{ color: 'var(--muted)' }}>/100</span>
              </p>
              <p className="text-xs" style={{ color: 'var(--info)' }}>
                Business: {resolvedBusinessViabilityScore}/100
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Derived Metrics */}
      {actualResult.derived_metrics && (
        <Card
          className="border rounded-xl card-lift"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="p-1 sm:p-3">
            <h3
              className="text-lg font-bold flex items-center gap-2 mb-1"
              style={{ color: 'var(--foreground)' }}
            >
              <BarChart3 style={{ color: 'var(--info)' }} size={20} /> Derived Metrics
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
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
                const color = numeric >= 70 ? 'success' : numeric >= 40 ? 'warning' : 'danger';
                return (
                  <div
                    key={key}
                    className="p-4 border rounded-lg"
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
                        {label}
                      </div>
                      <div className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                        {numeric}
                      </div>
                    </div>
                    <ProgressBar
                      value={Math.min(100, Math.max(0, numeric))}
                      color={color}
                      className="h-2 rounded"
                    />
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className="p-4 border rounded-lg"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
                    Risk Level
                  </div>
                  <Chip
                    variant="soft"
                    className={`text-xs font-bold ${getRiskBadgeColor(actualResult.derived_metrics.risk_level)}`}
                  >
                    {actualResult.derived_metrics.risk_level?.toUpperCase() || 'UNKNOWN'}
                  </Chip>
                </div>
                <div className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
                  Overall project risk assessment
                </div>
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
