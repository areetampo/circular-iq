import { Skeleton } from '@heroui/react';

export function ComparisonSkeleton() {
  return (
    <div className="mt-6 w-full space-y-0">
      {/* Sticky header: A1 title + score | VS + delta | A2 title + score */}
      <div className="sticky top-0 z-9999 border-y border-border bg-(--color-bg) px-6 py-4">
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div>
            <div className="mb-1 h-8 w-64 rounded-lg" />
            <div className="flex items-baseline gap-1">
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="h-4 w-8 rounded-sm" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="h-4 w-8 rounded-sm" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
          <div className="text-right">
            <div className="mb-1 ml-auto h-8 w-64 rounded-lg" />
            <div className="flex items-baseline justify-end gap-1">
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="h-4 w-8 rounded-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Two columns side by side with ResultsSkeleton */}
      <div
        className="mx-auto max-w-7xl px-6"
        style={{
          zoom: 0.95,
        }}
      >
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
          <div className="border-r-2 border-border pr-6 lg:pr-8">
            {/* ResultsSkeleton for Assessment 1 */}
            <div className="mx-auto max-w-5xl scale-95 transform">
              <div className="my-8 space-y-4 px-4 sm:px-6">
                {/* ResultsActionBar skeleton */}
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-32 rounded-md" />
                    <Skeleton className="h-8 w-28 rounded-md" />
                    <Skeleton className="h-8 w-24 rounded-md" />
                  </div>
                  <div className="ml-auto flex flex-wrap items-center gap-3">
                    <Skeleton className="h-8 w-16 rounded-md" />
                    <Skeleton className="h-8 w-16 rounded-md" />
                  </div>
                </div>
              </div>

              {/* Case Summary skeleton */}
              <div data-export-section="case-summary">
                <div className="p-1 sm:p-3">
                  <Skeleton className="mb-2 h-8 w-32 rounded-lg" />
                  {/* Accordions */}
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="mb-4">
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-5 rounded-full" />
                          <div>
                            <Skeleton className="mb-1 h-4 w-32 rounded-sm" />
                            <Skeleton className="h-3 w-48 rounded-sm" />
                          </div>
                        </div>
                        <Skeleton className="size-4 rounded-sm" />
                      </div>
                      <div className="border-b-2 border-(--color-border-ui)" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Results Content skeleton */}
              <div id="results-content" className="mx-auto max-w-7xl space-y-6 px-0 sm:px-6">
                <div className="mt-8">
                  <div className="mb-6 flex justify-center gap-4">
                    <Skeleton className="h-6 w-24 rounded-lg" />
                    <Skeleton className="h-6 w-32 rounded-lg" />
                  </div>
                  <div className="mb-8 text-center">
                    <Skeleton className="mx-auto mb-3 h-16 w-32 rounded-lg" />
                    <Skeleton className="mx-auto mb-2 h-8 w-16 rounded-sm" />
                  </div>
                </div>

                {/* Component skeletons */}
                <div className="mt-8 pt-8">
                  <Skeleton className="h-32 w-full rounded-lg" />
                </div>
                <div className="mt-8 pt-8">
                  <Skeleton className="h-24 w-full rounded-lg" />
                </div>
                <div className="mt-8 pt-8">
                  <Skeleton className="h-28 w-full rounded-lg" />
                </div>
                <div className="mt-8 pt-8">
                  <Skeleton className="h-32 w-full rounded-lg" />
                </div>
                <div className="mt-8 pt-8">
                  <Skeleton className="h-40 w-full rounded-lg" />
                </div>
                <div className="mt-8 pt-8">
                  <Skeleton className="h-36 w-full rounded-lg" />
                </div>
                <div className="p-1 sm:p-3">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="p-4">
                        <Skeleton className="mb-2 h-3 w-16 rounded-sm" />
                        <Skeleton className="mb-1 h-4 w-20 rounded-sm" />
                        <Skeleton className="h-3 w-24 rounded-sm" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="pl-6 lg:pl-8">
            {/* ResultsSkeleton for Assessment 2 */}
            <div className="mx-auto max-w-5xl scale-95 transform">
              <div className="my-8 space-y-4 px-4 sm:px-6">
                {/* ResultsActionBar skeleton */}
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-32 rounded-md" />
                    <Skeleton className="h-8 w-28 rounded-md" />
                    <Skeleton className="h-8 w-24 rounded-md" />
                  </div>
                  <div className="ml-auto flex flex-wrap items-center gap-3">
                    <Skeleton className="h-8 w-16 rounded-md" />
                    <Skeleton className="h-8 w-16 rounded-md" />
                  </div>
                </div>
              </div>

              {/* Case Summary skeleton */}
              <div data-export-section="case-summary">
                <div className="p-1 sm:p-3">
                  <Skeleton className="mb-2 h-8 w-32 rounded-lg" />
                  {/* Accordions */}
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="mb-4">
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-5 rounded-full" />
                          <div>
                            <Skeleton className="mb-1 h-4 w-32 rounded-sm" />
                            <Skeleton className="h-3 w-48 rounded-sm" />
                          </div>
                        </div>
                        <Skeleton className="size-4 rounded-sm" />
                      </div>
                      <div className="border-b-2 border-(--color-border-ui)" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Results Content skeleton */}
              <div id="results-content" className="mx-auto max-w-7xl space-y-6 px-0 sm:px-6">
                <div className="mt-8">
                  <div className="mb-6 flex justify-center gap-4">
                    <Skeleton className="h-6 w-24 rounded-lg" />
                    <Skeleton className="h-6 w-32 rounded-lg" />
                  </div>
                  <div className="mb-8 text-center">
                    <Skeleton className="mx-auto mb-3 h-16 w-32 rounded-lg" />
                    <Skeleton className="mx-auto mb-2 h-8 w-16 rounded-sm" />
                  </div>
                </div>

                {/* Component skeletons */}
                <div className="mt-8 pt-8">
                  <Skeleton className="h-32 w-full rounded-lg" />
                </div>
                <div className="mt-8 pt-8">
                  <Skeleton className="h-24 w-full rounded-lg" />
                </div>
                <div className="mt-8 pt-8">
                  <Skeleton className="h-28 w-full rounded-lg" />
                </div>
                <div className="mt-8 pt-8">
                  <Skeleton className="h-32 w-full rounded-lg" />
                </div>
                <div className="mt-8 pt-8">
                  <Skeleton className="h-40 w-full rounded-lg" />
                </div>
                <div className="mt-8 pt-8">
                  <Skeleton className="h-36 w-full rounded-lg" />
                </div>
                <div className="p-1 sm:p-3">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="p-4">
                        <Skeleton className="mb-2 h-3 w-16 rounded-sm" />
                        <Skeleton className="mb-1 h-4 w-20 rounded-sm" />
                        <Skeleton className="h-3 w-24 rounded-sm" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="mt-8 flex items-center justify-between border-t-2 border-border p-6">
        <Skeleton className="h-4 w-48 rounded-sm" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
      </div>
    </div>
  );
}

ComparisonSkeleton.propTypes = {};
export default ComparisonSkeleton;
