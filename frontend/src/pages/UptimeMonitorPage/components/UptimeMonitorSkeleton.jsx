import { Skeleton } from '@heroui/react';

import { ENDPOINTS } from '../constants';

export default function UptimeMonitorSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
      {/* Header skeleton */}
      <div className="flex items-end justify-between gap-4 pt-8">
        <div>
          <Skeleton className="h-11 w-55 rounded-full" />
          <Skeleton className="mt-2 h-4 w-84 rounded-lg pl-1" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-3 w-24 rounded-lg" />
        </div>
      </div>

      {/* Summary Stats - Tilt3D cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-start justify-center gap-2.5 rounded-3xl border-2 border-(--color-border-ui) bg-transparent p-5"
          >
            <Skeleton className="h-3 w-7/12 rounded-lg" />
            <Skeleton className="h-8 w-1/2 rounded-lg" />
            <Skeleton className="h-3 w-3/5 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Charts 2x2 - Tilt3D cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Health Distribution Chart */}
        <div className="h-full rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-4">
          <Skeleton className="mb-2 h-3 w-40 rounded-lg" />
          <Skeleton className="h-56 w-full rounded-lg" />
        </div>
        {/* Global Response Trend Chart */}
        <div className="h-full rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-4">
          <Skeleton className="mb-2 h-3 w-48 rounded-lg" />
          <Skeleton className="h-56 w-full rounded-lg" />
        </div>
        {/* Uptime Over Time Chart */}
        <div className="h-full rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-4">
          <Skeleton className="mb-2 h-3 w-36 rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        {/* Endpoint Latency Bar Chart */}
        <div className="h-full rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-4">
          <Skeleton className="mb-2 h-3 w-44 rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>

      {/* Full‑width heatmap - Tilt3D card */}
      <div className="w-full">
        <div className="rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-4">
          <Skeleton className="mb-2 h-3 w-32 rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>

      {/* Endpoint Cards section */}
      <div>
        <div className="flex items-baseline justify-between pb-2">
          <Skeleton className="h-4 w-28 rounded-lg" />
          <Skeleton className="h-4 w-8 rounded-lg" />
        </div>
        <div className="h-px w-full bg-(--color-border-ui)" />
      </div>

      {/* Endpoint Cards - Tilt3D cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {ENDPOINTS.map((_, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-4 rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-5"
          >
            {/* Header with status dot and name */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-2 rounded-full" />
                  <Skeleton className="h-5 w-40 rounded-lg" />
                </div>
                <Skeleton className="mt-1 h-3 w-32 rounded-lg" />
                <Skeleton className="mt-0.5 h-4 w-48 rounded-lg" />
              </div>
              <div className="shrink-0 text-right">
                <Skeleton className="h-8 w-16 rounded-lg" />
                <Skeleton className="mt-1 h-3 w-16 rounded-lg" />
              </div>
            </div>

            {/* History bar placeholder */}
            <Skeleton className="h-2 w-full rounded-lg" />

            {/* Chart placeholder */}
            <div>
              <Skeleton className="mb-1 h-3 w-48 rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>

            {/* Metrics section */}
            <div className="flex flex-wrap items-stretch gap-5 border-t border-(--color-border-ui) pt-3">
              <div className="flex flex-1 flex-col justify-between">
                <Skeleton className="h-3 w-20 rounded-lg" />
                <Skeleton className="h-5 w-12 rounded-lg" />
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <Skeleton className="h-3 w-20 rounded-lg" />
                <Skeleton className="h-5 w-16 rounded-lg" />
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <Skeleton className="h-3 w-16 rounded-lg" />
                <Skeleton className="h-5 w-20 rounded-lg" />
              </div>
              <div className="ml-auto flex flex-col justify-between">
                <Skeleton className="h-3 w-16 rounded-lg" />
                <Skeleton className="h-5 w-8 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
