import { Tooltip, toast } from '@heroui/react';
import { Download, ExternalLink, FingerprintPattern, MoveLeft } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import { Button, Separator } from '@/components/common';
import DetailsDisplay from '@/components/common/DetailsDisplay';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useAssessmentComparison } from '@/features/assessments/hooks/useAssessmentComparison';
import { reconstructScoringResult } from '@/features/assessments/utils';
import { exportComparisonCSV, exportComparisonPDF } from '@/features/export';

import { AssessmentColumn, ChangeIndicator, ComparisonSkeleton } from './components';
import { computeAssessmentData } from './utils/assessmentUtils';

export default function AssessmentComparisonPage() {
  const [searchParams] = useSearchParams();

  const { openResultsDatabaseEvidenceDetailsDrawer } = useGlobalDrawer();

  // Support query params (/assessments/compare/?id1=...&id2=...)
  const publicId1 = searchParams.get('id1');
  const publicId2 = searchParams.get('id2');

  const { assessment1, assessment2, comparisonData, isLoading, isError, error } =
    useAssessmentComparison(publicId1, publicId2);

  if (!publicId1 || !publicId2) {
    return (
      <DetailsDisplay
        variant="warning"
        title="Unable to Compare"
        message="Please select two assessments to compare. Missing required assessment IDs."
        actions={[
          {
            label: 'Back to Assessments',
            icon: MoveLeft,
            variant: 'ghost',
            to: '/assessments',
            as: Link,
          },
          {
            label: 'Try Different IDs',
            icon: FingerprintPattern,
            variant: 'teal',
            to: '/assessments/compare',
            as: Link,
          },
        ]}
        showDefaultActions={false}
      />
    );
  }

  if (isLoading) return <ComparisonSkeleton />;

  if (isError) {
    return (
      <DetailsDisplay
        variant="error"
        title="Cannot Compare Assessments"
        message={error || 'One or more ids incorrect'}
        actions={[
          {
            label: 'Back to Assessments',
            icon: MoveLeft,
            variant: 'ghost',
            to: '/assessments',
            as: Link,
          },
          {
            label: 'Try Different IDs',
            icon: FingerprintPattern,
            variant: 'teal',
            to: '/assessments/compare',
            as: Link,
          },
        ]}
        showDefaultActions={false}
      />
    );
  }

  if (!assessment1 || !assessment2) {
    return (
      <DetailsDisplay
        variant="warning"
        title="Assessment Not Found"
        message="One or both of the selected assessments could not be found. They may have been deleted or you may not have permission to access them."
        actions={[
          {
            label: 'Back to Assessments',
            icon: MoveLeft,
            variant: 'ghost',
            to: '/assessments',
            as: Link,
          },
          {
            label: 'Try Different IDs',
            icon: FingerprintPattern,
            variant: 'teal',
            to: '/assessments/compare',
            as: Link,
          },
        ]}
        showDefaultActions={false}
      />
    );
  }

  // Reconstruct full scoring results
  const scoringResult1 = reconstructScoringResult(assessment1);
  const scoringResult2 = reconstructScoringResult(assessment2);

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
          <Link to={`/assessments/share?id=${publicId}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink
              size={18}
              strokeWidth={2}
              className="inline-flex text-(--color-text-muted) transition-transform duration-150 hover:scale-110 hover:text-(--color-text-secondary) active:scale-95"
            />
          </Link>
        </Tooltip.Trigger>
        <Tooltip.Content showArrow>
          <p className="wrap-break-word">
            View
            <span className="mx-1 font-medium whitespace-nowrap underline decoration-1 underline-offset-3">
              {assessment.title}
            </span>
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
      <div className="sticky top-0 z-9999 bg-(--color-bg) px-6 py-4">
        <Separator wrapperCn="absolute inset-x-0 bottom-0" />
        <Separator wrapperCn="absolute inset-x-0 top-0" />
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="pl-4">
            <AssessmentTitleWithLink assessment={assessment1} publicId={publicId1} />
            <div className="mt-1 flex items-baseline gap-1">
              <span
                className={`font-sniglet text-3xl text-(${scoreColor(scoringResult1?.overall_score)})`}
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
          <div className="pr-4 text-right">
            <AssessmentTitleWithLink assessment={assessment2} publicId={publicId2} isRightAligned />
            <div className="mt-1 flex items-baseline justify-end gap-1">
              <span
                className={`font-sniglet text-3xl text-(${scoreColor(scoringResult2?.overall_score)})`}
              >
                {scoringResult2?.overall_score || 0}
              </span>
              <span className="text-sm text-(--color-text-muted)">/100</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 mb-6 flex justify-between px-5">
        <div>
          <Button as={Link} to="/assessments/compare" variant="ghost" size="sm">
            <MoveLeft size={14} className="mr-1" /> Compare Others
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {[
            {
              label: 'Comparison PDF',
              action: async () => {
                try {
                  await exportComparisonPDF([assessment1, assessment2]);
                  toast.success('Comparison PDF downloaded successfully', {
                    timeout: 4000,
                  });
                } catch (error) {
                  logger.warn('Comparison PDF download failed:', error);
                  toast.danger('PDF download functionality is currently unavailable', {
                    timeout: 4000,
                  });
                }
              },
            },
            {
              label: 'Comparison CSV',
              action: async () => {
                try {
                  await exportComparisonCSV([assessment1, assessment2]);
                  toast.success('Comparison CSV downloaded successfully', {
                    timeout: 4000,
                  });
                } catch (error) {
                  logger.warn('Comparison CSV download failed:', error);
                  toast.danger('CSV download functionality is currently unavailable', {
                    timeout: 4000,
                  });
                }
              },
            },
          ].map(({ label, action }) => (
            <Button
              key={label}
              size="sm"
              variant="dialog-secondary"
              onPress={action}
              className="w-fit"
            >
              <Download size={16} /> {label}
            </Button>
          ))}
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
          <div className="relative pr-6 lg:pr-8">
            <Separator orientation="vertical" wrapperCn="absolute top-0 right-0 h-full" />
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
      <div className="mt-8 flex items-center justify-end">
        <Button variant="ghost" as={Link} to="/assessments">
          <MoveLeft size={16} /> Back to Assessments
        </Button>
      </div>
    </div>
  );
}
