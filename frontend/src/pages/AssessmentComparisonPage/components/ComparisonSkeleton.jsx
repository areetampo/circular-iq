import { cn } from '@/utils/cn';

export function ComparisonSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8">
      {/* Sticky header skeleton */}
      <div className="mb-8 grid grid-cols-2 gap-4 border-b border-border pb-6">
        <div className="space-y-2">
          <div className="h-5 w-3/4 rounded-sm bg-border" />
          <div className="h-4 w-1/3 rounded-sm bg-border" />
        </div>
        <div className="space-y-2">
          <div className="ml-auto h-5 w-3/4 rounded-sm bg-border" />
          <div className="ml-auto h-4 w-1/3 rounded-sm bg-border" />
        </div>
      </div>

      {/* Assessment headers */}
      <div className="mb-8 grid grid-cols-[1fr_auto_1fr] gap-4">
        <div className="space-y-2 rounded-xl border border-border p-4">
          <div className="h-5 w-2/3 rounded-sm bg-border" />
          <div className="h-3 w-1/3 rounded-sm bg-border" />
          <div className="mt-2 h-8 w-16 rounded-sm bg-border" />
        </div>
        <div className="h-8 w-10 self-center rounded-sm bg-border" />
        <div className="space-y-2 rounded-xl border border-border p-4">
          <div className="h-5 w-2/3 rounded-sm bg-border" />
          <div className="h-3 w-1/3 rounded-sm bg-border" />
          <div className="mt-2 h-8 w-16 rounded-sm bg-border" />
        </div>
      </div>

      {/* Tab bar */}
      <div className="mb-8 flex gap-6 border-b border-border">
        {[20, 16, 24, 20].map((w, i) => (
          <div key={i} className={cn('h-8 rounded-sm bg-border', `w-${w}`)} />
        ))}
      </div>

      {/* Two-column content */}
      <div className="grid grid-cols-2 gap-0">
        <div className="space-y-4 border-r border-border pr-8">
          <div className="mb-6 h-3 w-24 rounded-sm bg-border" />
          {[100, 75, 90, 60, 85, 70].map((w, i) => (
            <div key={i} className="h-4 rounded-sm bg-border" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="space-y-4 pl-8">
          <div className="mb-6 h-3 w-24 rounded-sm bg-border" />
          {[80, 95, 65, 75, 55, 88].map((w, i) => (
            <div key={i} className="h-4 rounded-sm bg-border" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

ComparisonSkeleton.propTypes = {};
export default ComparisonSkeleton;
