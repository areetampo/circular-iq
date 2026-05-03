import { Checkbox, Label, Skeleton } from '@heroui/react';
import { Download, Eye, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button, Chip, CopyIcon, Separator, Spinner, Tilt3D } from '@/components/common';
import { useAssessmentHandlers } from '@/features/export/assessmentHandlers';
import { formatTimestamp, toTitleCase } from '@/lib/formatting';
import { cn } from '@/utils/cn';

const scoreColor = (s) =>
  s >= 75 ? '--color-success' : s >= 50 ? '--color-warning' : '--color-error';

const AssessmentListItem = React.memo(function AssessmentListItem({
  assessment,
  isSelected,
  onToggleSelect,
  onView,
  onRename,
  onDelete,
  onPrefetch,
  onTogglePublic,
}) {
  const assessmentLink = `/assessments/${assessment.public_id}`;
  const formattedDate = formatTimestamp(assessment.created_at);

  const [copiedPublicId, setCopiedPublicId] = useState(null);
  const [togglingPublic, setTogglingPublic] = useState(null);

  // Use centralized assessment handlers
  const {
    handleDownloadPDFWithErrorHandling,
    handleDownloadCSVWithErrorHandling,
    handleReevaluate: handleReevaluateInternal,
    isExportingPDF,
    isExportingCSV,
  } = useAssessmentHandlers();

  const handleCopy = (publicId, value) => {
    navigator.clipboard.writeText(value);
    setCopiedPublicId(publicId);
    setTimeout(() => setCopiedPublicId(null), 1500);
  };

  const handleTogglePublic = async (id) => {
    setTogglingPublic(id);
    try {
      await onTogglePublic(id);
    } finally {
      setTogglingPublic(null);
    }
  };

  // Handle re-evaluate using centralized handler
  const handleReevaluateClick = () => {
    if (assessment) {
      handleReevaluateInternal(assessment);
    }
  };

  // Handle PDF download using centralized handler
  const handlePDFDownload = () => {
    if (assessment) {
      // For AssessmentListItem, we use the assessment itself as both assessment and result
      // The handler will extract the necessary data
      handleDownloadPDFWithErrorHandling(assessment, assessment);
    }
  };

  // Handle CSV download using centralized handler
  const handleCSVDownload = () => {
    if (assessment) {
      // For AssessmentListItem, we use the assessment itself as both assessment and result
      // The handler will extract the necessary data
      handleDownloadCSVWithErrorHandling(assessment, assessment);
    }
  };

  const actionButtons = [
    { icon: Eye, label: 'View', onClick: () => onView(assessment.public_id), link: assessmentLink },
    { icon: Pencil, label: 'Rename', onClick: () => onRename(assessment.id) },
    { icon: Trash2, label: 'Delete', onClick: () => onDelete(assessment.id) },
    { icon: RefreshCw, label: 'Re-evaluate', onClick: handleReevaluateClick },
    {
      icon: CopyIcon,
      label: 'ID',
      onClick: () => handleCopy(assessment.public_id, assessment.public_id),
    },
    {
      icon: Download,
      label: 'PDF',
      onClick: handlePDFDownload,
      isLoading: isExportingPDF,
      isDisabled: isExportingPDF,
    },
    {
      icon: Download,
      label: 'CSV',
      onClick: handleCSVDownload,
      isLoading: isExportingCSV,
      isDisabled: isExportingCSV,
    },
  ];

  const renderBtn = (btn, idx) => {
    const buttonProps = btn.link ? { as: Link, to: btn.link } : {};
    return (
      <Button
        key={idx}
        variant="ghastly"
        size="xs"
        onClick={(e) => {
          e.stopPropagation();
          btn.onClick();
        }}
        label={btn.label}
        isDisabled={btn.isDisabled}
        isLoading={btn.isLoading}
        className="flex items-center gap-1"
        {...buttonProps}
      >
        <btn.icon
          size={11}
          strokeWidth={2.5}
          {...(btn.label === 'ID' && {
            hasCopied: copiedPublicId === assessment.public_id,
            copyIconClassname: 'pr-3',
          })}
        />
        <span>{btn.label}</span>
      </Button>
    );
  };

  return (
    <Tilt3D
      rotateRange={{ x: 2, y: 3 }}
      block
      className={cn(
        'group relative mb-2 block rounded-xl border-2 p-4 transition-all duration-200',
        'bg-(--color-bg-card-faint) hover:bg-(--color-bg-card-hover)',
        isSelected
          ? 'border-(--color-accent-border-selected) bg-(--color-bg-card-selected) shadow-[0_0_0_2px_var(--color-accent-light-mid)]'
          : 'border-(--color-drawer-border)',
      )}
      onMouseEnter={() => onPrefetch(assessment.public_id)}
    >
      {/* Main content row */}
      <div className="flex items-start justify-between gap-3">
        {/* Title and metadata section */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <h3 className="mb-1 truncate font-sans text-2xl/tight font-[450] text-(--color-text-primary)">
            <Link to={assessmentLink} className="block truncate">
              {assessment.title ||
                formatTimestamp(assessment.created_at, {
                  showSeconds: true,
                  showMilliseconds: true,
                }) ||
                'Untitled Assessment'}
            </Link>
          </h3>
          <p className="mb-2 text-[0.75rem] text-(--color-text-muted)">{formattedDate}</p>

          {/* Tags row */}
          <div className="flex flex-wrap items-center gap-2">
            {assessment.industry && (
              <Chip variant="factor">{toTitleCase(assessment.industry)}</Chip>
            )}
          </div>
        </div>

        {/* Right side: score + buttons, always right-aligned */}
        <div className="ml-auto flex shrink-0 items-start gap-3">
          {/* Score section */}
          <div className="text-right">
            {assessment.overall_score ? (
              <span
                className={`text-(${scoreColor(assessment.overall_score)}) font-mono text-[1.35rem] leading-none tracking-[-0.04em]`}
              >
                {assessment.overall_score}
                <span className="mx-1.5">/</span>
                100
              </span>
            ) : (
              <span className="text-[0.6875rem] font-semibold tracking-widest text-(--color-text-muted) uppercase">
                UNRATED
              </span>
            )}
            <p className="mt-0.5 text-[0.75rem] text-(--color-text-muted)">
              {assessment.confidence_level || 0}% conf.
            </p>
          </div>

          {/* Action buttons – background only around buttons */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex flex-col items-end gap-1">
              {[
                [0, 3],
                [3, 5],
                [5, 7],
              ].map(([start, end], rowIdx) => (
                <div key={rowIdx} className="flex gap-1">
                  {actionButtons.slice(start, end).map((btn, idx) => renderBtn(btn, start + idx))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row with additional stats and controls */}
      <div className="mt-5 flex items-center justify-between">
        {/* Additional stats */}
        <div className="flex items-center gap-2 text-[0.7rem] text-(--color-text-muted) [&>span]:font-mono">
          {assessment.technical_feasibility && (
            <>
              <span>Tech: {assessment.technical_feasibility}%</span>
              <Separator orientation="vertical" />
            </>
          )}
          {assessment.economic_viability && (
            <>
              <span>Econ: {assessment.economic_viability}%</span>
              <Separator orientation="vertical" />
            </>
          )}
          {assessment.circularity_potential && (
            <>
              <span>Circular: {assessment.circularity_potential}%</span>
              <Separator orientation="vertical" />
            </>
          )}
          {assessment.risk_level && <span>{assessment.risk_level.toUpperCase()} RISK</span>}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Select to compare checkbox */}
          <Checkbox
            id={`select-to-compare-${assessment.id}`}
            isSelected={isSelected}
            onChange={() => onToggleSelect(assessment.id, assessment.public_id)}
          >
            <Checkbox.Control>
              <Checkbox.Indicator>
                {({ isSelected }) =>
                  isSelected ? <div className="checkbox__default-indicator--plus" /> : null
                }
              </Checkbox.Indicator>
            </Checkbox.Control>
            <Checkbox.Content className="-ml-1.5">
              <Label
                htmlFor={`select-to-compare-${assessment.id}`}
                className="checkbox-label-hover text-[0.75rem] font-normal text-(--color-text-muted) transition-colors"
                style={{ '--checkbox-label-hover-color': 'var(--text-color-primary)' }}
              >
                Select to compare
              </Label>
            </Checkbox.Content>
          </Checkbox>

          {/* Public/Private checkbox with HeroUI Spinner */}
          <Checkbox
            id={`public-toggle-${assessment.id}`}
            isSelected={assessment.is_public}
            onChange={() => handleTogglePublic(assessment.id)}
            isDisabled={togglingPublic === assessment.id}
          >
            {togglingPublic === assessment.id ? (
              <Spinner />
            ) : (
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
            )}
            <Checkbox.Content className="-ml-1.5">
              <Label
                htmlFor={`public-toggle-${assessment.id}`}
                className="checkbox-label-hover text-[0.75rem] font-normal text-(--color-text-muted) transition-colors"
                style={{ '--checkbox-label-hover-color': 'var(--text-color-primary)' }}
              >
                Public
              </Label>
            </Checkbox.Content>
          </Checkbox>
        </div>
      </div>
    </Tilt3D>
  );
});

AssessmentListItem.propTypes = {
  assessment: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    industry: PropTypes.string,
    score: PropTypes.number,
    is_public: PropTypes.bool,
    public_id: PropTypes.string,
    contribute_to_global_benchmarks: PropTypes.bool,
    created_at: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.instanceOf(Date),
    ]),
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  onToggleSelect: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  onRename: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onPrefetch: PropTypes.func.isRequired,
  onTogglePublic: PropTypes.func.isRequired,
};

// Skeleton Components
export const AssessmentCardSkeleton = () => (
  <div className="group relative cursor-pointer rounded-xl border-2 border-(--color-drawer-border) bg-(--color-bg-card-faint) p-4 transition-all duration-200">
    {/* Main content row */}
    <div className="flex items-start gap-3">
      {/* Title and metadata section */}
      <div className="min-w-0 flex-1">
        {/* Title skeleton */}
        <Skeleton animationType="shimmer" className="mb-3 h-6 w-3/4" />

        {/* Date skeleton */}
        <Skeleton animationType="shimmer" className="mb-3 h-3 w-32" />

        {/* Tags row skeleton */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Industry chip skeleton */}
          <Skeleton animationType="shimmer" className="h-6 w-20 rounded-full!" />
          {/* Public/Private chip skeleton */}
          <Skeleton animationType="shimmer" className="h-6 w-16 rounded-full!" />
        </div>
      </div>

      {/* Score section */}
      <div className="min-w-20 shrink-0 text-right">
        {/* Score skeleton */}
        <Skeleton animationType="shimmer" className="mb-2 ml-auto h-7 w-24" />
        {/* Confidence skeleton */}
        <Skeleton animationType="shimmer" className="ml-auto h-3 w-16" />
      </div>

      {/* Action buttons skeleton */}
      <div className="flex flex-col items-end gap-2">
        {[[3], [2], [2]].map(([count], rowIdx) => (
          <div key={rowIdx} className="flex gap-1">
            {Array(count)
              .fill(0)
              .map((_, idx) => (
                <div key={idx} className="flex items-center gap-1 px-2 py-1">
                  <Skeleton animationType="shimmer" className="size-2.5" />
                  <Skeleton animationType="shimmer" className="h-2.5 w-8" />
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>

    {/* Bottom row with additional stats and controls */}
    <div className="mt-3 flex items-center justify-between pt-3">
      {/* Additional stats skeleton */}
      <div className="flex items-center gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} animationType="shimmer" className="h-3 w-18" />
        ))}
      </div>

      {/* Controls skeleton */}
      <div className="flex items-center gap-3">
        {/* Select to compare checkbox skeleton */}
        <div className="flex items-center gap-1.5">
          <Skeleton animationType="shimmer" className="size-4" />
          <Skeleton animationType="shimmer" className="h-3 w-22" />
        </div>
        {/* Public checkbox skeleton */}
        <div className="flex items-center gap-1.5">
          <Skeleton animationType="shimmer" className="size-4" />
          <Skeleton animationType="shimmer" className="h-3 w-12" />
        </div>
      </div>
    </div>
  </div>
);

export const AssessmentListSkeleton = () => (
  <div className="mt-8 space-y-2">
    <div className="mb-4 flex flex-col items-center justify-center gap-3">
      <Skeleton animationType="shimmer" className="h-5 w-60" />
      <div className="flex items-center justify-center gap-6">
        <Skeleton animationType="shimmer" className="h-7 w-100" />
        <Skeleton animationType="shimmer" className="h-7 w-30" />
        <Skeleton animationType="shimmer" className="h-7 w-30" />
      </div>
    </div>
    {Array(3)
      .fill(0)
      .map((_, i) => (
        <AssessmentCardSkeleton key={i} />
      ))}
  </div>
);

// Assessment List Component (wrapper for list items)
export const AssessmentList = ({ assessments, selectedIds, ...props }) => (
  <div className="space-y-0">
    {assessments.map((assessment) => (
      <AssessmentListItem
        key={assessment.id}
        assessment={assessment}
        isSelected={selectedIds.has(assessment.id)}
        selectedIds={selectedIds}
        {...props}
      />
    ))}
  </div>
);

AssessmentList.propTypes = {
  assessments: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default AssessmentListItem;
export { AssessmentListItem };
