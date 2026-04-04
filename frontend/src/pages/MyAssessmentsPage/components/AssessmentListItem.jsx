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
        'group relative border-2 rounded-xl p-4 mb-2 transition-all duration-200 cursor-pointer',
        'bg-[rgba(245,240,232,0.45)] hover:bg-[rgba(245,240,232,0.6)]',
        isSelected
          ? 'border-[rgba(184,145,106,0.5)] bg-[rgba(245,240,232,0.55)] shadow-[0_0_0_2px_rgba(184,145,106,0.15)]'
          : 'border-[rgba(180,160,130,0.22)] hover:border-[rgba(184,145,106,0.38)]',
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
        <div className="flex-1 min-w-0">
          <h3 className="text-[1rem] font-medium text-(--color-text-primary) leading-tight truncate mb-1 font-mono">
            {assessment.title || 'Untitled Assessment'}
          </h3>
          <p className="text-[12px] text-(--color-text-muted) mb-2">{formattedDate}</p>

          {/* Tags row */}
          <div className="flex items-center gap-2 flex-wrap">
            {assessment.industry && (
              <Chip variant="tag" className="text-[10px]">
                {assessment.industry}
              </Chip>
            )}
            <Chip variant={assessment.is_public ? 'default' : 'secondary'} className="text-[10px]">
              {assessment.is_public ? 'Public' : 'Private'}
            </Chip>
          </div>
        </div>

        {/* Score section */}
        <div className="text-right shrink-0 min-w-20">
          {assessment.overall_score ? (
            <span
              className="font-(--font-mono) text-[1.35rem] text-(--color-text-primary) tracking-[-0.04em] leading-none"
              style={{ color: scoreColor(assessment.overall_score) }}
            >
              {assessment.overall_score} / 100
            </span>
          ) : (
            <span className="text-[11px] font-semibold tracking-widest uppercase text-(--color-text-muted)">
              UNRATED
            </span>
          )}
          <p className="text-[0.75rem] text-(--color-text-muted) mt-0.5">
            {assessment.confidence_level || 0}% conf.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0 opacity-100 transition-opacity duration-300">
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
              className={`flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer text-[0.65rem] text-(--color-text-muted) hover:${hoverColor} transition-colors`}
            >
              <Icon size={11} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom row with additional stats and controls */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[rgba(180,160,130,0.15)]">
        {/* Additional stats */}
        <div className="flex items-center gap-3 text-[0.7rem] [&>span]:font-mono text-(--color-text-muted)">
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
            className="flex items-center gap-1.5 text-[12px] text-(--color-text-muted) hover:text-(--color-text-primary) transition-colors cursor-pointer"
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
              className="w-3 h-3 accent-(--color-accent) cursor-pointer"
            />
            <span>Select to compare</span>
          </label>

          {/* Public/Private checkbox */}
          <label
            className="flex items-center gap-1.5 text-[12px] text-(--color-text-muted) hover:text-(--color-text-primary) transition-colors cursor-pointer"
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
              className="w-3 h-3 accent-(--color-accent) cursor-pointer"
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
  <div className="group relative border-2 rounded-xl p-4 mb-2 transition-all duration-200 cursor-pointer bg-[rgba(245,240,232,0.45)] border-[rgba(180,160,130,0.22)]">
    {/* Main content row */}
    <div className="flex items-start gap-3">
      {/* Title and metadata section */}
      <div className="flex-1 min-w-0">
        {/* Title skeleton */}
        <Skeleton animationType="shimmer" className="h-4 w-3/4 rounded mb-1" />

        {/* Date skeleton */}
        <Skeleton animationType="shimmer" className="h-3 w-24 rounded mb-2" />

        {/* Tags row skeleton */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Industry chip skeleton */}
          <Skeleton animationType="shimmer" className="h-5 w-16 rounded-full" />
          {/* Public/Private chip skeleton */}
          <Skeleton animationType="shimmer" className="h-5 w-12 rounded-full" />
        </div>
      </div>

      {/* Score section */}
      <div className="text-right shrink-0 min-w-20">
        {/* Score skeleton */}
        <Skeleton animationType="shimmer" className="h-6 w-16 rounded mb-0.5 ml-auto" />
        {/* Confidence skeleton */}
        <Skeleton animationType="shimmer" className="h-3 w-12 rounded ml-auto" />
      </div>

      {/* Action buttons skeleton */}
      <div className="flex items-center gap-1 shrink-0">
        {/* View button skeleton */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg">
          <Skeleton animationType="shimmer" className="w-2.5 h-2.5 rounded" />
          <Skeleton animationType="shimmer" className="h-2.5 w-8 rounded" />
        </div>
        {/* Rename button skeleton */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg">
          <Skeleton animationType="shimmer" className="w-2.5 h-2.5 rounded" />
          <Skeleton animationType="shimmer" className="h-2.5 w-10 rounded" />
        </div>
        {/* Delete button skeleton */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg">
          <Skeleton animationType="shimmer" className="w-2.5 h-2.5 rounded" />
          <Skeleton animationType="shimmer" className="h-2.5 w-8 rounded" />
        </div>
      </div>
    </div>

    {/* Bottom row with additional stats and controls */}
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[rgba(180,160,130,0.15)]">
      {/* Additional stats skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton animationType="shimmer" className="h-3 w-16 rounded" />
        <Skeleton animationType="shimmer" className="h-3 w-14 rounded" />
        <Skeleton animationType="shimmer" className="h-3 w-16 rounded" />
      </div>

      {/* Controls skeleton */}
      <div className="flex items-center gap-3">
        {/* Select to compare checkbox skeleton */}
        <div className="flex items-center gap-1.5">
          <Skeleton animationType="shimmer" className="w-3 h-3 rounded" />
          <Skeleton animationType="shimmer" className="h-3 w-20 rounded" />
        </div>
        {/* Public checkbox skeleton */}
        <div className="flex items-center gap-1.5">
          <Skeleton animationType="shimmer" className="w-3 h-3 rounded" />
          <Skeleton animationType="shimmer" className="h-3 w-10 rounded" />
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
