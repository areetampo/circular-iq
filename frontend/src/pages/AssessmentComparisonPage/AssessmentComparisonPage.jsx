import { toast, Tooltip } from '@heroui/react';
import { ExternalLink, FingerprintPattern, MoveLeft, Upload } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/common';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useAssessmentComparison } from '@/features/assessments/hooks/useAssessmentComparison';
import { reconstructScoringResult } from '@/features/assessments/utils';
import { exportComparisonCSV } from '@/features/export';
import { useExportState } from '@/hooks/useExportState';
import { getCurrentTimestampFormatted } from '@/lib/formatting';

import { ComparisonSkeleton } from './components';
import AssessmentColumn from './components/AssessmentColumn';
import { ChangeIndicator } from './components/ChangeIndicator';
import { computeAssessmentData, createAssessmentHandlers } from './utils/assessmentUtils';

export default function AssessmentComparisonPage() {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const navigate = useNavigate();

  const { openResultsDatabaseEvidenceDetailsDrawer } = useGlobalDrawer();
  const { isExporting, executeExport } = useExportState();

  // Support both URL params (/assessments/compare/:publicId1/:publicId2) and query params (?publicId1=...&publicId2=...)
  const publicId1 =
    params.publicId1 || searchParams.get('publicId1') || params.id1 || searchParams.get('id1');
  const publicId2 =
    params.publicId2 || searchParams.get('publicId2') || params.id2 || searchParams.get('id2');

  const { assessment1, assessment2, comparisonData, isLoading, isError, error } =
    useAssessmentComparison(publicId1, publicId2);

  if (!publicId1 || !publicId2) {
    return (
      <ErrorDisplay
        variant="warning"
        title="Unable to Compare"
        message="Please select two assessments to compare. Missing required assessment IDs."
        actions={[
          {
            label: 'Back to Assessments',
            icon: MoveLeft,
            variant: 'ghost',
            to: '/assessments',
          },
          {
            label: 'Try Different IDs',
            icon: FingerprintPattern,
            variant: 'primary',
            to: '/assessments/compare',
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
            icon: MoveLeft,
            variant: 'ghost',
            to: '/assessments',
          },
          {
            label: 'Try Different IDs',
            icon: FingerprintPattern,
            variant: 'primary',
            to: '/assessments/compare',
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
            icon: MoveLeft,
            variant: 'ghost',
            to: '/assessments',
          },
          {
            label: 'Try Different IDs',
            icon: FingerprintPattern,
            variant: 'primary',
            to: '/assessments/compare',
          },
        ]}
        showDefaultActions={false}
      />
    );
  }

  // Reconstruct full scoring results
  const scoringResult1 = reconstructScoringResult(assessment1);
  const scoringResult2 = reconstructScoringResult(assessment2);

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

  const assessment1Data = computeAssessmentData(scoringResult1);
  const assessment2Data = computeAssessmentData(scoringResult2);

  const overallDelta = (scoringResult2?.overall_score || 0) - (scoringResult1?.overall_score || 0);

  // Score color helper
  const scoreColor = (score) => {
    if (score >= 75) return '--color-success';
    if (score >= 50) return '--color-warning';
    return '--color-error';
  };

  // Reusable heading component with external link
  const AssessmentTitleWithLink = ({ assessment, publicId, isRightAligned = false }) => (
    <div className={`flex items-center gap-2 ${isRightAligned ? 'justify-end' : ''}`}>
      {!isRightAligned && (
        <h2 className="truncate font-jua text-2xl font-medium text-(--color-text-primary)">
          {assessment.title}
        </h2>
      )}
      <Tooltip delay={0}>
        <Tooltip.Trigger className="item-center flex">
          <Link
            to={`/assessments/share/${publicId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex transition-transform duration-150 hover:scale-110 active:scale-95"
          >
            <ExternalLink
              size={18}
              strokeWidth={2}
              className="text-(--color-text-muted) hover:text-(--color-text-secondary)"
            />
          </Link>
        </Tooltip.Trigger>
        <Tooltip.Content showArrow>
          <p>
            View<span className="mx-1 text-sm font-medium">{assessment.title}</span>
            separately
          </p>
        </Tooltip.Content>
      </Tooltip>
      {isRightAligned && (
        <h2 className="truncate font-jua text-2xl font-medium text-(--color-text-primary)">
          {assessment.title}
        </h2>
      )}
    </div>
  );

  return (
    <div className="mt-6 w-full space-y-0">
      {/* Sticky header: A1 title + score | VS + delta | A2 title + score */}
      <div className="sticky top-0 z-9999 border-b border-border bg-(--color-bg) px-6 py-4">
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div>
            <AssessmentTitleWithLink assessment={assessment1} publicId={publicId1} />
            <div className="mt-1 flex items-baseline gap-1">
              <span
                className={`font-mono text-3xl text-(${scoreColor(scoringResult1?.overall_score)})`}
              >
                {scoringResult1?.overall_score || 0}
              </span>
              <span className="text-sm text-(--color-text-muted)">/100</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold tracking-widest text-(--color-text-muted) uppercase">
              vs
            </span>
            <ChangeIndicator diff={overallDelta} />
          </div>
          <div className="text-right">
            <AssessmentTitleWithLink assessment={assessment2} publicId={publicId2} isRightAligned />
            <div className="mt-1 flex items-baseline justify-end gap-1">
              <span
                className={`font-mono text-3xl text-(${scoreColor(scoringResult2?.overall_score)})`}
              >
                {scoringResult2?.overall_score || 0}
              </span>
              <span className="text-sm text-(--color-text-muted)">/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two columns side by side */}
      <div
        className="mx-auto max-w-7xl px-6"
        style={{
          zoom: 0.95,
        }}
      >
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
          <div className="border-r-2 border-border pr-6 lg:pr-8">
            <AssessmentColumn
              assessment={assessment1}
              scoringResult={scoringResult1}
              label="Assessment 1"
              openResultsDatabaseEvidenceDetailsDrawer={openResultsDatabaseEvidenceDetailsDrawer}
              isExporting={isExporting}
              onReevaluate={() => handleReevaluate(assessment1)}
              onDownloadPDF={() => handleDownloadPDF(assessment1, scoringResult1)}
              onDownloadCSV={() => handleDownloadCSV(assessment1, scoringResult1)}
              {...assessment1Data}
            />
          </div>
          <div className="pl-6 lg:pl-8">
            <AssessmentColumn
              assessment={assessment2}
              scoringResult={scoringResult2}
              label="Assessment 2"
              openResultsDatabaseEvidenceDetailsDrawer={openResultsDatabaseEvidenceDetailsDrawer}
              isExporting={isExporting}
              onReevaluate={() => handleReevaluate(assessment2)}
              onDownloadPDF={() => handleDownloadPDF(assessment2, scoringResult2)}
              onDownloadCSV={() => handleDownloadCSV(assessment2, scoringResult2)}
              {...assessment2Data}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 flex items-center justify-between border-t-2 border-border p-6">
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
          <Button variant="ghost" as={Link} to="/assessments">
            <MoveLeft size={16} /> Back to Assessments
          </Button>
        </div>
      </div>
    </div>
  );
}
