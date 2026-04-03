/**
 * ResultsSkeleton Component
 * Redesigned to match the actual ResultsPage layout structure with shimmer animations
 */
import { Skeleton } from '@heroui/react';

export default function ResultsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-6 space-y-6">
      {/* Action Buttons & Share Section */}
      <div className="mb-8 mt-4 px-4 sm:px-6 space-y-4">
        {/* Title placeholder for saved assessments */}
        <div className="mb-4">
          <Skeleton className="h-8 w-64 rounded-lg" />
        </div>

        {/* Buttons Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-32 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
          <div className="flex items-center gap-3 ml-auto flex-wrap">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>

        {/* Share Assessment Section */}
        <div className="border-t border-[rgba(180,160,130,0.18)] pt-4 mb-3">
          <div className="flex items-center justify-start gap-4">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-3 pt-3">
            <Skeleton className="h-10 w-full rounded" />
            <Skeleton className="h-10 w-20 rounded" />
          </div>
        </div>
      </div>

      {/* Case Summary Accordion */}
      <div className="border-b border-[rgba(180,160,130,0.18)] mb-6 pb-4">
        <div className="p-1 sm:p-3">
          <Skeleton className="h-8 w-32 rounded-lg mb-4" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-[rgba(180,160,130,0.18)] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5 rounded" />
                    <div>
                      <Skeleton className="h-4 w-24 rounded mb-1" />
                      <Skeleton className="h-3 w-40 rounded" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-4 rounded" />
                </div>
                <Skeleton className="h-4 w-full rounded mt-3" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Score Overview Section */}
      <div className="mt-8">
        {/* Industry and Confidence Row */}
        <div className="flex justify-center gap-4 mb-6">
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>

        {/* Main Score Display */}
        <div className="text-center mb-8">
          <Skeleton className="h-[72px] w-32 mx-auto mb-3 rounded" />
          <Skeleton className="h-8 w-16 mx-auto mb-2 rounded" />
          <Skeleton className="h-4 w-40 mx-auto rounded" />
          <Skeleton className="h-6 w-96 mx-auto mt-6 rounded" />
        </div>

        {/* Score Summary Stats */}
        <div className="flex gap-6 justify-center mb-8">
          <Skeleton className="h-4 w-64 rounded" />
        </div>

        {/* Strongest Factor and Focus Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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
      <div className="border rounded-lg p-1 sm:p-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 rounded-lg border">
              <Skeleton className="h-3 w-16 rounded mb-2" />
              <Skeleton className="h-4 w-20 rounded mb-1" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Category Analysis */}
      <div className="border-2 border-[rgba(180,160,130,0.25)] rounded-3xl bg-transparent p-1 sm:p-3">
        <Skeleton className="h-8 w-40 rounded-lg mb-4" />
        <Skeleton className="h-4 w-64 rounded mb-4 -mt-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 rounded-2xl border-2 border-[rgba(180,160,130,0.18)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 rounded mb-1" />
                  <Skeleton className="h-3 w-48 rounded" />
                </div>
                <Skeleton className="h-6 w-12 rounded-lg ml-4" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Performance Comparison */}
      <div className="border-2 border-[rgba(180,160,130,0.25)] rounded-3xl bg-transparent p-1 sm:p-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <Skeleton className="h-8 w-48 rounded-lg" />
        </div>
        <div className="w-full rounded-3xl p-4 h-96">
          <Skeleton className="h-full w-full rounded-3xl" />
        </div>
      </div>

      {/* Integrity Analysis */}
      <div className="border-2 border-[rgba(180,160,130,0.25)] rounded-3xl bg-transparent p-2 sm:p-4">
        <Skeleton className="h-6 w-32 rounded mb-1" />
        <Skeleton className="h-4 w-80 rounded mb-4" />
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
        <div className="border-2 border-[rgba(180,160,130,0.25)] rounded-3xl bg-transparent p-2 sm:p-4">
          <Skeleton className="h-6 w-32 rounded mb-1" />
          <Skeleton className="h-4 w-64 rounded mb-4 -mt-4" />
          <div className="space-y-4">
            <div className="p-4 rounded-xl border-2">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Skeleton className="h-3 w-2 rounded mt-1" />
                    <Skeleton className="h-4 w-full rounded" />
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-xl border-2">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-32 rounded" />
              </div>
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Skeleton className="h-3 w-2 rounded mt-1" />
                    <Skeleton className="h-4 w-full rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations Card */}
        <div className="border-2 border-[rgba(180,160,130,0.25)] rounded-3xl bg-transparent p-2 sm:p-4">
          <Skeleton className="h-6 w-40 rounded mb-1" />
          <Skeleton className="h-4 w-64 rounded mb-4" />
          <div className="p-4 rounded-xl border-0">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-2">
                  <Skeleton className="h-3 w-2 rounded mt-1" />
                  <Skeleton className="h-4 w-full rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
