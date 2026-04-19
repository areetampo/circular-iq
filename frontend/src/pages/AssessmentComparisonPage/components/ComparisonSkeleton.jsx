import { Skeleton } from '@heroui/react';

export function ComparisonSkeleton() {
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

      {/* Export buttons */}
      <div className="mt-2 mb-6 flex justify-end gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
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

            {/* AssessmentColumn skeleton */}
            <div className="space-y-6">
              <div id="results-content" className="space-y-6">
                {/* ResultsActionBar */}
                <div className="py-4">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-32" />
                      <Skeleton className="h-8 w-48" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>

                  <div className="flex w-full items-center justify-center">
                    <Skeleton className="mt-6 mb-8 h-px w-2/3" />
                  </div>

                  {/* Case Summary Accordions */}
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="border border-(--color-border-ui) p-4">
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
          </div>

          <div className="pl-6 lg:pl-8">
            {/* Second AssessmentColumn skeleton - mirror of first */}
            <div className="space-y-6">
              <div id="results-content" className="space-y-6">
                {/* ResultsActionBar */}
                <div className="py-4">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-32" />
                      <Skeleton className="h-8 w-48" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>

                  <div className="flex w-full items-center justify-center">
                    <Skeleton className="mt-6 mb-8 h-px w-2/3" />
                  </div>

                  {/* Case Summary Accordions */}
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="border border-(--color-border-ui) p-4">
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
export default ComparisonSkeleton;
