import { Eye, FingerprintPattern, MoveLeft, RotateCw } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/common';
import DetailsDisplay from '@/components/common/DetailsDisplay';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { usePublicAssessment } from '@/features/assessments/hooks/useAssessment';
import { reconstructScoringResult } from '@/features/assessments/utils';
import { AssessmentColumn } from '@/pages/AssessmentComparisonPage/components';
import { computeAssessmentData } from '@/pages/AssessmentComparisonPage/utils/assessmentUtils';
import AssessmentViewPageSkeleton from '@/pages/AssessmentViewPage/components/AssessmentViewPageSkeleton';
import { useSafeBack } from '@/utils/navigation';

export default function AssessmentViewPage({ publicId: propPublicId }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get publicId from either props (from SharePage) or query params (direct access)
  const publicId = propPublicId || searchParams.get('id');
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

  const goBackSafely = useSafeBack('/');

  if (loading) {
    return <AssessmentViewPageSkeleton />;
  }

  if (error) {
    return (
      <DetailsDisplay
        variant="error"
        title="Failed to Load Assessment"
        description={error || 'Unable to retrieve the assessment details. Please try again.'}
        actions={[
          {
            label: 'Refresh',
            icon: RotateCw,
            onClick: handleRefresh,
            variant: 'ghost',
          },
          {
            label: 'Try Different ID',
            icon: FingerprintPattern,
            variant: 'teal',
            to: '/assessments/share',
            as: Link,
          },
        ]}
        showDefaultActions={false}
      />
    );
  }

  if (!scoringResult) {
    return (
      <DetailsDisplay
        variant="warning"
        title="Assessment Not Found"
        description="The requested assessment could not be found. It may have been deleted or you might not have access to it."
        actions={[
          {
            label: 'Refresh',
            icon: RotateCw,
            onClick: handleRefresh,
            variant: 'ghost',
          },
          {
            label: 'Try Different ID',
            icon: FingerprintPattern,
            variant: 'teal',
            to: '/assessments/share',
            as: Link,
          },
        ]}
        showDefaultActions={false}
      />
    );
  }

  const assessmentData = computeAssessmentData(scoringResult);

  return (
    <div className="w-full space-y-0">
      {/* Simple header - no buttons or public toggle */}
      {assessment?.title && (
        <div className="mt-8 px-4 sm:px-6">
          <h1 className="text-center font-jua text-3xl font-medium tracking-[-0.02em] text-(--color-text-primary)">
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
        <Button onClick={goBackSafely} variant="ghost">
          <MoveLeft size={16} />
          Back
        </Button>
        <Button as={Link} to="/assessments/share" variant="ghost">
          <Eye size={16} />
          View another
        </Button>
      </div>
    </div>
  );
}

AssessmentViewPage.propTypes = {};
