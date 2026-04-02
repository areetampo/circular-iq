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
        'border rounded-xl p-4 mb-2.5 transition-colors bg-[rgba(245,240,232,0.5)]',
        isSelected
          ? 'border-[rgba(184,145,106,0.4)] bg-[rgba(245,240,232,0.7)]'
          : 'border-[rgba(180,160,130,0.22)] hover:border-[rgba(184,145,106,0.4)] hover:bg-[rgba(245,240,232,0.6)]',
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
      {/* Top row: checkbox + title + date + score/UNRATED + confidence + icons */}
      <div className="flex items-center gap-3 mb-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-4 h-4 accent-(--color-accent) shrink-0"
          title="Select for comparison"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1">
          <span className="text-[15px] font-semibold text-(--color-text-primary)">
            {assessment.title || 'Untitled Assessment'}
          </span>
          <div className="text-[12px] text-(--color-text-muted) mt-0.5">{formattedDate}</div>
        </div>
        <div className="flex items-center gap-2">
          {assessment.score ? (
            <span className="font-(--font-mono) text-lg text-(--color-text-primary)">
              {assessment.score}
            </span>
          ) : (
            <Chip variant="status">UNRATED</Chip>
          )}
          <span className="text-[12px] text-(--color-text-muted)">
            {assessment.confidence_level || 0}% CONF.
          </span>
        </div>
        {/* Icon actions */}
        <div className="flex items-center gap-2 ml-2">
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

      {/* Middle row: industry tag */}
      <div className="flex items-center gap-3 mb-3">
        <Chip variant="tag">{assessment.industry}</Chip>
      </div>

      {/* Bottom row: Public and Benchmarks switches */}
      <div className="flex items-center gap-6 pt-3 border-t border-[rgba(180,160,130,0.18)]">
        <Switch
          variant="benchmark"
          size="sm"
          isSelected={assessment.contribute_to_benchmarks}
          onChange={() => onToggleBenchmarks(assessment.id)}
        >
          <Switch.Label>Benchmarks</Switch.Label>
        </Switch>
        <Switch
          variant="public"
          size="sm"
          isSelected={assessment.is_public}
          onChange={() => onTogglePublic(assessment.id)}
        >
          <Switch.Label>Public</Switch.Label>
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
  <div className="border border-[rgba(180,160,130,0.22)] rounded-xl bg-[rgba(245,240,232,0.5)] transition-all duration-200 mb-2.5 h-[78px]">
    <div className="p-4">
      {/* Top row skeleton */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-4 h-4 rounded bg-[rgba(180,160,130,0.2)] animate-pulse" />
        <div className="flex-1">
          <div className="h-5 w-32 rounded-md bg-[rgba(180,160,130,0.15)] animate-pulse mb-1" />
          <div className="h-3 w-16 rounded-md bg-[rgba(180,160,130,0.15)] animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-8 rounded-md bg-[rgba(180,160,130,0.15)] animate-pulse font-(--font-mono)" />
          <div className="h-3 w-12 rounded-md bg-[rgba(180,160,130,0.15)] animate-pulse" />
        </div>
        <div className="flex items-center gap-2 ml-2">
          <div className="w-6 h-6 rounded-md bg-[rgba(180,160,130,0.15)] animate-pulse" />
          <div className="w-6 h-6 rounded-md bg-[rgba(180,160,130,0.15)] animate-pulse" />
          <div className="w-6 h-6 rounded-md bg-[rgba(180,160,130,0.15)] animate-pulse" />
        </div>
      </div>

      {/* Middle row skeleton */}
      <div className="flex items-center gap-3 mb-3">
        <div className="h-5 w-20 rounded-md bg-[rgba(180,160,130,0.1)] animate-pulse" />
      </div>

      {/* Bottom row skeleton */}
      <div className="flex items-center gap-6 pt-3 border-t border-[rgba(180,160,130,0.18)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-4 rounded-full bg-[rgba(180,160,130,0.2)] animate-pulse" />
          <div className="h-3 w-16 rounded-md bg-[rgba(180,160,130,0.15)] animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-4 rounded-full bg-[rgba(180,160,130,0.2)] animate-pulse" />
          <div className="h-3 w-12 rounded-md bg-[rgba(180,160,130,0.15)] animate-pulse" />
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
