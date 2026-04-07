import { Skeleton } from '@heroui/react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

import { Chip } from '@/components/common';
import { formatTimestamp } from '@/lib/formatting';
import { cn } from '@/utils/cn';

const scoreColor = (s) =>
  s >= 75 ? 'var(--color-success)' : s >= 50 ? 'var(--color-warning)' : 'var(--color-error)';

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
  const formattedDate = formatTimestamp(assessment.created_at);

  return (
    <div
      className={cn(
        `group relative mb-2 cursor-pointer rounded-xl border-2 p-4 transition-all duration-200`,
        `bg-[rgba(245,240,232,0.45)] hover:bg-[rgba(245,240,232,0.6)]`,
        isSelected
          ? `border-[rgba(184,145,106,0.5)] bg-[rgba(245,240,232,0.55)] shadow-[0_0_0_2px_rgba(184,145,106,0.15)]`
          : `border-[rgba(180,160,130,0.22)] hover:border-[rgba(184,145,106,0.8)]`,
      )}
      onClick={() => onView(assessment.public_id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onView(assessment.public_id);
        }
      }}
      onMouseEnter={() => onPrefetch(assessment.public_id)}
      aria-label={`View assessment: ${assessment.title || 'Untitled'}`}
    >
      {/* Main content row */}
      <div className="flex items-start gap-3">
        {/* Title and metadata section */}
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 truncate font-mono text-base/tight font-medium text-(--color-text-primary)">
            {assessment.title || 'Untitled Assessment'}
          </h3>
          <p className="mb-2 text-[0.75rem] text-(--color-text-muted)">{formattedDate}</p>

          {/* Tags row */}
          <div className="flex flex-wrap items-center gap-2">
            {assessment.industry && (
              <Chip variant="factor" className="text-[0.625rem]">
                {assessment.industry}
              </Chip>
            )}
            <Chip
              variant="access-type"
              color={assessment.is_public ? 'public' : 'private'}
              className="text-[0.625rem]"
            >
              {assessment.is_public ? 'Public' : 'Private'}
            </Chip>
          </div>
        </div>

        {/* Score section */}
        <div className="min-w-20 shrink-0 text-right">
          {assessment.overall_score ? (
            <span
              className="font-mono text-[1.35rem] leading-none tracking-[-0.04em]"
              style={{
                '--score-color': scoreColor(assessment.overall_score),
                color: 'var(--score-color)',
              }}
            >
              {assessment.overall_score} / 100
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

        {/* Action buttons */}
        <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity duration-300">
          {[
            {
              icon: Eye,
              label: 'View',
              onClick: (e) => {
                e.stopPropagation();
                onView(assessment.public_id);
              },
              title: 'View',
              hoverColor: 'text-(--color-text-primary) hover:bg-[rgba(180,160,130,0.12)]',
            },
            {
              icon: Pencil,
              label: 'Rename',
              onClick: (e) => {
                e.stopPropagation();
                onRename(assessment.id);
              },
              title: 'Rename',
              hoverColor: 'text-(--color-text-primary) hover:bg-[rgba(180,160,130,0.12)]',
            },
            {
              icon: Trash2,
              label: 'Delete',
              onClick: (e) => {
                e.stopPropagation();
                onDelete(assessment.id);
              },
              title: 'Delete',
              hoverColor: 'text-(--color-text-primary) hover:bg-[rgba(180,160,130,0.12)]',
            },
          ].map(({ icon: Icon, label, onClick, title, hoverColor }) => (
            <button
              key={label}
              onClick={onClick}
              title={title}
              className={cn(
                `flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[0.65rem] text-(--color-text-muted) transition-colors`,
                `hover:${hoverColor}`,
              )}
            >
              <Icon size={11} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom row with additional stats and controls */}
      <div className="mt-3 flex items-center justify-between border-t border-[rgba(180,160,130,0.15)] pt-3">
        {/* Additional stats */}
        <div className="flex items-center gap-3 text-[0.7rem] text-(--color-text-muted) [&>span]:font-mono">
          {assessment.technical_feasibility && (
            <span>Tech: {assessment.technical_feasibility}%</span>
          )}
          {assessment.economic_viability && <span>Econ: {assessment.economic_viability}%</span>}
          {assessment.circularity_potential && (
            <span>Circular: {assessment.circularity_potential}%</span>
          )}
          {assessment.risk_level && (
            <span className="font-medium">{assessment.risk_level.toUpperCase()} RISK</span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Select to compare checkbox */}
          <label
            className="flex cursor-pointer items-center gap-1.5 text-[0.75rem] text-(--color-text-muted) transition-colors hover:text-(--color-text-primary)"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelect(assessment.id);
              }}
              onClick={(e) => e.stopPropagation()}
              title="Select for comparison"
              className="size-3 cursor-pointer accent-(--color-accent)"
            />
            <span>Select to compare</span>
          </label>

          {/* Public/Private checkbox */}
          <label
            className="flex cursor-pointer items-center gap-1.5 text-[0.75rem] text-(--color-text-muted) transition-colors hover:text-(--color-text-primary)"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={assessment.is_public}
              onChange={(e) => {
                e.stopPropagation();
                onTogglePublic(assessment.id);
              }}
              onClick={(e) => e.stopPropagation()}
              className="size-3 cursor-pointer accent-(--color-accent)"
            />
            <span>Public</span>
          </label>
        </div>
      </div>
    </div>
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
  <div className="group relative mb-2 cursor-pointer rounded-xl border-2 border-[rgba(180,160,130,0.22)] bg-[rgba(245,240,232,0.45)] p-4 transition-all duration-200">
    {/* Main content row */}
    <div className="flex items-start gap-3">
      {/* Title and metadata section */}
      <div className="min-w-0 flex-1">
        {/* Title skeleton */}
        <Skeleton animationType="shimmer" className="mb-1 h-4 w-3/4 rounded-sm" />

        {/* Date skeleton */}
        <Skeleton animationType="shimmer" className="mb-2 h-3 w-24 rounded-sm" />

        {/* Tags row skeleton */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Industry chip skeleton */}
          <Skeleton animationType="shimmer" className="h-5 w-16 rounded-full" />
          {/* Public/Private chip skeleton */}
          <Skeleton animationType="shimmer" className="h-5 w-12 rounded-full" />
        </div>
      </div>

      {/* Score section */}
      <div className="min-w-20 shrink-0 text-right">
        {/* Score skeleton */}
        <Skeleton animationType="shimmer" className="mb-0.5 ml-auto h-6 w-16 rounded-sm" />
        {/* Confidence skeleton */}
        <Skeleton animationType="shimmer" className="ml-auto h-3 w-12 rounded-sm" />
      </div>

      {/* Action buttons skeleton */}
      <div className="flex shrink-0 items-center gap-1">
        {/* View button skeleton */}
        <div className="flex items-center gap-1 rounded-lg px-2 py-1">
          <Skeleton animationType="shimmer" className="size-2.5 rounded-sm" />
          <Skeleton animationType="shimmer" className="h-2.5 w-8 rounded-sm" />
        </div>
        {/* Rename button skeleton */}
        <div className="flex items-center gap-1 rounded-lg px-2 py-1">
          <Skeleton animationType="shimmer" className="size-2.5 rounded-sm" />
          <Skeleton animationType="shimmer" className="h-2.5 w-10 rounded-sm" />
        </div>
        {/* Delete button skeleton */}
        <div className="flex items-center gap-1 rounded-lg px-2 py-1">
          <Skeleton animationType="shimmer" className="size-2.5 rounded-sm" />
          <Skeleton animationType="shimmer" className="h-2.5 w-8 rounded-sm" />
        </div>
      </div>
    </div>

    {/* Bottom row with additional stats and controls */}
    <div className="mt-3 flex items-center justify-between border-t border-[rgba(180,160,130,0.15)] pt-3">
      {/* Additional stats skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton animationType="shimmer" className="h-3 w-16 rounded-sm" />
        <Skeleton animationType="shimmer" className="h-3 w-14 rounded-sm" />
        <Skeleton animationType="shimmer" className="h-3 w-16 rounded-sm" />
      </div>

      {/* Controls skeleton */}
      <div className="flex items-center gap-3">
        {/* Select to compare checkbox skeleton */}
        <div className="flex items-center gap-1.5">
          <Skeleton animationType="shimmer" className="size-3 rounded-sm" />
          <Skeleton animationType="shimmer" className="h-3 w-20 rounded-sm" />
        </div>
        {/* Public checkbox skeleton */}
        <div className="flex items-center gap-1.5">
          <Skeleton animationType="shimmer" className="size-3 rounded-sm" />
          <Skeleton animationType="shimmer" className="h-3 w-10 rounded-sm" />
        </div>
      </div>
    </div>
  </div>
);

export const AssessmentListSkeleton = () => (
  <div className="space-y-0">
    {[1, 2, 3].map((i) => (
      <AssessmentCardSkeleton key={i} />
    ))}
  </div>
);

// Assessment List Component (wrapper for list items)
export const AssessmentList = ({ assessments, ...props }) => (
  <div className="space-y-0">
    {assessments.map((assessment) => (
      <AssessmentListItem key={assessment.id} assessment={assessment} {...props} />
    ))}
  </div>
);

AssessmentList.propTypes = {
  assessments: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default AssessmentListItem;
export { AssessmentListItem };
