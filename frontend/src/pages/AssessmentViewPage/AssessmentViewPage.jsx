import { toast } from '@heroui/react';
import { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ErrorDisplay from '@/components/common/ErrorDisplay';
import LoaderComponent from '@/components/common/LoaderComponent';
import { deleteAssessment } from '@/features/assessments/api/assessmentApi';
import { usePublicAssessment } from '@/features/assessments/hooks/useAssessment';
import { reconstructScoringResult } from '@/features/assessments/utils';
import { CircularEconomyTierCard, WeightedScoreCard } from '@/pages/ResultsPage/components';

import {
  AssessmentHeader,
  AuditSummaryCard,
  DerivedMetricsCard,
  GapAnalysisCard,
  ParameterConsistencyCard,
  RStrategyAlignmentCard,
  ScoreBreakdownCard,
  ScoreOverview,
  SimilarCasesCard,
} from './components';

export default function AssessmentViewPage() {
  const { publicId } = useParams();
  const isPublicShare = !!publicId;
  const queryClient = useQueryClient();

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

  const handleConfirmDelete = useCallback(async () => {
    if (!assessment?.id) throw new Error('No assessment selected');
    try {
      await deleteAssessment(assessment.id);
      // Invalidate all relevant queries to ensure sync across all views
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      queryClient.invalidateQueries({ queryKey: ['assessmentStats'] });
      // Also invalidate specific public assessment if it exists
      if (assessment.public_id) {
        queryClient.invalidateQueries({ queryKey: ['publicAssessment', assessment.public_id] });
      }
      toast.success('Assessment deleted');
      navigate('/assessments');
    } catch (err) {
      logger.error('Delete failed', err);
      toast.danger('Failed to delete assessment');
      throw err;
    }
  }, [assessment?.id, navigate, queryClient]);

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
      {/* Page header */}
      <AssessmentHeader
        assessment={assessment}
        isPublicShare={isPublicShare}
        onConfirmDelete={handleConfirmDelete}
      />
      {/* Score header + metadata */}
      <ScoreOverview scoringResult={scoringResult} />
      {/* Derived Metrics */}
      <DerivedMetricsCard scoringResult={scoringResult} />
      {/* Score Breakdown */}
      <ScoreBreakdownCard scoringResult={scoringResult} />
      <CircularEconomyTierCard actualResult={scoringResult} />
      <WeightedScoreCard actualResult={scoringResult} />
      {/* Parameter Consistency */}
      <ParameterConsistencyCard scoringResult={scoringResult} />
      {/* R-Strategy Alignment */}
      <RStrategyAlignmentCard scoringResult={scoringResult} />
      {/* Audit Section */}
      <AuditSummaryCard scoringResult={scoringResult} />
      {/* Gap Analysis */}
      <GapAnalysisCard scoringResult={scoringResult} />
      {/* Similar Cases */}
      <SimilarCasesCard scoringResult={scoringResult} />
    </div>
  );
}

AssessmentViewPage.propTypes = {};
