/**
 * @module AssessmentViewPage
 * @description Read-only view of one saved assessment (same column layout as comparison).
 */

import { Eye, FingerprintPattern, MoveLeft, RotateCw } from 'lucide-react';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/common';
import DetailsDisplay from '@/components/common/DetailsDisplay';
import { usePublicAssessment } from '@/features/assessments/hooks';
import { reconstructScoringResult } from '@/features/assessments/utils';
import { useAuth } from '@/hooks';
import { AssessmentColumn } from '@/pages/AssessmentComparisonPage/components';
import { computeAssessmentData } from '@/pages/AssessmentComparisonPage/utils/assessmentUtils';
import AssessmentViewPageSkeleton from '@/pages/AssessmentViewPage/components/AssessmentViewPageSkeleton';
import { useSafeBack } from '@/utils/navigation';

/**
 * Loads a single assessment by route `publicId` for viewing.
 * @returns {import('react').ReactElement}
 */
export default function AssessmentViewPage({ publicId: propPublicId }) {
  const { id: urlParamId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Get publicId from either props (from SharePage) or URL params (direct access)
  const publicId = propPublicId || urlParamId;

  const {
    assessment: publicAssessment,
    isLoading: publicLoading,
    error: publicError,
    data: responseData,
  } = usePublicAssessment(publicId, {
    enabled: !!publicId,
  });

  // Redirect owners to /assessments/:id when accessing via /assessments/share/:id
  useEffect(() => {
    if (responseData && isAuthenticated && responseData.readonly === false) {
      // User owns this assessment (readonly === false), redirect to owner route
      navigate(`/assessments/${publicId}`, { replace: true });
    }
  }, [responseData, isAuthenticated, publicId, navigate]);

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
    const isForbidden = error === 'Assessment not publicly available';
    return (
      <DetailsDisplay
        variant="error"
        title={isForbidden ? 'Assessment is Private' : 'Failed to Load Assessment'}
        description={
          isForbidden
            ? 'This assessment is set to private and cannot be shared. Please contact the owner to make it public.'
            : error || 'Unable to retrieve the assessment details. Please try again.'
        }
        actions={[
          {
            label: 'Refresh',
            icon: RotateCw,
            variant: 'ghost',
            onPress: handleRefresh,
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
            variant: 'ghost',
            onPress: handleRefresh,
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
          {...assessmentData}
        />
      </div>

      {/* Simple footer */}
      <div className="mt-8 flex items-center justify-center gap-3 p-6">
        <Button onPress={goBackSafely} variant="ghost" icon={MoveLeft}>
          Back
        </Button>
        <Button as={Link} to="/assessments/share" variant="ghost" icon={Eye}>
          View another
        </Button>
      </div>
    </div>
  );
}

AssessmentViewPage.propTypes = {
  publicId: PropTypes.string,
};
