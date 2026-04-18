/**
 * ResultsSkeleton Component
 * Clean skeleton with no borders, only content skeletons preserving exact spacing
 */
import { Separator, Skeleton } from '@heroui/react';

export default function ResultsSkeleton() {
  return (
    <div className="mx-auto max-w-5xl">
      {/* Action Buttons & Share Section */}
      <div className="my-8 space-y-4 px-4 sm:px-6">
        {/* Title placeholder for saved assessments - left aligned like actual page */}
        <div className="mb-4">
          <Skeleton className="h-8 w-64 rounded-lg" />
        </div>

        {/* ResultsActionBar skeleton - single row layout like actual page */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          {/* Left group - navigation buttons */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-32 rounded-md" /> {/* My Assessments */}
            <Skeleton className="h-8 w-28 rounded-md" /> {/* Re-evaluate */}
          </div>

          {/* Right group - action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-8 w-16 rounded-md" /> {/* PDF */}
            <Skeleton className="h-8 w-16 rounded-md" /> {/* CSV */}
            <Skeleton className="h-8 w-20 rounded-md" /> {/* Save */}
            <Skeleton className="h-8 w-24 rounded-md" /> {/* Rename */}
            <Skeleton className="h-8 w-20 rounded-md" /> {/* Delete */}
          </div>
        </div>

        {/* Share Assessment Section skeleton for saved assessments */}
        <div className="rounded-xl border-2 border-(--color-border-card) px-3 py-2">
          {/* Checkbox toggle skeleton */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-5 w-40 rounded-sm" />
            <Skeleton className="size-4.5 rounded-full!" />
          </div>

          {/* Share URL section skeleton */}
          <div className="mt-3 flex origin-top-left scale-90 flex-col gap-3 opacity-70 sm:flex-row">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-96 rounded-sm font-mono" />
              <Skeleton className="size-4.5" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center">
        <Separator variant="secondary" className="mt-4 mb-6 w-1/2" />
      </div>

      {/* Case Summary skeleton */}
      <div data-export-section="case-summary">
        <div className="p-1 sm:p-3">
          <Skeleton className="mb-2 h-8 w-32 rounded-lg" />

          {/* Problem accordion skeleton */}
          <div className="mb-4">
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
            <Separator variant="secondary" />
          </div>

          {/* Solution accordion skeleton */}
          <div className="mb-4">
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
            <Separator variant="secondary" />
          </div>

          {/* Business Context accordion skeleton */}
          <div className="mb-4">
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
            <Separator variant="secondary" />
          </div>

          {/* Parameter accordion skeleton */}
          <div>
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
            <Separator variant="secondary" />
          </div>
        </div>
      </div>

      {/* Results Content skeleton */}
      <div id="results-content" className="mx-auto max-w-7xl space-y-6 px-0 sm:px-6">
        {/* ScoreOverviewSection skeleton */}
        <div className="mt-8">
          {/* Industry and Confidence row skeleton */}
          <div className="mb-6 flex justify-center gap-4">
            <Skeleton className="h-6 w-24 rounded-lg" />
            <Skeleton className="h-6 w-32 rounded-lg" />
            <Skeleton className="h-6 w-28 rounded-lg" />
          </div>

          {/* Main Score Display skeleton */}
          <div className="mb-8 text-center">
            <Skeleton className="mx-auto mb-3 h-16 w-32 rounded-lg" />
            <Skeleton className="mx-auto mb-2 h-8 w-16 rounded-sm" />
            <Skeleton className="mx-auto h-4 w-40 rounded-sm" />
            <Skeleton className="mx-auto mt-6 h-6 w-96 rounded-sm" />
          </div>

          {/* Score Summary Stats skeleton */}
          <div className="mb-8 flex justify-center gap-6">
            <Skeleton className="h-4 w-64 rounded-sm" />
          </div>

          {/* Strongest Factor and Focus Area skeleton */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>

        {/* CircularEconomyTierCard skeleton */}
        <div className="mt-8 pt-8">
          <div className="mb-1 h-8 w-48 rounded-lg" />
          <Skeleton className="mb-1 h-10 w-20 rounded-lg" />
          <Skeleton className="mb-3 h-4 w-64 rounded-sm" />
          <Skeleton className="mb-4 h-4 w-full rounded-sm" />
          <div className="my-3 border-l-2 border-(--color-accent) py-1 pl-3">
            <Skeleton className="mb-1 h-4 w-32 rounded-sm" />
            <Skeleton className="h-4 w-48 rounded-sm" />
          </div>
        </div>

        {/* WeightedScoreCard skeleton */}
        <div className="mt-8 pt-8">
          <div className="mb-6 h-8 w-64 rounded-lg" />
          <Skeleton className="mb-6 h-4 w-full rounded-sm" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="h-4 w-32 rounded-sm" />
                <Skeleton className="h-1.5 flex-1 rounded-full" />
                <Skeleton className="h-4 w-8 rounded-sm" />
                <Skeleton className="h-4 w-10 rounded-sm" />
              </div>
            ))}
          </div>
        </div>

        {/* ParameterConsistencyCard skeleton */}
        <div className="mt-8 pt-8">
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>

        {/* RStrategyAlignmentCard skeleton */}
        <div className="mt-8 pt-8">
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>

        {/* ScoreCategoryBreakdown skeleton */}
        <div className="mt-8 pt-8">
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>

        {/* GapAnalysisCard skeleton */}
        <div className="mt-8 pt-8">
          <Skeleton className="h-36 w-full rounded-lg" />
        </div>

        {/* IndustryMetadataSection skeleton */}
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

        {/* CategoryAnalysis skeleton */}
        <Skeleton className="h-44 w-full rounded-lg" />

        {/* PerformanceComparison skeleton */}
        <Skeleton className="h-48 w-full rounded-lg" />

        {/* IntegrityAnalysis skeleton */}
        <Skeleton className="h-52 w-full rounded-lg" />

        {/* AuditSummaryCard skeleton */}
        <Skeleton className="h-56 w-full rounded-lg" />

        {/* DatabaseEvidenceCard skeleton */}
        <Skeleton className="h-60 w-full rounded-lg" />

        {/* Two-column grid skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
