import React from 'react';
import { Card, Skeleton } from '@heroui/react';

/**
 * ResultsSkeleton Component
 * Loading skeleton that mimics the ResultsPage layout
 * Location: src/components/results/ResultsSkeleton.jsx
 */
export default function ResultsSkeleton() {
  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header Actions Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border rounded-lg bg-white">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-6">
        <div className="grid w-full grid-cols-3 gap-2 p-1 bg-muted rounded-lg">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>

        {/* Executive Summary Card Skeleton */}
        <Card className="border-4 border-emerald-600">
          <Card.Header className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-8 w-32" />
            </div>
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </Card.Header>
          <Card.Content className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <div className="h-0.5 bg-gray-200" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </Card.Content>
        </Card>

        {/* Score Visualization Card Skeleton */}
        <Card>
          <Card.Header>
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-96" />
          </Card.Header>
          <Card.Content className="space-y-4">
            {/* Radar Chart Skeleton */}
            <div className="flex justify-center">
              <Skeleton className="h-80 w-80 rounded-full" />
            </div>
            <div className="h-0.5 bg-gray-200" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>

        {/* Parameter Breakdown Card Skeleton */}
        <Card>
          <Card.Header>
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-full" />
          </Card.Header>
          <Card.Content className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="space-y-2 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </Card.Content>
        </Card>

        {/* Integrity Analysis Card Skeleton */}
        <Card>
          <Card.Header>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-full" />
          </Card.Header>
          <Card.Content className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </Card.Content>
        </Card>

        {/* Similar Projects Card Skeleton */}
        <Card>
          <Card.Header>
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-full" />
          </Card.Header>
          <Card.Content className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            ))}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
