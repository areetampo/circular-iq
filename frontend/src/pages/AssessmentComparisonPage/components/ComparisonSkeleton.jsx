/**
 * @module ComparisonSkeleton
 * @description Full-page skeleton while two assessments load for comparison.
 */

import { Skeleton } from '@heroui/react';

import AssessmentColumnSkeleton from './AssessmentColumnSkeleton';

/**
 * Full-page skeleton while two assessments load for comparison.
 * @returns {import('react').ReactElement}
 */
export default function ComparisonSkeleton() {
  return (
    <div className="mt-6 w-full space-y-0">
      {/* Sticky header: A1 title + score | VS + delta | A2 title + score */}
      <div className="sticky top-0 z-9999 bg-(--color-bg) px-6 py-4">
        <Skeleton className="absolute inset-x-0 bottom-0 h-px w-full" />
        <Skeleton className="absolute inset-x-0 top-0 h-px w-full" />
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="pl-4">
            <div className="mb-1 flex items-center gap-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="size-6" />
            </div>
            <div className="flex items-baseline gap-1">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-8" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="pr-4 text-right">
            <div className="mb-1 ml-auto flex items-center justify-end gap-2">
              <Skeleton className="size-6" />
              <Skeleton className="h-8 w-64" />
            </div>
            <div className="flex items-baseline justify-end gap-1">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-2 mb-6 flex justify-between px-5">
        <div>
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>

      {/* Two columns side by side with AssessmentColumn structure */}
      <div
        className="mx-auto max-w-7xl px-6"
        style={{
          zoom: 0.95,
        }}
      >
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
          <div className="relative pr-6 lg:pr-8">
            <Skeleton className="absolute top-0 right-0 h-full w-px" />
            <AssessmentColumnSkeleton />
          </div>
          <div className="pl-6 lg:pl-8">
            <AssessmentColumnSkeleton />
          </div>
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="mt-8 flex items-center justify-between p-6">
        <Skeleton className="absolute inset-x-0 top-0 h-px w-full" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
  );
}

ComparisonSkeleton.propTypes = {};
