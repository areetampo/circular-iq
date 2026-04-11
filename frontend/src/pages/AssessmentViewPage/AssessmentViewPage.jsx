import { toast } from '@heroui/react';
import { Book, FingerprintPattern, MoveLeft, RefreshCcw } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/common';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { usePublicAssessment } from '@/features/assessments/hooks/useAssessment';
import { reconstructScoringResult } from '@/features/assessments/utils';
import { useExportState } from '@/hooks/useExportState';
import AssessmentColumn from '@/pages/AssessmentComparisonPage/components/AssessmentColumn';
import {
  computeAssessmentData,
  createAssessmentHandlers,
} from '@/pages/AssessmentComparisonPage/utils/assessmentUtils';
import { ResultsSkeleton } from '@/pages/ResultsPage/components';

export default function AssessmentViewPage() {
  const { publicId } = useParams();
  const navigate = useNavigate();
  const { openResultsDatabaseEvidenceDetailsDrawer } = useGlobalDrawer();
  const { isExporting, executeExport } = useExportState();

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
            label: 'Try new ID',
            icon: FingerprintPattern,
            variant: 'primary',
            as: Link,
            to: '/assessments/share',
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
            label: 'Refresh',
            icon: RefreshCcw,
            onClick: handleRefresh,
            variant: 'ghost',
          },
          {
            label: 'Try new ID',
            icon: FingerprintPattern,
            variant: 'primary',
            as: Link,
            to: '/assessments/share',
          },
        ]}
        showDefaultActions={false}
      />
    );
  }

  // Create shared handler functions
  const {
    handleReevaluate,
    handleDownloadPDF: baseHandleDownloadPDF,
    handleDownloadCSV: baseHandleDownloadCSV,
  } = createAssessmentHandlers({
    navigate,
    executeExport,
  });

  // Wrap handlers with toast error handling
  const handleDownloadPDF = async (assessment, scoringResult) => {
    try {
      await baseHandleDownloadPDF(assessment, scoringResult);
    } catch (error) {
      toast.danger('No result data available to export', { timeout: 4000 });
    }
  };

  const handleDownloadCSV = async (assessment, scoringResult) => {
    try {
      await baseHandleDownloadCSV(assessment, scoringResult);
    } catch (error) {
      toast.danger('No result data available to export', { timeout: 4000 });
    }
  };

  const assessmentData = computeAssessmentData(scoringResult);

  return (
    <div className="w-full space-y-0">
      {/* Simple header - no buttons or public toggle */}
      {assessment?.title && (
        <div className="mt-8 mb-6 px-4 sm:px-6">
          <h1 className="text-center font-jua text-2xl font-medium tracking-[-0.02em] text-(--color-text-primary)">
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
          isExporting={isExporting}
          onReevaluate={() => handleReevaluate(assessment)}
          onDownloadPDF={() => handleDownloadPDF(assessment, scoringResult)}
          onDownloadCSV={() => handleDownloadCSV(assessment, scoringResult)}
          {...assessmentData}
        />
      </div>

      {/* Simple footer */}
      <div className="mt-8 flex items-center justify-center gap-3 p-6">
        <Button onClick={handleSafeBack} variant="ghost">
          <MoveLeft size={16} />
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
