/**
 * @module AssessmentComparisonPage
 * @description Side-by-side comparison of two saved assessments by public ID.
 */

import { Tooltip, toast } from '@heroui/react';
import {
  Download,
  ExternalLink,
  Files,
  FingerprintPattern,
  MoveLeft,
  RotateCw,
} from 'lucide-react';
import PropTypes from 'prop-types';
import { useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { Button, DetailsDisplay, Separator } from '@/components/common';
import { useAssessmentComparison } from '@/features/assessments/hooks';
import { reconstructScoringResult } from '@/features/assessments/utils';
import { exportComparisonCSV, exportComparisonPDF } from '@/features/export';

import { AssessmentColumn, ChangeIndicator, ComparisonSkeleton } from './components';
import { computeAssessmentData } from './utils/assessmentUtils';

/**
 * Comparison header title with external share link.
 * @param {Object} props
 * @param {{ title: string }} props.assessment
 * @param {string} props.publicId
 * @param {boolean} [props.isRightAligned]
 * @returns {import('react').ReactElement}
 */
function AssessmentTitleWithLink({ assessment, publicId, isRightAligned = false }) {
  return (
    <div className={`flex items-center gap-2 ${isRightAligned ? 'justify-end' : ''}`}>
      {!isRightAligned && (
        <h2 className="truncate font-jua text-2xl font-medium text-(--color-text-primary)">
          {assessment.title}
        </h2>
      )}
      <Tooltip delay={0}>
        <Tooltip.Trigger className="item-center flex" tabIndex={0}>
          <Link to={`/assessments/share/${publicId}`} target="_blank" rel="noopener noreferrer">
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
}

AssessmentTitleWithLink.propTypes = {
  assessment: PropTypes.shape({
    title: PropTypes.string,
  }).isRequired,
  publicId: PropTypes.string.isRequired,
  isRightAligned: PropTypes.bool,
};

/**
 * Fetches two assessments and renders dual `AssessmentColumn` layouts.
 * @returns {import('react').ReactElement}
 */
export default function AssessmentComparisonPage() {
  const navigate = useNavigate();
  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, [navigate]);

  const [searchParams] = useSearchParams();

  // Support query params (/assessments/compare/?id1=...&id2=...)
  const publicId1 = searchParams.get('id1');
  const publicId2 = searchParams.get('id2');

  const { assessment1, assessment2, isLoading, isError, error } = useAssessmentComparison(
    publicId1,
    publicId2,
  );

  if (!publicId1 || !publicId2) {
    return (
      <DetailsDisplay
        variant="warning"
        title="Unable to Compare"
        description="Please select two assessments to compare. Missing required assessment IDs."
        actions={[
          {
            label: 'Refresh',
            icon: RotateCw,
            variant: 'ghost',
            onPress: handleRefresh,
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
        description={error || 'One or both IDs incorrect'}
        actions={[
          {
            label: 'Refresh',
            icon: RotateCw,
            variant: 'ghost',
            onPress: handleRefresh,
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
        description="One or both of the selected assessments could not be found. They may have been deleted or you may not have permission to access them."
        actions={[
          {
            label: 'Refresh',
            icon: RotateCw,
            variant: 'ghost',
            onPress: handleRefresh,
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
          <Button as={Link} to="/assessments/compare" variant="ghost" size="sm" icon={MoveLeft}>
            Compare Others
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
              variant="bordered"
              onPress={action}
              icon={Download}
              className="w-fit"
            >
              {label}
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
        <div className="flex">
          <AssessmentColumn
            assessment={assessment1}
            scoringResult={scoringResult1}
            {...assessment1Data}
          />
          <Separator orientation="vertical" wrapperCn="mx-6 lg:mx-8" />
          <AssessmentColumn
            assessment={assessment2}
            scoringResult={scoringResult2}
            {...assessment2Data}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 flex items-center justify-end">
        <Button variant="ghost" as={Link} to="/assessments" icon={Files}>
          My Assessments
        </Button>
      </div>
    </div>
  );
}
