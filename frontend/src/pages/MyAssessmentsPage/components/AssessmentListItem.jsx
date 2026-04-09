import { Checkbox, Skeleton } from '@heroui/react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';

import { Button, Chip } from '@/components/common';
import { formatTimestamp } from '@/lib/formatting';
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

  return (
    <div
      className={cn(
        `group relative mb-2 block rounded-xl border-2 p-4 transition-all duration-200`,
        `bg-[rgba(245,240,232,0.45)] hover:bg-[rgba(245,240,232,0.6)]`,
        isSelected
          ? `border-[rgba(184,145,106,0.5)] bg-[rgba(245,240,232,0.55)] shadow-[0_0_0_2px_rgba(184,145,106,0.15)]`
          : `border-[rgba(180,160,130,0.22)] hover:border-[rgba(184,145,106,0.6)]`,
      )}
      onMouseEnter={() => onPrefetch(assessment.public_id)}
    >
      {/* Main content row */}
      <div className="flex items-start gap-3">
        {/* Title and metadata section */}
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 w-fit truncate font-sniglet text-xl/tight font-medium text-(--color-text-primary)">
            <Link to={assessmentLink}>{assessment.title || 'Untitled Assessment'}</Link>
          </h3>
          <p className="mb-2 text-[0.75rem] text-(--color-text-muted)">{formattedDate}</p>

          {/* Tags row */}
          <div className="flex flex-wrap items-center gap-2">
            {assessment.industry && (
              <Chip variant="factor" className="text-[0.625rem]">
                {assessment.industry}
              </Chip>
            )}
            <Chip variant="access-type" color={assessment.is_public ? 'public' : 'private'}>
              {assessment.is_public ? 'Public' : 'Private'}
            </Chip>
          </div>
        </div>

        {/* Score section */}
        <div className="min-w-20 shrink-0 text-right">
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

        {/* Action buttons */}
        <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity duration-300">
          {[
            {
              icon: Eye,
              onClick: (e) => {
                e.stopPropagation();
                onView(assessment.public_id);
              },
              label: 'View',
            },
            {
              icon: Pencil,
              onClick: (e) => {
                e.stopPropagation();
                onRename(assessment.id);
              },
              label: 'Rename',
            },
            {
              icon: Trash2,
              onClick: (e) => {
                e.stopPropagation();
                onDelete(assessment.id);
              },
              label: 'Delete',
            },
          ].map(({ icon: Icon, onClick, label }) => (
            <Button
              variant="ghastly"
              size="xs"
              key={label}
              onClick={onClick}
              label={label}
              as={label === 'View' ? Link : undefined}
              to={label === 'View' ? assessmentLink : undefined}
            >
              <Icon size={11} />
              <span>{label}</span>
            </Button>
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
          <Checkbox
            isSelected={isSelected}
            onChange={() => onToggleSelect(assessment.id)}
            className="text-[0.75rem] text-(--color-text-muted) transition-colors hover:text-(--color-text-primary)"
          >
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Content className="-ml-1.5">
              <span>Select to compare</span>
            </Checkbox.Content>
          </Checkbox>

          {/* Public/Private checkbox */}
          <Checkbox
            isSelected={assessment.is_public}
            onChange={() => onTogglePublic(assessment.id)}
            className="text-[0.75rem] text-(--color-text-muted) transition-colors hover:text-(--color-text-primary)"
          >
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Content className="-ml-1.5">
              <span>Public</span>
            </Checkbox.Content>
          </Checkbox>
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
    {Array(3)
      .fill(0)
      .map((_, i) => (
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
