import { Card, Chip, toast } from '@heroui/react';
import { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ErrorDisplay from '@/components/common/ErrorDisplay';
import LoaderComponent from '@/components/common/LoaderComponent';
import { DIALOGS } from '@/components/dialogs/dialogTypes';
import BenchmarkTable from '@/components/results/BenchmarkTable';
import { useGlobalDialog } from '@/contexts/DialogContext';
import { deleteAssessment, useAssessment, usePublicAssessment } from '@/features/assessments';
import { reconstructScoringResult } from '@/features/assessments/utils';
import { exportAssessmentPDF } from '@/features/export';
import { formatTimestamp } from '@/lib/formatting';
import { formatFactorName, getRiskBadgeColor, getScoreClass } from '@/lib/scoring';

export default function AssessmentViewPage() {
  const { id, publicId } = useParams();
  const isPublicShare = Boolean(publicId);

  const {
    assessment: privateAssessment,
    isLoading: privateLoading,
    error: privateError,
  } = useAssessment(id, {
    enabled: !isPublicShare && !!id,
    placeholderData: (previousData) => previousData,
  });

  const {
    assessment: publicAssessment,
    isLoading: publicLoading,
    error: publicError,
  } = usePublicAssessment(publicId, {
    enabled: isPublicShare && !!publicId,
  });

  const assessment = isPublicShare ? publicAssessment : privateAssessment;
  const loading = isPublicShare ? publicLoading : privateLoading;
  const error = isPublicShare ? publicError : privateError;

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
      console.error('Delete failed', err);
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
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors w-fit"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">
            {assessment?.title || 'Assessment'}
          </h1>
          {assessment?.created_at && (
            <p className="text-xs text-slate-500">Saved {formatTimestamp(assessment.created_at)}</p>
          )}
        </div>

        {/* Right: action buttons — only shown for owned (non-public-share) assessments */}
        {!isPublicShare && (
          <div className="flex flex-wrap gap-2 shrink-0">
            {/* Share */}
            {assessment?.public_id && (
              <button
                onClick={() => {
                  const shareUrl = `${window.location.origin}/share/${assessment.public_id}`;
                  navigator.clipboard?.writeText(shareUrl).catch(() => {});
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Copy Share Link
              </button>
            )}

            {/* Export PDF */}
            <button
              onClick={() => exportAssessmentPDF(assessment)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Export PDF
            </button>

            {/* Delete */}
            <button
              onClick={() =>
                openDialog(DIALOGS.DELETE_ASSESSMENT, {
                  assessmentName: assessment?.title,
                  assessmentId: assessment?.id,
                  onConfirm: handleConfirmDelete,
                })
              }
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Score header + metadata */}
      <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-slate-600">Overall Score</p>
              <p className={`text-4xl font-bold ${getScoreClass(scoringResult.overall_score)}`}>
                {scoringResult.overall_score ?? 'N/A'}
                <span className="text-lg text-slate-500">/100</span>
              </p>
              {scoringResult?.metadata?.short_description && (
                <p className="text-sm text-slate-600 mt-1">
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
      </Card>

      {/* Derived Metrics */}
      {scoringResult?.derived_metrics && (
        <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
          <div className="p-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Derived Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { key: 'technical_feasibility', label: 'Technical Feasibility' },
                { key: 'economic_viability', label: 'Economic Viability' },
                { key: 'circularity_potential', label: 'Circularity Potential' },
              ].map(({ key, label }) => (
                <div key={key} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">{label}</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {scoringResult.derived_metrics[key] ?? 'N/A'}
                  </p>
                </div>
              ))}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">Risk Level</p>
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
        </Card>
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

      {/* Audit Section */}
      {scoringResult?.audit && (
        <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
          <div className="p-1 sm:p-3">
            <h3 className="text-lg font-bold text-slate-900 mb-1">AI Audit Summary</h3>
            <p className="text-sm text-slate-600 mb-4">
              Comprehensive analysis and recommendations
            </p>

            {scoringResult.audit.audit_verdict && (
              <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-900 mb-2">Audit Verdict</h4>
                <p className="text-sm text-slate-700">{scoringResult.audit.audit_verdict}</p>
              </div>
            )}

            {scoringResult.audit.comparative_analysis && (
              <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-900 mb-2">Comparative Analysis</h4>
                <p className="text-sm text-slate-700">{scoringResult.audit.comparative_analysis}</p>
              </div>
            )}

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
    </div>
  );
}
