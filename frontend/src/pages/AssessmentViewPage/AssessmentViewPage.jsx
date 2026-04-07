import { ArrowLeft, Book, RefreshCcw, View } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/common';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { usePublicAssessment } from '@/features/assessments/hooks/useAssessment';
import { reconstructScoringResult } from '@/features/assessments/utils';
import AssessmentColumn from '@/pages/AssessmentComparisonPage/components/AssessmentColumn';
import { ResultsSkeleton } from '@/pages/ResultsPage/components';
import { categorizeIntegrityGaps } from '@/utils/content';

export default function AssessmentViewPage() {
  const { publicId } = useParams();
  const navigate = useNavigate();
  const { openResultsDatabaseEvidenceDetailsDrawer } = useGlobalDrawer();

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

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, [navigate]);

  const handleSafeBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return <ResultsSkeleton />;
  }

  if (error) {
    return (
      <ErrorDisplay
        variant="error"
        title="Failed to Load Assessment"
        message={error || 'Unable to retrieve the assessment details. Please try again.'}
        actions={[
          {
            label: 'Refresh',
            icon: RefreshCcw,
            onClick: handleRefresh,
            variant: 'ghost',
          },
          {
            label: 'Go back',
            icon: ArrowLeft,
            onClick: handleSafeBack,
            variant: 'ghost',
          },
          {
            label: 'View another',
            icon: View,
            variant: 'primary',
            as: Link,
            to: '/assessments/compare',
          },
        ]}
        showDefaultActions={false}
      />
    );
  }

  if (!scoringResult) {
    return (
      <ErrorDisplay
        variant="warning"
        title="Assessment Not Found"
        message="The requested assessment could not be found. It may have been deleted or you might not have access to it."
        actions={[
          {
            label: 'Go back',
            icon: ArrowLeft,
            onClick: handleSafeBack,
            variant: 'ghost',
          },
          {
            label: 'View another',
            icon: View,
            variant: 'primary',
            as: Link,
            to: '/assessments/compare',
          },
        ]}
        showDefaultActions={false}
      />
    );
  }

  // Compute assessment data using the same logic as AssessmentComparisonPage
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

    // Business viability (exact formula from ResultsPage)
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

  const assessmentData = computeAssessmentData(scoringResult);

  return (
    <div className="w-full space-y-0">
      {/* Simple header - no buttons or public toggle */}
      {assessment?.title && (
        <div className="mt-8 mb-6 px-4 sm:px-6">
          <h1 className="text-center font-mono text-2xl font-semibold tracking-[-0.02em] text-(--color-text-primary)">
            {assessment.title}
          </h1>
        </div>
      )}

      {/* Single assessment column using the same component as AssessmentComparisonPage */}
      <div className="mx-auto max-w-4xl px-6">
        <AssessmentColumn
          assessment={assessment}
          scoringResult={scoringResult}
          label="Assessment"
          openResultsDatabaseEvidenceDetailsDrawer={openResultsDatabaseEvidenceDetailsDrawer}
          {...assessmentData}
        />
      </div>

      {/* Simple footer */}
      <div className="mt-8 flex items-center justify-center gap-3 p-6">
        <Button onClick={handleSafeBack} variant="ghost">
          <ArrowLeft size={16} />
          Back
        </Button>
        <Button as={Link} to="/assessments" variant="ghost">
          <Book size={16} />
          Go to assessments
        </Button>
      </div>
    </div>
  );
}

AssessmentViewPage.propTypes = {};
