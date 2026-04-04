import { ArrowLeft, Upload } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/common';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useAssessmentComparison } from '@/features/assessments/hooks/useAssessmentComparison';
import { reconstructScoringResult } from '@/features/assessments/utils';
import { exportComparisonCSV } from '@/features/export';
import { getCurrentTimestampFormatted } from '@/lib/formatting';
import { categorizeIntegrityGaps } from '@/utils/content';

import { ComparisonSkeleton } from './components';
import AssessmentColumn from './components/AssessmentColumn';
import { ChangeIndicator } from './components/ChangeIndicator';

export default function AssessmentComparisonPage() {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const navigate = useNavigate();

  // Support both URL params (/assessments/compare/:publicId1/:publicId2) and query params (?publicId1=...&publicId2=...)
  const publicId1 =
    params.publicId1 || searchParams.get('publicId1') || params.id1 || searchParams.get('id1');
  const publicId2 =
    params.publicId2 || searchParams.get('publicId2') || params.id2 || searchParams.get('id2');

  const { assessment1, assessment2, comparisonData, isLoading, isError, error } =
    useAssessmentComparison(publicId1, publicId2);

  const { openResultsDatabaseEvidenceDetailsDrawer } = useGlobalDrawer();

  const handleBack = () => {
    navigate('/assessments');
  };

  if (!publicId1 || !publicId2) {
    return (
      <ErrorDisplay
        variant="warning"
        title="Unable to Compare"
        message="Please select two assessments to compare. Missing required assessment IDs."
        actions={[
          {
            label: 'Back to Assessments',
            icon: ArrowLeft,
            onClick: () => navigate('/assessments'),
            variant: 'tertiary',
          },
        ]}
        showDefaultActions={false}
      />
    );
  }

  if (isLoading) return <ComparisonSkeleton />;

  if (isError) {
    return (
      <ErrorDisplay
        variant="error"
        title="Cannot Compare Assessments"
        message={error || 'One or more ids incorrect'}
        actions={[
          {
            label: 'Back to Assessments',
            icon: ArrowLeft,
            onClick: () => navigate('/assessments'),
            variant: 'tertiary',
          },
          {
            label: 'Try Different IDs',
            icon: ArrowLeft,
            onClick: () => navigate('/assessments/compare'),
            variant: 'tertiary',
          },
        ]}
        showDefaultActions={false}
      />
    );
  }

  if (!assessment1 || !assessment2) {
    return (
      <ErrorDisplay
        variant="warning"
        title="Assessment Not Found"
        message="One or both of the selected assessments could not be found. They may have been deleted or you may not have permission to access them."
        actions={[
          {
            label: 'Back to Assessments',
            icon: ArrowLeft,
            onClick: () => navigate('/assessments'),
            variant: 'tertiary',
          },
        ]}
        showDefaultActions={false}
      />
    );
  }

  // Reconstruct full scoring results
  const scoringResult1 = reconstructScoringResult(assessment1);
  const scoringResult2 = reconstructScoringResult(assessment2);

  // Compute data for each assessment
  const computeAssessmentData = (scoringResult) => {
    const overallScore = scoringResult?.overall_score ?? 0;
    const { strengths, gaps } = categorizeIntegrityGaps(scoringResult?.audit?.integrity_gaps);
    const casesSummaries = scoringResult?.audit?.similar_cases_summaries || [];
    const subScoreEntries = Object.entries(scoringResult?.sub_scores || {});
    const topFactor =
      subScoreEntries.length > 0
        ? subScoreEntries.reduce((best, curr) => (curr[1] > best[1] ? curr : best))
        : null;
    const focusFactor =
      subScoreEntries.length > 0
        ? subScoreEntries.reduce((worst, curr) => (curr[1] < worst[1] ? curr : worst))
        : null;
    const avgFactorScore =
      subScoreEntries.length > 0
        ? Math.round(
            subScoreEntries.reduce((sum, [, val]) => sum + val, 0) / subScoreEntries.length,
          )
        : 0;

    // Business viability (exact formula from ResultsPage lines 565-576)
    const computeBusinessViabilityScore = (res) => {
      if (!res) return 0;
      const confidence = res.audit?.confidence_score;
      const normalizedConfidence =
        confidence != null && confidence <= 1
          ? (Number(confidence) || 0) * 100
          : Number(confidence) || 0;
      return Math.round((Number(res.overall_score) || 0) * 0.7 + normalizedConfidence * 0.3);
    };

    const resolvedBusinessViabilityScore = computeBusinessViabilityScore(scoringResult);

    return {
      overallScore,
      strengths,
      gaps,
      casesSummaries,
      topFactor,
      focusFactor,
      avgFactorScore,
      resolvedBusinessViabilityScore,
    };
  };

  const assessment1Data = computeAssessmentData(scoringResult1);
  const assessment2Data = computeAssessmentData(scoringResult2);

  const overallDelta = (scoringResult2?.overall_score || 0) - (scoringResult1?.overall_score || 0);

  // Score color helper
  const scoreColor = (score) => {
    if (score >= 75) return 'var(--color-success)';
    if (score >= 50) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  return (
    <div className="space-y-0 w-full mt-6">
      {/* Sticky header: A1 title + score | VS + delta | A2 title + score */}
      <div className="sticky top-0 z-20 bg-(--color-bg) border-b border-(--color-border) py-4 px-6">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 max-w-7xl mx-auto">
          <div>
            <h2 className="font-mono font-medium text-xl text-(--color-text-primary) truncate">
              {assessment1.title}
            </h2>
            <div className="flex items-baseline gap-1 mt-1">
              <span
                className="font-(--font-mono) text-3xl"
                style={{ color: scoreColor(scoringResult1?.overall_score) }}
              >
                {scoringResult1?.overall_score || 0}
              </span>
              <span className="text-sm text-(--color-text-muted)">/100</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold tracking-widest uppercase text-(--color-text-muted)">
              vs
            </span>
            <ChangeIndicator diff={overallDelta} />
          </div>
          <div className="text-right">
            <h2 className="font-mono font-medium text-xl text-(--color-text-primary) truncate">
              {assessment2.title}
            </h2>
            <div className="flex items-baseline gap-1 mt-1 justify-end">
              <span
                className="font-(--font-mono) text-3xl font-bold"
                style={{ color: scoreColor(scoringResult2?.overall_score) }}
              >
                {scoringResult2?.overall_score || 0}
              </span>
              <span className="text-sm text-(--color-text-muted)">/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two columns side by side */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          <div className="border-r border-(--color-border) pr-6 lg:pr-8">
            <AssessmentColumn
              assessment={assessment1}
              scoringResult={scoringResult1}
              label="Assessment 1"
              openResultsDatabaseEvidenceDetailsDrawer={openResultsDatabaseEvidenceDetailsDrawer}
              {...assessment1Data}
            />
          </div>
          <div className="pl-6 lg:pl-8">
            <AssessmentColumn
              assessment={assessment2}
              scoringResult={scoringResult2}
              label="Assessment 2"
              openResultsDatabaseEvidenceDetailsDrawer={openResultsDatabaseEvidenceDetailsDrawer}
              {...assessment2Data}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center py-6 px-6 border-t-2 border-(--color-border) mt-8">
        <p className="text-sm font-medium text-(--color-text-muted)">
          Last updated: {getCurrentTimestampFormatted()}
        </p>
        <div className="flex gap-2">
          <Button
            variant="results-action"
            onPress={() => exportComparisonCSV([assessment1, assessment2])}
          >
            <Upload size={16} /> Export CSV
          </Button>
          <Button variant="ghost" onPress={handleBack}>
            <ArrowLeft size={16} /> Back to Assessments
          </Button>
        </div>
      </div>
    </div>
  );
}
