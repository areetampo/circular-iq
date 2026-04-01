import { Eye, Pencil, Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

import { Chip, Switch } from '@/components/common';
import { formatTimestamp } from '@/lib/formatting';
import { cn } from '@/utils/cn';

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
      className={cn(
        'border rounded-lg p-4 mb-3 transition-colors',
        isSelected
          ? 'border-(--color-accent) bg-(--color-accent-light)'
          : 'border-(--color-border) bg-transparent hover:border-(--color-border-strong)',
      )}
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
      {/* Top row: checkbox + status + name + score + conf + icons */}
      <div className="flex items-center gap-3 mb-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-4 h-4 accent-(--color-accent) shrink-0"
          title="Select for comparison"
          onClick={(e) => e.stopPropagation()}
        />
        <Chip variant="status">{assessment.metadata?.tier || 'UNRATED'}</Chip>
        <span className="text-sm font-semibold text-(--color-text-primary) flex-1 truncate">
          {assessment.title || 'Untitled Assessment'}
        </span>
        <span className="text-xl font-(--font-display) text-(--color-text-primary)">
          {assessment.score || 0}
          <span className="text-xs text-(--color-text-muted) font-normal">/100</span>
        </span>
        <span className="text-xs text-(--color-text-muted)">
          {assessment.confidence_level || 0}% CONF.
        </span>
        {/* Icon actions */}
        <div className="flex items-center gap-1 ml-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(assessment.public_id);
            }}
            title="View"
            className="p-1.5 text-(--color-text-muted) hover:text-(--color-text-primary) rounded transition-colors"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRename(assessment.id);
            }}
            title="Rename"
            className="p-1.5 text-(--color-text-muted) hover:text-(--color-text-primary) rounded transition-colors"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(assessment.id);
            }}
            title="Delete"
            className="p-1.5 text-(--color-text-muted) hover:text-(--color-error) rounded transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Bottom row: industry + date + preview */}
      <div className="flex items-center gap-3 flex-wrap mb-2">
        <Chip variant="category">{assessment.industry}</Chip>
        <span className="text-xs text-(--color-text-muted)">{formattedDate}</span>
        <span className="text-xs text-(--color-text-muted) truncate max-w-xs">
          {assessment.problem || assessment.description}
        </span>
      </div>

      {/* Toggle row: Benchmarks + Public switches */}
      <div className="flex items-center gap-4 pt-2 border-t border-(--color-border)">
        <Switch
          size="sm"
          isSelected={assessment.contribute_to_benchmarks}
          onChange={onToggleBenchmarks}
        >
          <span className="text-xs text-(--color-text-muted)">Benchmarks</span>
        </Switch>
        <Switch size="sm" isSelected={assessment.is_public} onChange={onTogglePublic}>
          <span className="text-xs text-(--color-text-muted)">Public</span>
        </Switch>
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
export { AssessmentListItem };
