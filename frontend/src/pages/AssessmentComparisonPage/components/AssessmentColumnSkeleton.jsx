/**
 * @module AssessmentColumnSkeleton
 * @description Loading skeleton for a single comparison column while data fetches.
 */

import { Skeleton } from '@heroui/react';

/**
 * Loading skeleton for a single comparison column while data fetches.
 * @returns {import('react').ReactElement}
 */
export default function AssessmentColumnSkeleton() {
  return (
    <div className="space-y-6">
      <div id="results-content" className="space-y-6">
        {/* ResultsActionBar */}
        <div className="py-4">
          <div className="mb-2 flex flex-col justify-center gap-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
            <div className="flex origin-top-right scale-75 items-center justify-end">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>

          <div className="flex w-full items-center justify-center">
            <Skeleton className="mt-6 mb-8 h-px w-2/3" />
          </div>

          {/* Case Summary Accordions */}
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-5 rounded-full!" />
                    <div>
                      <Skeleton className="mb-1 h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="size-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Score Overview Section */}
        <div className="space-y-4">
          <div className="text-center">
            <Skeleton className="mx-auto mb-3 h-16 w-32" />
            <Skeleton className="mx-auto mb-2 h-8 w-16" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
        <Skeleton className="my-8 h-px w-full" />

        {/* Circular Economy Tier Card */}
        <Skeleton className="h-24 w-full" />
        <Skeleton className="my-8 h-px w-full" />

        {/* Weighted Score Card */}
        <Skeleton className="h-32 w-full" />
        <Skeleton className="my-8 h-px w-full" />

        {/* Parameter Consistency Card */}
        <Skeleton className="h-28 w-full" />
        <Skeleton className="my-8 h-px w-full" />

        {/* R Strategy Alignment Card */}
        <Skeleton className="h-24 w-full" />
        <Skeleton className="my-8 h-px w-full" />

        {/* Score Category Breakdown */}
        <Skeleton className="h-36 w-full" />
        <Skeleton className="my-8 h-px w-full" />

        {/* Gap Analysis Card */}
        <Skeleton className="h-32 w-full" />
        <Skeleton className="my-8 h-px w-full" />

        {/* Industry Metadata Section */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
        <Skeleton className="my-8 h-px w-full" />

        {/* Category Analysis */}
        <Skeleton className="h-40 w-full" />
        <Skeleton className="my-8 h-px w-full" />

        {/* Performance Comparison (Radar Chart) */}
        <Skeleton className="h-48 w-full" />
        <Skeleton className="my-8 h-px w-full" />

        {/* Integrity Analysis */}
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="my-8 h-px w-full" />

        {/* Audit Summary Card */}
        <Skeleton className="h-28 w-full" />
        <Skeleton className="my-8 h-px w-full" />

        {/* Database Evidence Card */}
        <Skeleton className="h-36 w-full" />
        <Skeleton className="my-8 h-px w-full" />

        {/* Strategic Synthesis Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 rounded-full!" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    </div>
  );
}
