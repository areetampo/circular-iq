import React from 'react';
import { Card, Skeleton } from '@heroui/react';

/**
 * ResultsSkeleton Component
 * Aligned with ResultsPage structure to provide a seamless loading experience.
 */
export default function ResultsSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50/30 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Action Buttons Bar Skeleton */}
        <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
          <Skeleton animationType="shimmer" className="h-10 w-32 rounded-lg" />
          <Skeleton animationType="shimmer" className="h-10 w-36 rounded-lg" />
          <Skeleton animationType="shimmer" className="h-10 w-32 rounded-lg" />
          <Skeleton animationType="shimmer" className="h-10 w-28 rounded-lg" />
        </div>

        {/* Tabs Skeleton */}
        <div className="flex justify-center my-4">
          <div className="flex gap-2 p-1 bg-emerald-100/30 rounded-xl">
            <Skeleton animationType="shimmer" className="h-10 w-32 rounded-lg" />
            <Skeleton animationType="shimmer" className="h-10 w-40 rounded-lg" />
            <Skeleton animationType="shimmer" className="h-10 w-40 rounded-lg" />
          </div>
        </div>

        <div className="space-y-6">
          {/* Executive Summary Card */}
          <Card className="border border-slate-300 shadow-sm rounded-xl bg-white">
            <div className="p-4 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton animationType="shimmer" className="h-7 w-48 rounded-md" />
                  <Skeleton animationType="shimmer" className="h-4 w-64 rounded-md" />
                </div>
                <Skeleton animationType="shimmer" className="h-7 w-24 rounded-full" />
              </div>

              {/* Verdict & Finding Skeletons */}
              <div className="space-y-3">
                <Skeleton animationType="shimmer" className="h-16 w-full rounded-lg" />
                <Skeleton animationType="shimmer" className="h-12 w-full rounded-lg" />
              </div>

              {/* Metrics Grid: matching grid-cols-2 lg:grid-cols-4 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} animationType="shimmer" className="h-24 w-full rounded-lg" />
                ))}
              </div>
            </div>
          </Card>

          {/* Case Summary Skeleton */}
          <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
            <div className="p-4 sm:p-6">
              <Skeleton animationType="shimmer" className="h-6 w-40 mb-2 rounded-md" />
              <Skeleton animationType="shimmer" className="h-4 w-72 mb-6 rounded-md" />

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="border border-slate-200 bg-white">
                    <div className="p-4 flex gap-3">
                      <Skeleton animationType="shimmer" className="h-10 w-10 rounded-lg shrink-0" />
                      <div className="space-y-2 w-full">
                        <Skeleton animationType="shimmer" className="h-5 w-24 rounded-md" />
                        <Skeleton animationType="shimmer" className="h-12 w-full rounded-md" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>

          {/* Score Highlights Skeleton */}
          <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
            <div className="p-4 sm:p-6">
              <Skeleton animationType="shimmer" className="h-6 w-40 mb-6 rounded-md" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} animationType="shimmer" className="h-32 w-full rounded-lg" />
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
