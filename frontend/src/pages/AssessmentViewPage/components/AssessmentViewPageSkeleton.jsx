/**
 * AssessmentViewPageSkeleton Component
 * Skeleton for AssessmentViewPage (/assessments/share?id=)
 * Accurately matches the actual component structure and layout
 */
import { Separator, Skeleton } from '@heroui/react';

export default function AssessmentViewPageSkeleton() {
  return (
    <div className="w-full space-y-0">
      {/* Simple header - title only */}
      <div className="mt-8 mb-3 px-4 sm:px-6">
        <div className="text-center">
          <Skeleton className="mx-auto h-10 w-80 rounded-lg" />
        </div>
      </div>

      {/* Single assessment column using the same structure as AssessmentColumn */}
      <div className="mx-auto max-w-4xl px-6">
        <div className="space-y-6">
          <div id="results-content" className="space-y-6">
            {/* ResultsActionBar skeleton */}
            <div className="mb-3 flex flex-col justify-center gap-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Left group - Re-evaluate only for share page */}
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-28 rounded-md" /> {/* Re-evaluate */}
                </div>

                {/* Right group - export buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <Skeleton className="h-8 w-16 rounded-md" /> {/* PDF */}
                  <Skeleton className="h-8 w-16 rounded-md" /> {/* CSV */}
                </div>
              </div>

              {/* Copy buttons for public share */}
              <div className="flex origin-top-right scale-75 items-center justify-end">
                <Skeleton className="h-4 w-12 rounded-sm" /> {/* ID */}
                <Skeleton className="h-4 w-16 rounded-sm" /> {/* URL */}
              </div>
            </div>

            {/* Separator */}
            <div className="flex w-full items-center justify-center">
              <Skeleton className="mt-6 mb-8 h-px w-2/3" />
            </div>

            {/* Case Summary Accordions */}
            <div>
              {/* Section heading */}
              <div className="mb-2">
                <Skeleton className="h-8 w-45 rounded-lg" />
              </div>

              {/* Accordion items - matching HeroUI Accordion structure */}
              <div className="w-full">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-full">
                    <div className="flex w-full items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-5 rounded-full" />
                        <div>
                          <Skeleton className="mb-1 h-4 w-32 rounded-sm" />
                          <Skeleton className="h-3 w-48 rounded-sm" />
                        </div>
                      </div>
                      <Skeleton className="size-4 rounded-sm" />
                    </div>
                    <Separator variant="secondary" />
                  </div>
                ))}
              </div>
            </div>

            {/* Score Overview Section */}
            <div className="mt-8">
              {/* Industry and Confidence Row */}
              <div className="mb-6 flex justify-center gap-4">
                <Skeleton className="h-6 w-24 rounded-lg" />
                <Skeleton className="h-6 w-32 rounded-lg" />
                <Skeleton className="h-6 w-28 rounded-lg" />
              </div>

              {/* Main Score Display */}
              <div className="mb-8 text-center">
                <Skeleton className="mx-auto mb-3 h-20 w-32 rounded-lg" />
                <Skeleton className="mx-auto mb-2 h-8 w-16 rounded-sm" />
                <Skeleton className="mx-auto h-4 w-40 rounded-sm" />
              </div>

              {/* Score Summary Stats */}
              <div className="mb-8 flex justify-center">
                <Skeleton className="h-4 w-64 rounded-sm" />
              </div>

              {/* Strongest Factor and Focus Area */}
              <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
            </div>

            <Skeleton className="my-8 h-px w-full" />

            {/* Circular Economy Tier Card */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 rounded-sm" />
                <Skeleton className="h-6 w-48 rounded-lg" />
              </div>
              <Skeleton className="mb-1 h-8 w-32 rounded-lg" />
              <Skeleton className="mb-3 h-4 w-56 rounded-sm" />
              <Skeleton className="mb-4 h-4 w-full rounded-sm" />
              <Skeleton className="my-3 h-4 w-3/4 rounded-sm" />
            </div>
            <Skeleton className="my-8 h-px w-full" />

            {/* Weighted Score Card */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 rounded-sm" />
                <Skeleton className="h-6 w-56 rounded-lg" />
              </div>
              <Skeleton className="mb-6 h-4 w-full rounded-sm" />
              {/* Factor rows */}
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 border-b border-border py-2">
                    <Skeleton className="h-6 w-20 rounded-md" />
                    <Skeleton className="h-1.5 flex-1 rounded-full" />
                    <Skeleton className="h-4 w-8 rounded-sm" />
                    <Skeleton className="h-4 w-10 rounded-sm" />
                    <Skeleton className="h-6 w-16 rounded-md" />
                  </div>
                ))}
              </div>
              <Skeleton className="mt-6 h-4 w-full rounded-sm" />
            </div>
            <Skeleton className="my-8 h-px w-full" />

            {/* Parameter Consistency Card */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 rounded-sm" />
                <Skeleton className="h-6 w-48 rounded-lg" />
              </div>
              <Skeleton className="mb-6 h-4 w-full rounded-sm" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
            <Skeleton className="my-8 h-px w-full" />

            {/* R Strategy Alignment Card */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 rounded-sm" />
                <Skeleton className="h-6 w-40 rounded-lg" />
              </div>
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
            <Skeleton className="my-8 h-px w-full" />

            {/* Score Category Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 rounded-sm" />
                <Skeleton className="h-6 w-48 rounded-lg" />
              </div>
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
            <Skeleton className="my-8 h-px w-full" />

            {/* Gap Analysis Card */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 rounded-sm" />
                <Skeleton className="h-6 w-32 rounded-lg" />
              </div>
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
            <Skeleton className="my-8 h-px w-full" />

            {/* Industry Metadata Section */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            </div>
            <Skeleton className="my-8 h-px w-full" />

            {/* Category Analysis */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 rounded-sm" />
                <Skeleton className="h-6 w-40 rounded-lg" />
              </div>
              <Skeleton className="h-36 w-full rounded-lg" />
            </div>
            <Skeleton className="my-8 h-px w-full" />

            {/* Performance Comparison (Radar Chart) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 rounded-sm" />
                <Skeleton className="h-6 w-48 rounded-lg" />
              </div>
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
            <Skeleton className="my-8 h-px w-full" />

            {/* Integrity Analysis */}
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
            <Skeleton className="my-8 h-px w-full" />

            {/* Audit Summary Card */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 rounded-sm" />
                <Skeleton className="h-6 w-32 rounded-lg" />
              </div>
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
            <Skeleton className="my-8 h-px w-full" />

            {/* Database Evidence Card */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 rounded-sm" />
                <Skeleton className="h-6 w-48 rounded-lg" />
              </div>
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
            <Skeleton className="my-8 h-px w-full" />

            {/* Strategic Synthesis Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 rounded-sm" />
                <Skeleton className="h-6 w-48 rounded-lg" />
              </div>
              <Skeleton className="h-28 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Simple footer */}
      <div className="mt-8 flex items-center justify-center gap-3 p-6">
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>
    </div>
  );
}
