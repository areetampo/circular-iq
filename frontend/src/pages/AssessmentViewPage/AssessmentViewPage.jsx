import { Card, Chip, toast } from '@heroui/react';
import { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/common';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import LoaderComponent from '@/components/common/LoaderComponent';
import { DIALOGS } from '@/components/dialogs/dialogTypes';
import BenchmarkTable from '@/components/results/BenchmarkTable';
import { useGlobalDialog } from '@/contexts/DialogContext';
import { deleteAssessment } from '@/features/assessments/api/assessmentApi';
import { usePublicAssessment } from '@/features/assessments/hooks/useAssessment';
import { reconstructScoringResult } from '@/features/assessments/utils';
import { exportAssessmentPDF } from '@/features/export';
import { formatTimestamp } from '@/lib/formatting';
import { formatFactorName, getRiskBadgeColor, getScoreClass } from '@/lib/scoring';

import { CircularEconomyTierCard, WeightedScoreCard } from '../ResultsPage/components';

export default function AssessmentViewPage() {
  const { publicId } = useParams();
  const isPublicShare = !!publicId;

  const {
    assessment: publicAssessment,
    isLoading: publicLoading,
    error: publicError,
  } = usePublicAssessment(publicId, {
    enabled: !!publicId,
  });

  const assessment = publicAssessment;
  const loading = publicLoading;
  const error = publicError;

  const scoringResult = useMemo(() => reconstructScoringResult(assessment), [assessment]);

  const navigate = useNavigate();
  const { openDialog } = useGlobalDialog();

  const handleConfirmDelete = useCallback(async () => {
    if (!assessment?.id) throw new Error('No assessment selected');
    try {
      await deleteAssessment(assessment.id);
      toast.success('Assessment deleted');
      navigate('/assessments');
    } catch (err) {
      logger.error('Delete failed', err);
      toast.danger('Failed to delete assessment');
      throw err;
    }
  }, [assessment?.id, navigate]);

  if (loading) {
    return <LoaderComponent />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!scoringResult) {
    return <ErrorDisplay error={{ message: 'Assessment not found or has been deleted.' }} />;
  }

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: back nav + title + timestamp */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm w-fit hover:text-[var(--foreground)] transition-colors duration-150"
            style={{ color: 'var(--muted)' }}
          >
            ← Back
          </button>
          <h1
            className="text-2xl font-bold leading-tight"
            style={{
              color: 'var(--foreground)',
            }}
          >
            {assessment?.title || 'Assessment'}
          </h1>
          {assessment?.created_at && (
            <p
              className="text-xs"
              style={{
                color: 'var(--muted)',
              }}
            >
              Saved {formatTimestamp(assessment.created_at)}
            </p>
          )}
        </div>

        {/* Right: action buttons — only shown for owned (non-public-share) assessments */}
        {!isPublicShare && (
          <div className="flex flex-wrap gap-2 shrink-0">
            {/* Share */}
            {assessment?.public_id && (
              <Button
                size="sm"
                variant="info-soft"
                onClick={() => {
                  const shareUrl = `${window.location.origin}/share/${assessment.public_id}`;
                  navigator.clipboard?.writeText(shareUrl).catch(() => {});
                }}
              >
                Copy Share Link
              </Button>
            )}

            {/* Export PDF */}
            <Button size="sm" variant="info-soft" onClick={() => exportAssessmentPDF(assessment)}>
              Export PDF
            </Button>

            {/* Delete */}
            <Button
              size="sm"
              variant="neutral"
              onClick={() =>
                openDialog(DIALOGS.DELETE_ASSESSMENT, {
                  assessmentName: assessment?.title,
                  assessmentId: assessment?.id,
                  onConfirm: handleConfirmDelete,
                })
              }
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Score header + metadata */}
      <div
        className="shadow-sm rounded-xl"
        style={{
          border: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
        }}
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className="text-xs"
                style={{
                  color: 'var(--muted)',
                }}
              >
                Overall Score
              </p>
              <p
                className={`text-4xl font-bold ${getScoreClass(scoringResult.overall_score)}`}
                style={{}}
              >
                {scoringResult.overall_score ?? 'N/A'}
                <span className="text-lg" style={{ color: 'var(--muted)' }}>
                  /100
                </span>
              </p>
              {scoringResult?.metadata?.short_description && (
                <p
                  className="text-sm mt-1"
                  style={{
                    color: 'var(--muted)',
                  }}
                >
                  {scoringResult.metadata.short_description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {scoringResult?.metadata?.industry && (
                  <Chip variant="secondary" size="sm">
                    {scoringResult.metadata.industry}
                  </Chip>
                )}
                {scoringResult?.metadata?.scale && (
                  <Chip variant="secondary" size="sm">
                    {scoringResult.metadata.scale}
                  </Chip>
                )}
                {scoringResult?.metadata?.r_strategy && (
                  <Chip variant="secondary" size="sm">
                    {scoringResult.metadata.r_strategy}
                  </Chip>
                )}
                {scoringResult?.metadata?.primary_material && (
                  <Chip variant="secondary" size="sm">
                    {scoringResult.metadata.primary_material}
                  </Chip>
                )}
                {scoringResult?.metadata?.geographic_focus && (
                  <Chip variant="secondary" size="sm">
                    {scoringResult.metadata.geographic_focus}
                  </Chip>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {scoringResult?.confidence_level != null && (
                <Chip
                  variant="soft"
                  color="warning"
                  size="sm"
                  className="font-semibold text-xs px-3 py-1"
                >
                  Confidence: {scoringResult.confidence_level}%
                </Chip>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Derived Metrics */}
      {scoringResult?.derived_metrics && (
        <div
          className="shadow-sm rounded-xl"
          style={{
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
          }}
        >
          <div className="p-4">
            <h3
              className="text-lg font-bold mb-4"
              style={{
                color: 'var(--foreground)',
              }}
            >
              Derived Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { key: 'technical_feasibility', label: 'Technical Feasibility' },
                { key: 'economic_viability', label: 'Economic Viability' },
                { key: 'circularity_potential', label: 'Circularity Potential' },
              ].map(({ key, label }) => (
                <div
                  key={key}
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--accent-soft)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <p
                    className="text-xs mb-1"
                    style={{
                      color: 'var(--muted)',
                    }}
                  >
                    {label}
                  </p>
                  <p
                    className="text-2xl font-bold"
                    style={{
                      color: 'var(--foreground)',
                    }}
                  >
                    {scoringResult.derived_metrics[key] ?? 'N/A'}
                  </p>
                </div>
              ))}
              <div
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: 'var(--accent-soft)',
                  border: '1px solid var(--border)',
                }}
              >
                <p
                  className="text-xs mb-1"
                  style={{
                    color: 'var(--muted)',
                  }}
                >
                  Risk Level
                </p>
                <Chip
                  variant="soft"
                  className={`text-xs font-bold ${getRiskBadgeColor(
                    scoringResult.derived_metrics.risk_level,
                  )}`}
                >
                  {scoringResult.derived_metrics.risk_level?.toUpperCase() || 'UNKNOWN'}
                </Chip>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Score Breakdown */}
      {scoringResult?.score_breakdown && (
        <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
          <div className="p-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Score Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(scoringResult.score_breakdown).map(([category, data]) => (
                <div key={category} className="p-4 bg-white border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-bold text-slate-900">{category}</div>
                    <div className="text-sm font-bold text-slate-900">{data.score}</div>
                  </div>
                  <div className="text-xs text-slate-600 mb-2">{data.weight}</div>
                  <p className="text-xs text-slate-700 mb-3">{data.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {data.factors?.map((factor, i) => (
                      <Chip key={i} variant="secondary" size="sm" className="text-xs">
                        {factor.name}: {factor.score}
                      </Chip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <CircularEconomyTierCard actualResult={scoringResult} />
      <WeightedScoreCard actualResult={scoringResult} />

      {/* Parameter Consistency */}
      {scoringResult?.parameter_consistency && (
        <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Self-Assessment Reliability</h3>
                <p className="text-sm text-slate-500">
                  Internal consistency of your 8 parameter scores
                </p>
              </div>
              <div className="text-right">
                <div
                  className={`text-3xl font-bold ${
                    scoringResult.parameter_consistency.score >= 85
                      ? 'text-green-600'
                      : scoringResult.parameter_consistency.score >= 65
                        ? 'text-blue-600'
                        : scoringResult.parameter_consistency.score >= 40
                          ? 'text-amber-600'
                          : 'text-red-600'
                  }`}
                >
                  {scoringResult.parameter_consistency.score}
                  <span className="text-sm text-slate-400">/100</span>
                </div>
                <div className="text-xs text-slate-500">
                  {scoringResult.parameter_consistency.rating} Consistency
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              {scoringResult.parameter_consistency.interpretation}
            </p>
            {scoringResult.parameter_consistency.issues?.length > 0 && (
              <div className="space-y-2">
                {scoringResult.parameter_consistency.issues.map((issue, i) => (
                  <div key={i} className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800">{issue.issue}</p>
                    <div className="flex gap-1 mt-1">
                      {issue.factors?.map((f) => (
                        <Chip
                          key={f}
                          size="sm"
                          variant="soft"
                          className="text-xs text-amber-700 bg-amber-100"
                        >
                          {formatFactorName(f)}
                        </Chip>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* R-Strategy Alignment */}
      {scoringResult?.r_strategy_alignment?.alignment_score != null && (
        <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">R-Strategy Alignment</h3>
                <p className="text-sm text-slate-500">
                  How well your scores support the detected{' '}
                  <span className="font-semibold">
                    {scoringResult.r_strategy_alignment.strategy}
                  </span>{' '}
                  strategy
                </p>
              </div>
              <div className="text-right">
                <div
                  className={`text-3xl font-bold ${
                    scoringResult.r_strategy_alignment.alignment_score >= 75
                      ? 'text-green-600'
                      : scoringResult.r_strategy_alignment.alignment_score >= 55
                        ? 'text-blue-600'
                        : scoringResult.r_strategy_alignment.alignment_score >= 35
                          ? 'text-amber-600'
                          : 'text-red-600'
                  }`}
                >
                  {scoringResult.r_strategy_alignment.alignment_score}
                  <span className="text-sm text-slate-400">/100</span>
                </div>
                <div className="text-xs text-slate-500">
                  {scoringResult.r_strategy_alignment.rating}
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-700 mb-3">
              {scoringResult.r_strategy_alignment.message}
            </p>
            {scoringResult.r_strategy_alignment.misaligned_factors?.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-semibold text-red-600">
                  Critical factors below threshold:
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {scoringResult.r_strategy_alignment.misaligned_factors.map((f) => (
                    <Chip
                      key={f}
                      size="sm"
                      variant="soft"
                      className="text-xs text-red-700 bg-red-100"
                    >
                      {formatFactorName(f)}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            {scoringResult.r_strategy_alignment.well_aligned_factors?.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-green-600">Well aligned:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {scoringResult.r_strategy_alignment.well_aligned_factors.map((f) => (
                    <Chip
                      key={f}
                      size="sm"
                      variant="soft"
                      className="text-xs text-green-700 bg-green-100"
                    >
                      {formatFactorName(f)}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Audit Section */}
      {scoringResult?.audit && (
        <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
          <div className="p-1 sm:p-3">
            <h3 className="text-lg font-bold text-slate-900 mb-1">AI Audit Summary</h3>
            <p className="text-sm text-slate-600 mb-4">
              Comprehensive analysis and recommendations
            </p>

            {scoringResult.audit.integrity_gaps &&
              scoringResult.audit.integrity_gaps.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-slate-900 mb-2">Integrity Gaps</h4>
                  <ul className="space-y-2">
                    {scoringResult.audit.integrity_gaps.map((gap, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Chip
                          variant="soft"
                          className={`text-xs ${
                            gap.severity === 'high'
                              ? 'text-red-700 bg-red-100'
                              : gap.severity === 'medium'
                                ? 'text-amber-700 bg-amber-100'
                                : 'text-blue-700 bg-blue-100'
                          }`}
                        >
                          {gap.severity || 'medium'}
                        </Chip>
                        <span className="text-sm text-slate-700">{gap.issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {scoringResult.audit.strengths && scoringResult.audit.strengths.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-900 mb-2">Strengths</h4>
                <ul className="space-y-1">
                  {scoringResult.audit.strengths.map((strength, i) => (
                    <li key={i} className="text-sm text-slate-700">
                      • {strength.aspect}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {scoringResult.audit.technical_recommendations &&
              scoringResult.audit.technical_recommendations.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-slate-900 mb-2">
                    Technical Recommendations
                  </h4>
                  <ul className="space-y-1">
                    {scoringResult.audit.technical_recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-slate-700">
                        • {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {scoringResult.audit.similar_cases_summaries &&
              scoringResult.audit.similar_cases_summaries.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-slate-900 mb-2">Similar Cases Summaries</h4>
                  <ul className="space-y-1">
                    {scoringResult.audit.similar_cases_summaries.map((summary, i) => (
                      <li key={i} className="text-sm text-slate-700">
                        • {summary}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {scoringResult.audit.key_metrics_comparison && (
              <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-900 mb-2">Key Metrics Comparison</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(scoringResult.audit.key_metrics_comparison).map(
                    ([key, value]) => (
                      <div key={key} className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-xs font-bold text-slate-900 capitalize">
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm text-slate-700">{value}</div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {scoringResult.audit?.improvement_roadmap &&
              scoringResult.audit.improvement_roadmap.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-slate-900 mb-3">Improvement Roadmap</h4>
                  <div className="space-y-3">
                    {scoringResult.audit.improvement_roadmap.map((item, i) => (
                      <div
                        key={i}
                        className="p-3 bg-white border border-slate-200 rounded-lg flex gap-3"
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center
                          text-xs font-bold shrink-0 ${
                            i === 0
                              ? 'bg-red-100 text-red-700'
                              : i === 1
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {item.priority}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-800">{item.action}</p>
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            {item.target_factor && (
                              <Chip
                                size="sm"
                                variant="soft"
                                className="text-xs text-slate-600 bg-slate-100"
                              >
                                {formatFactorName(item.target_factor)}
                              </Chip>
                            )}
                            <Chip
                              size="sm"
                              variant="soft"
                              className={`text-xs ${
                                item.impact === 'high'
                                  ? 'text-green-700 bg-green-100'
                                  : item.impact === 'medium'
                                    ? 'text-blue-700 bg-blue-100'
                                    : 'text-slate-600 bg-slate-100'
                              }`}
                            >
                              {item.impact} impact
                            </Chip>
                            <Chip
                              size="sm"
                              variant="soft"
                              className={`text-xs ${
                                item.effort === 'low'
                                  ? 'text-green-700 bg-green-100'
                                  : item.effort === 'high'
                                    ? 'text-red-700 bg-red-100'
                                    : 'text-amber-700 bg-amber-100'
                              }`}
                            >
                              {item.effort} effort
                            </Chip>
                            <Chip
                              size="sm"
                              variant="soft"
                              className="text-xs text-slate-500 bg-slate-50"
                            >
                              {item.timeframe}
                            </Chip>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {scoringResult.audit?.sdg_alignment && scoringResult.audit.sdg_alignment.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-900 mb-3">
                  UN Sustainable Development Goals
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {scoringResult.audit.sdg_alignment.map((sdg, i) => (
                    <div
                      key={i}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex gap-2"
                    >
                      <div
                        className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center
                          justify-center text-xs font-bold shrink-0"
                      >
                        {sdg.sdg_number}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-800">{sdg.sdg_name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{sdg.rationale}</div>
                        <Chip
                          size="sm"
                          variant="soft"
                          className={`text-xs mt-1 ${
                            sdg.relevance === 'high'
                              ? 'text-green-700 bg-green-100'
                              : sdg.relevance === 'medium'
                                ? 'text-blue-700 bg-blue-100'
                                : 'text-slate-500 bg-slate-100'
                          }`}
                        >
                          {sdg.relevance} relevance
                        </Chip>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {scoringResult.audit?.market_opportunity_summary && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-xs font-bold text-blue-800 mb-1 uppercase tracking-wide">
                  Market Opportunity
                </h4>
                <p className="text-sm text-blue-900">
                  {scoringResult.audit.market_opportunity_summary}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Gap Analysis */}
      {scoringResult?.gap_analysis?.has_benchmarks && (
        <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
          <div className="p-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Gap Analysis</h3>
            <BenchmarkTable
              comparisons={scoringResult.gap_analysis.comparisons}
              opportunities={scoringResult.gap_analysis.opportunities}
              strengths={scoringResult.gap_analysis.strengths}
            />
            <div className="flex flex-wrap gap-2 mt-4">
              {scoringResult.gap_analysis.opportunities?.map((factor) => (
                <Chip key={factor} variant="soft" color="warning" size="sm">
                  ↑ {formatFactorName(factor)}
                </Chip>
              ))}
              {scoringResult.gap_analysis.strengths?.map((factor) => (
                <Chip key={factor} variant="soft" color="success" size="sm">
                  ✓ {formatFactorName(factor)}
                </Chip>
              ))}
            </div>
            {scoringResult.gap_analysis.message && (
              <p className="text-xs text-slate-500 mt-3 italic">
                {scoringResult.gap_analysis.message}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Similar Cases */}
      {scoringResult?.similar_cases && scoringResult.similar_cases.length > 0 && (
        <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
          <div className="p-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Similar Cases</h3>
            <div className="space-y-4">
              {scoringResult.similar_cases.map((caseItem, index) => {
                const summary = scoringResult.audit?.similar_cases_summaries?.[index];
                const similarity = Math.round((caseItem.similarity || 0) * 100);
                return (
                  <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800">
                          {caseItem.title || `Case ${index + 1}`}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {caseItem.industry && (
                            <Chip variant="secondary" size="sm" className="text-xs">
                              {caseItem.industry}
                            </Chip>
                          )}
                          {caseItem.category && (
                            <Chip variant="secondary" size="sm" className="text-xs">
                              {caseItem.category}
                            </Chip>
                          )}
                        </div>
                      </div>
                      <Chip
                        variant="soft"
                        color={
                          similarity >= 80 ? 'success' : similarity >= 60 ? 'primary' : 'warning'
                        }
                        size="sm"
                        className="text-xs shrink-0"
                      >
                        {similarity}% match
                      </Chip>
                    </div>
                    {summary && (
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">{summary}</p>
                    )}

                    {/* Problem preview */}
                    {caseItem.problem && !summary && (
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        <span className="font-semibold">Problem: </span>
                        {caseItem.problem.substring(0, 200)}
                        {caseItem.problem.length > 200 ? '…' : ''}
                      </p>
                    )}

                    {/* Metadata chips */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {caseItem.circular_strategy && (
                        <Chip variant="soft" color="success" size="sm" className="text-xs">
                          {caseItem.circular_strategy}
                        </Chip>
                      )}
                      {caseItem.materials && (
                        <Chip variant="secondary" size="sm" className="text-xs">
                          {caseItem.materials}
                        </Chip>
                      )}
                    </div>

                    {/* Similarity bar */}
                    <div className="mt-3 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          similarity >= 80
                            ? 'bg-emerald-500'
                            : similarity >= 60
                              ? 'bg-blue-500'
                              : 'bg-amber-500'
                        }`}
                        style={{ width: `${similarity}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

AssessmentViewPage.propTypes = {};
