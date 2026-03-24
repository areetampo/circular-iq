import { Skeleton } from '@heroui/react';

function ComparisonSkeleton() {
  return (
    <div className="space-y-6 mt-4 w-full">
      {/* Header Skeleton */}
      <div className="w-full px-4 sm:px-8">
        <div className="flex items-center justify-center gap-4">
          <Skeleton
            className="h-10 w-32 rounded-lg"
            style={{ backgroundColor: 'var(--accent-soft)' }}
          />
          <Skeleton
            className="h-10 w-24 rounded-lg"
            style={{ backgroundColor: 'var(--accent-soft)' }}
          />
        </div>
      </div>

      {/* Assessment Headers Skeleton */}
      <div className="w-full px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-center">
          <Skeleton className="h-32 rounded-xl" style={{ backgroundColor: 'var(--surface)' }} />
          <Skeleton
            className="hidden lg:block h-16 w-16 rounded-full mx-auto"
            style={{ backgroundColor: 'var(--accent-soft)' }}
          />
          <Skeleton className="h-32 rounded-xl" style={{ backgroundColor: 'var(--surface)' }} />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="w-full px-4 sm:px-8">
        <div className="flex justify-center mb-6">
          <Skeleton
            className="h-12 w-96 rounded-xl"
            style={{ backgroundColor: 'var(--accent-soft)' }}
          />
        </div>

        {/* Content Cards Skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-xl" style={{ backgroundColor: 'var(--surface)' }} />
          <Skeleton className="h-48 rounded-xl" style={{ backgroundColor: 'var(--surface)' }} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-96 rounded-xl" style={{ backgroundColor: 'var(--surface)' }} />
            <Skeleton className="h-96 rounded-xl" style={{ backgroundColor: 'var(--surface)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export { ComparisonSkeleton };
export default ComparisonSkeleton;
