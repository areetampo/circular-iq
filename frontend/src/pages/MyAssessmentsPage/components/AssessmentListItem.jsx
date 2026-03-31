import { Skeleton, Tooltip } from '@heroui/react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

import CopyButton from '@/components/modern-ui/copy-button';
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
      className="border rounded-xl px-5 py-4 cursor-pointer
                flex flex-col sm:flex-row sm:items-center gap-3"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
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
      {/* LEFT: text info */}
      <div className="flex-1 min-w-0">
        {/* Row 1: tier chip + title */}
        <div className="flex items-center gap-2 mb-1">
          {/* CE tier chip */}
          <span
            className="text-xs font-bold uppercase tracking-widest
                           px-2 py-0.5 rounded"
            style={{
              backgroundColor: 'var(--accent-soft)',
              color: 'var(--accent-soft-fg)',
            }}
          >
            {assessment.metadata?.tier || 'UNRATED'}
          </span>
          {/* Title */}
          <span className="text-base font-medium truncate" style={{ color: 'var(--foreground)' }}>
            {assessment.title}
          </span>
        </div>

        {/* Row 2: industry · date · description preview */}
        <div className="flex items-center gap-2 flex-wrap">
          {assessment.industry && (
            <span
              className="text-sm px-2 py-0.5 rounded border"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--muted)',
              }}
            >
              {assessment.industry}
            </span>
          )}
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {formattedDate}
          </span>
          {assessment.business_problem && (
            <span
              className="text-xs truncate max-w-50 hidden sm:block"
              style={{ color: 'var(--subtle)' }}
            >
              {assessment.business_problem.slice(0, 80)}…
            </span>
          )}
        </div>

        {/* Row 3: Toggles row — always visible, compact */}
        <div
          className="flex items-center gap-3 mt-2 flex-wrap"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Multi-select checkbox */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelect(assessment.id);
              }}
              className="w-3.5 h-3.5 rounded accent-accent"
            />
            <span className="text-sm" style={{ color: 'var(--muted)' }}>
              Compare
            </span>
          </label>

          {/* Benchmark toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={assessment.contribute_to_global_benchmarks || false}
              onChange={(e) => {
                e.stopPropagation();
                onToggleBenchmarks(assessment.id);
              }}
              className="w-3.5 h-3.5 rounded accent-accent"
            />
            <span className="text-sm" style={{ color: 'var(--muted)' }}>
              Benchmarks
            </span>
          </label>

          {/* Public toggle + copy */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={assessment.is_public || false}
              onChange={(e) => {
                e.stopPropagation();
                onTogglePublic(assessment.id);
              }}
              className="w-3.5 h-3.5 rounded accent-accent"
            />
            <span className="text-sm" style={{ color: 'var(--muted)' }}>
              Public
            </span>
          </label>

          {assessment.is_public && assessment.public_id && (
            <CopyButton value={`${assessment.public_id}`} />
          )}
        </div>
      </div>

      {/* RIGHT: metrics + actions */}
      <div className="flex items-center gap-5 shrink-0">
        {/* Score */}
        <div className="text-right">
          <span
            className="font-mono text-2xl font-semibold leading-none"
            style={{
              color:
                assessment.overall_score >= 75
                  ? 'var(--success)'
                  : assessment.overall_score >= 50
                    ? 'var(--warning)'
                    : 'var(--danger)',
            }}
          >
            {assessment.overall_score ?? '—'}
          </span>
          <span className="text-xs ml-0.5" style={{ color: 'var(--muted)' }}>
            /100
          </span>
        </div>

        {/* Confidence (if available) */}
        {assessment.confidence_level != null && (
          <div className="text-right hidden md:block">
            <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
              {assessment.confidence_level}%
            </p>
            <p className="label-overline">CONF.</p>
          </div>
        )}

        {/* Actions menu */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Tooltip delay={300} placement="top">
            <Tooltip.Trigger>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-accent-soft"
                style={{ color: 'var(--muted)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onView(assessment.public_id);
                }}
                aria-label="View assessment"
              >
                <Eye size={16} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p className="text-xs">View</p>
            </Tooltip.Content>
          </Tooltip>

          <Tooltip delay={300} placement="top">
            <Tooltip.Trigger>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-accent-soft"
                style={{ color: 'var(--muted)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onRename(assessment.id);
                }}
                aria-label="Rename assessment"
              >
                <Pencil size={15} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p className="text-xs">Rename</p>
            </Tooltip.Content>
          </Tooltip>

          <Tooltip delay={300} placement="top">
            <Tooltip.Trigger>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-danger-soft"
                style={{ color: 'var(--danger)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(assessment.id);
                }}
                aria-label="Delete assessment"
              >
                <Trash2 size={15} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p className="text-xs">Delete</p>
            </Tooltip.Content>
          </Tooltip>
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

const AssessmentCardSkeleton = React.memo(function AssessmentCardSkeleton() {
  return (
    <div
      className="group relative overflow-hidden rounded-xl"
      style={{ backgroundColor: 'var(--surface)' }}
    >
      <div className="relative p-3 space-y-5">
        <div className="flex items-start gap-4">
          <div className="pt-0.5 shrink-0">
            <Skeleton animationType="shimmer" className="w-6 h-6 rounded-full" />
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <Skeleton animationType="shimmer" className="h-6 w-3/4 rounded ml-0.5" />

            <div className="flex flex-wrap items-center gap-2.5">
              <Skeleton animationType="shimmer" className="h-7 w-24 rounded-full" />
              <Skeleton animationType="shimmer" className="h-7 w-16 rounded-full" />
              <Skeleton animationType="shimmer" className="h-7 w-28 rounded-full" />
              <Skeleton animationType="shimmer" className="h-4 w-32 rounded ml-1" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:py-2 px-4">
          <Skeleton
            animationType="shimmer"
            className="h-9 w-24 rounded-lg flex-1 sm:flex-none min-w-25"
          />
          <Skeleton
            animationType="shimmer"
            className="h-9 w-24 rounded-lg flex-1 sm:flex-none min-w-25"
          />
          <Skeleton
            animationType="shimmer"
            className="h-9 w-24 rounded-lg flex-1 sm:flex-none min-w-25"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4">
          <div
            className="flex items-center justify-between gap-3 p-2 xxs:p-4 rounded-xl border flex-col xxs:flex-row"
            style={{ backgroundColor: 'var(--accent-soft)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Skeleton animationType="shimmer" className="w-8 h-8 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0 space-y-1">
                <Skeleton animationType="shimmer" className="h-3.5 w-32 rounded" />
                <Skeleton animationType="shimmer" className="h-3 w-24 rounded" />
              </div>
            </div>
            <Skeleton animationType="shimmer" className="w-11 h-6 rounded-full shrink-0" />
          </div>

          <div
            className="flex items-center justify-between gap-3 p-2 xxs:p-4 rounded-xl border flex-col xxs:flex-row"
            style={{ backgroundColor: 'var(--accent-soft)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Skeleton animationType="shimmer" className="w-8 h-8 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0 space-y-1">
                <Skeleton animationType="shimmer" className="h-3.5 w-28 rounded" />
                <Skeleton animationType="shimmer" className="h-3 w-20 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Skeleton animationType="shimmer" className="w-11 h-6 rounded-full" />
              <Skeleton animationType="shimmer" className="w-8 h-8 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const AssessmentList = React.memo(function AssessmentList({
  assessments,
  selectedIds,
  onToggleSelect,
  onView,
  onRename,
  onDelete,
  onPrefetch,
  onTogglePublic,
  onToggleBenchmarks,
}) {
  return (
    <>
      {assessments.map((assessment) => {
        return (
          <AssessmentListItem
            key={assessment.id}
            assessment={assessment}
            isSelected={selectedIds.has(assessment.id)}
            onToggleSelect={onToggleSelect}
            onView={onView}
            onRename={onRename}
            onDelete={onDelete}
            onPrefetch={onPrefetch}
            onTogglePublic={onTogglePublic}
            onToggleBenchmarks={onToggleBenchmarks}
          />
        );
      })}
    </>
  );
});

AssessmentList.propTypes = {
  assessments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string,
      industry: PropTypes.string,
      overall_score: PropTypes.number,
      created_at: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.instanceOf(Date),
      ]),
    }),
  ).isRequired,
  selectedIds: PropTypes.instanceOf(Set).isRequired,
  onToggleSelect: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  onRename: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onPrefetch: PropTypes.func.isRequired,
  onTogglePublic: PropTypes.func.isRequired,
  onToggleBenchmarks: PropTypes.func.isRequired,
};

const AssessmentListSkeleton = React.memo(function AssessmentListSkeleton() {
  return Array.from({ length: 5 }).map((_, idx) => <AssessmentCardSkeleton key={idx} />);
});

export { AssessmentCardSkeleton, AssessmentList, AssessmentListItem, AssessmentListSkeleton };
export default AssessmentListItem;
