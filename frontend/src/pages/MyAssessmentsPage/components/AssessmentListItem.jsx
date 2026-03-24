import { Checkbox, Chip, Skeleton, toast } from '@heroui/react';
import { AlertCircle, Building, CheckCircle2, Clock, Copy, Edit, Eye, Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

import { Button } from '@/components/common';
import ChoiceCardSwitch from '@/components/common/ChoiceCardSwitch';
import CopyButton from '@/components/modern-ui/copy-button';
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
  const getStatus = (score) => {
    if (score >= 80)
      return {
        text: 'Excellent',
        color: 'success',
        icon: CheckCircle2,
      };
    if (score >= 60)
      return {
        text: 'Good',
        color: 'accent',
        icon: CheckCircle2,
      };
    if (score >= 40)
      return {
        text: 'Needs Work',
        color: 'warning',
        icon: Clock,
      };
    return {
      text: 'Critical',
      color: 'danger',
      icon: AlertCircle,
    };
  };

  const assessmentCardButtons = [
    {
      label: 'View',
      icon: Eye,
      variant: 'teal',
      onClick: () => onView(assessment.public_id),
      className: '',
    },
    {
      label: 'Rename',
      icon: Edit,
      variant: 'info',
      onClick: () => onRename(assessment.id),
      className: '',
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'danger',
      onClick: () => onDelete(assessment.id),
      className: '',
    },
  ];

  const status = getStatus(assessment.overall_score);
  const StatusIcon = status.icon;

  return (
    <div
      className={cn(
        'group relative overflow-hidden transition-all duration-200 ease-out cursor-pointer rounded-xl',
        isSelected ? 'shadow-lg' : 'hover:shadow-lg',
      )}
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
        borderWidth: '1px',
      }}
      onMouseEnter={() => onPrefetch(assessment.public_id)}
      onClick={() => onView(assessment.public_id)}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom right, var(--accent-soft), transparent, var(--accent-soft))',
        }}
      />

      <div className="relative p-0 xxs:p-3 space-y-5">
        <div className="flex items-start gap-4">
          <div className="pt-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              isSelected={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelect(assessment.id);
              }}
              size="lg"
              color="primary"
              className="cursor-pointer"
              aria-label={`Select assessment: ${assessment.title || 'Untitled Assessment'}`}
            >
              <Checkbox.Control
                className="size-6 rounded-full before:rounded-full border"
                style={{ borderColor: 'var(--border)' }}
              >
                <Checkbox.Indicator style={{ backgroundColor: 'var(--accent)' }} />
              </Checkbox.Control>
            </Checkbox>
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <h3
              className="font-semibold text-xl leading-tight truncate transition-colors duration-200 ml-0.5"
              style={{
                color: 'var(--foreground)',
                fontFamily: 'Lora, Georgia, serif',
              }}
              title={assessment.title}
            >
              {assessment.title || 'Untitled Assessment'}
            </h3>

            <div className="flex flex-wrap items-center gap-2.5">
              <Chip variant="secondary" color="default" size="lg">
                <Building size={14} />
                <Chip.Label className="uppercase">
                  {(assessment.industry || 'General').replace(/_/g, ' ')}
                </Chip.Label>
              </Chip>

              <Chip
                variant="primary"
                color={
                  assessment.overall_score >= 80
                    ? 'success'
                    : assessment.overall_score >= 60
                      ? 'accent'
                      : assessment.overall_score >= 40
                        ? 'warning'
                        : 'danger'
                }
                size="lg"
              >
                <Chip.Label className="text-white">{assessment.overall_score}%</Chip.Label>
              </Chip>

              <Chip variant="soft" color={status.color} size="lg">
                <StatusIcon size={14} />
                <Chip.Label>{status.text}</Chip.Label>
              </Chip>

              <div className="flex items-center gap-1.5 text-sm ml-1">
                <Clock size={14} />
                <span className="italic" style={{ color: 'var(--muted)' }}>
                  Created {formatTimestamp(assessment.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:py-2 px-4" onClick={(e) => e.stopPropagation()}>
          {assessmentCardButtons.map((btn) => {
            const Icon = btn.icon;
            return (
              <Button
                key={btn.label}
                size="md"
                variant={btn.variant}
                onPress={(e) => {
                  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                  btn.onClick();
                }}
                onClick={(e) => e.stopPropagation()}
                className={cn('flex-1 sm:flex-none', btn.className)}
              >
                <Icon size={16} />
                <span className="font-medium hidden xxs:inline">{btn.label}</span>
              </Button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4">
          <ChoiceCardSwitch
            isSelected={assessment.contribute_to_global_benchmarks || false}
            onChange={(e) => {
              if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
              onToggleBenchmarks(assessment.id);
            }}
            onClick={(e) => e.stopPropagation()}
            size="md"
            variant="blue"
            title="Global Benchmarks"
            description="Share anonymously"
          />

          <ChoiceCardSwitch
            isSelected={assessment.is_public || false}
            onChange={(e) => {
              if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
              onTogglePublic(assessment.id);
            }}
            onClick={(e) => e.stopPropagation()}
            size="md"
            variant="emerald"
            title="Public Access"
            description="Share via link"
            trailing={
              <CopyButton
                value={
                  assessment.public_id
                    ? `${window.location.origin}/assessments/share/${assessment.public_id}`
                    : ''
                }
                disabled={!assessment.is_public || !assessment.public_id}
              />
            }
          />
        </div>

        {assessment.public_id && (
          <div className="px-4 pt-2">
            <Button
              size="sm"
              variant="neutral"
              className="w-full"
              onPress={(e) => {
                if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                navigator.clipboard.writeText(assessment.public_id).catch(() => {});
                toast.success('Assessment ID copied to clipboard');
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Copy size={16} />
              Copy Assessment ID
            </Button>
          </div>
        )}
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
