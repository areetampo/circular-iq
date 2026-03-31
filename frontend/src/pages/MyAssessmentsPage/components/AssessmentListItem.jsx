import { Tooltip } from '@heroui/react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

import { Chip, Switch } from '@/components/common';
import { formatTimestamp } from '@/lib/formatting';

const AssessmentListItem = React.memo(function AssessmentListItem({
  assessment,
  isSelected,
  onToggleSelect,
  onView,
  onRename,
  onDelete,
  onPrefetch,
  onTogglePublic,
  onToggleBenchmarks,
}) {
  const formattedDate = formatTimestamp(assessment.created_at);

  return (
    <div
      className={`bg-transparent border-(--color-border) rounded-md hover:border-(--color-accent) transition-all duration-200 mb-3 cursor-pointer ${
        isSelected ? 'border-(--color-accent) bg-(--color-accent-light)' : ''
      }`}
      onMouseEnter={() => onPrefetch(assessment.public_id)}
      onClick={() => onView(assessment.public_id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onView(assessment.public_id);
        }
      }}
      aria-label={`View assessment: ${assessment.title || 'Untitled'}`}
    >
      {/* Top row */}
      <div className="flex items-center gap-3 mb-2">
        {/* Checkbox for compare */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id={`select-${assessment.id}`}
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect(assessment.id);
            }}
            className="w-4 h-4 rounded border-(--color-border-strong) text-(--color-accent) focus:ring-(--color-accent-light)"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select assessment: ${assessment.title || 'Untitled'} for comparison`}
          />
        </div>

        {/* Status chip */}
        <Chip variant="status">{assessment.metadata?.tier || 'UNRATED'}</Chip>

        {/* Assessment name */}
        <span className="text-sm font-semibold text-(--color-text-primary) flex-1 truncate">
          {assessment.title || 'Untitled Assessment'}
        </span>

        {/* Score */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-(--color-text-primary)">
            {assessment.score || 0}
          </span>
          <span className="text-xs text-(--color-text-muted)">/100</span>
        </div>

        {/* Confidence */}
        <span className="text-xs text-(--color-text-muted)">
          {assessment.confidence_level || 0}% CONF.
        </span>

        {/* Action icons */}
        <div className="flex items-center gap-2 ml-3">
          <Tooltip content="View">
            <button
              className="text-(--color-text-muted) hover:text-(--color-text-primary) w-4 h-4 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onView(assessment.public_id);
              }}
            >
              <Eye size={16} />
            </button>
          </Tooltip>
          <Tooltip content="Rename">
            <button
              className="text-(--color-text-muted) hover:text-(--color-text-primary) w-4 h-4 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onRename(assessment.id);
              }}
            >
              <Pencil size={16} />
            </button>
          </Tooltip>
          <Tooltip content="Delete">
            <button
              className="text-(--color-text-muted) hover:text-(--color-text-primary) w-4 h-4 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(assessment.id);
              }}
            >
              <Trash2 size={16} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Industry chip */}
          {assessment.industry && <Chip variant="category">{assessment.industry}</Chip>}

          {/* Date */}
          <span className="text-xs text-(--color-text-muted)">{formattedDate}</span>

          {/* Preview text */}
          {assessment.business_problem && (
            <span className="text-xs text-(--color-text-muted) truncate max-w-xs">
              {assessment.business_problem}
            </span>
          )}
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-3">
          {/* Benchmarks toggle */}
          <div className="flex items-center gap-1">
            <Switch
              size="sm"
              isSelected={assessment.contribute_to_global_benchmarks}
              onValueChange={(value) => {
                onToggleBenchmarks(assessment.id);
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <span className="text-xs text-(--color-text-muted)">Benchmarks</span>
          </div>

          {/* Public toggle */}
          <div className="flex items-center gap-1">
            <Switch
              size="sm"
              isSelected={assessment.is_public}
              onValueChange={(value) => {
                onTogglePublic(assessment.id);
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <span className="text-xs text-(--color-text-muted)">Public</span>
          </div>
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
    overall_score: PropTypes.number,
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
  onToggleBenchmarks: PropTypes.func.isRequired,
};

// Skeleton Components
export const AssessmentCardSkeleton = () => (
  <div className="bg-transparent border-(--color-border) rounded-md transition-all duration-200 mb-3">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-4 h-4 rounded bg-gray-200 animate-pulse" />
      <div className="h-6 w-20 rounded-md bg-gray-200 animate-pulse" />
      <div className="h-4 w-32 flex-1 rounded-md bg-gray-200 animate-pulse" />
      <div className="h-8 w-12 rounded-md bg-gray-200 animate-pulse" />
      <div className="h-3 w-16 rounded-md bg-gray-200 animate-pulse" />
      <div className="flex items-center gap-2 ml-3">
        <div className="w-4 h-4 rounded bg-gray-200 animate-pulse" />
        <div className="w-4 h-4 rounded bg-gray-200 animate-pulse" />
        <div className="w-4 h-4 rounded bg-gray-200 animate-pulse" />
      </div>
    </div>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-4 w-16 rounded-md bg-gray-200 animate-pulse" />
        <div className="h-3 w-20 rounded-md bg-gray-200 animate-pulse" />
        <div className="h-3 w-40 rounded-md bg-gray-200 animate-pulse" />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="w-8 h-4 rounded bg-gray-200 animate-pulse" />
          <div className="h-3 w-16 rounded-md bg-gray-200 animate-pulse" />
        </div>
        <div className="flex items-center gap-1">
          <div className="w-8 h-4 rounded bg-gray-200 animate-pulse" />
          <div className="h-3 w-12 rounded-md bg-gray-200 animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

export const AssessmentListSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4, 5].map((i) => (
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
