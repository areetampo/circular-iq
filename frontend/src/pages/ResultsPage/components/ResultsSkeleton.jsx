/**
 * ResultsSkeleton Component
 * Redesigned to match the actual ResultsPage layout structure with shimmer animations
 */
import { Skeleton } from '@heroui/react';

export default function ResultsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-0 sm:px-6">
      {/* Action Buttons & Share Section */}
      <div className="mt-4 mb-8 space-y-4 px-4 sm:px-6">
        {/* Title placeholder for saved assessments */}
        <div className="mb-4">
          <Skeleton className="h-8 w-64 rounded-lg" />
        </div>

        {/* Buttons Bar */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-32 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>

        {/* Share Assessment Section */}
        <div className="mb-3 border-t border-[rgba(180,160,130,0.18)] pt-4">
          <div className="flex items-center justify-start gap-4">
            <Skeleton className="h-5 w-40 rounded-sm" />
            <Skeleton className="size-6 rounded-full" />
          </div>
          <div className="mt-3 flex flex-col gap-3 pt-3 sm:flex-row">
            <Skeleton className="h-10 w-full rounded-sm" />
            <Skeleton className="h-10 w-20 rounded-sm" />
          </div>
        </div>
      </div>

      {/* Case Summary Accordion */}
      <div className="mb-6 border-b border-[rgba(180,160,130,0.18)] pb-4">
        <div className="p-1 sm:p-3">
          <Skeleton className="mb-4 h-8 w-32 rounded-lg" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-lg border border-[rgba(180,160,130,0.18)] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-5 rounded-sm" />
                    <div>
                      <Skeleton className="mb-1 h-4 w-24 rounded-sm" />
                      <Skeleton className="h-3 w-40 rounded-sm" />
                    </div>
                  </div>
                  <Skeleton className="size-4 rounded-sm" />
                </div>
                <Skeleton className="mt-3 h-4 w-full rounded-sm" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Score Overview Section */}
      <div className="mt-8">
        {/* Industry and Confidence Row */}
        <div className="mb-6 flex justify-center gap-4">
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>

        {/* Main Score Display */}
        <div className="mb-8 text-center">
          <Skeleton className="mx-auto mb-3 h-18 w-32 rounded-sm" />
          <Skeleton className="mx-auto mb-2 h-8 w-16 rounded-sm" />
          <Skeleton className="mx-auto h-4 w-40 rounded-sm" />
          <Skeleton className="mx-auto mt-6 h-6 w-96 rounded-sm" />
        </div>

        {/* Score Summary Stats */}
        <div className="mb-8 flex justify-center gap-6">
          <Skeleton className="h-4 w-64 rounded-sm" />
        </div>

        {/* Strongest Factor and Focus Area */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </div>

      {/* Cards Section */}
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-36 w-full rounded-lg" />

      {/* Industry & Metadata Section */}
      <div className="rounded-lg border p-1 sm:p-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-lg border p-4">
              <Skeleton className="mb-2 h-3 w-16 rounded-sm" />
              <Skeleton className="mb-1 h-4 w-20 rounded-sm" />
              <Skeleton className="h-3 w-24 rounded-sm" />
            </div>
          ))}
        </div>
      </div>

      {/* Category Analysis */}
      <div className="rounded-3xl border-2 border-(--color-border-ui) bg-transparent p-1 sm:p-3">
        <Skeleton className="mb-4 h-8 w-40 rounded-lg" />
        <Skeleton className="-mt-4 mb-4 h-4 w-64 rounded-sm" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-2xl border-2 border-[rgba(180,160,130,0.18)] p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="mb-1 h-4 w-32 rounded-sm" />
                  <Skeleton className="h-3 w-48 rounded-sm" />
                </div>
                <Skeleton className="ml-4 h-6 w-12 rounded-lg" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Performance Comparison */}
      <div className="rounded-3xl border-2 border-(--color-border-ui) bg-transparent p-1 sm:p-3">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <Skeleton className="h-8 w-48 rounded-lg" />
        </div>
        <div className="h-96 w-full rounded-3xl p-4">
          <Skeleton className="size-full rounded-3xl" />
        </div>
      </div>

      {/* Integrity Analysis */}
      <div className="rounded-3xl border-2 border-(--color-border-ui) bg-transparent p-2 sm:p-4">
        <Skeleton className="mb-1 h-6 w-32 rounded-sm" />
        <Skeleton className="mb-4 h-4 w-80 rounded-sm" />
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </div>

      {/* Additional Cards */}
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-40 w-full rounded-lg" />

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Strengths & Gaps Card */}
        <div className="rounded-3xl border-2 border-(--color-border-ui) bg-transparent p-2 sm:p-4">
          <Skeleton className="mb-1 h-6 w-32 rounded-sm" />
          <Skeleton className="-mt-4 mb-4 h-4 w-64 rounded-sm" />
          <div className="space-y-4">
            <div className="rounded-xl border-2 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Skeleton className="size-5 rounded-sm" />
                <Skeleton className="h-4 w-16 rounded-sm" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Skeleton className="mt-1 h-3 w-2 rounded-sm" />
                    <Skeleton className="h-4 w-full rounded-sm" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border-2 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Skeleton className="size-5 rounded-sm" />
                <Skeleton className="h-4 w-32 rounded-sm" />
              </div>
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Skeleton className="mt-1 h-3 w-2 rounded-sm" />
                    <Skeleton className="h-4 w-full rounded-sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations Card */}
        <div className="rounded-3xl border-2 border-(--color-border-ui) bg-transparent p-2 sm:p-4">
          <Skeleton className="mb-1 h-6 w-40 rounded-sm" />
          <Skeleton className="mb-4 h-4 w-64 rounded-sm" />
          <div className="rounded-xl border-0 p-4">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-2">
                  <Skeleton className="mt-1 h-3 w-2 rounded-sm" />
                  <Skeleton className="h-4 w-full rounded-sm" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
