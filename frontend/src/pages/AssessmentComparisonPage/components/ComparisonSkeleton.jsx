export function ComparisonSkeleton() {
  return (
    <div className="animate-pulse max-w-6xl mx-auto px-4 py-8">
      {/* Sticky header skeleton */}
      <div className="grid grid-cols-2 gap-4 pb-6 border-b border-(--color-border) mb-8">
        <div className="space-y-2">
          <div className="h-5 w-3/4 bg-(--color-border) rounded" />
          <div className="h-4 w-1/3 bg-(--color-border) rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-5 w-3/4 bg-(--color-border) rounded ml-auto" />
          <div className="h-4 w-1/3 bg-(--color-border) rounded ml-auto" />
        </div>
      </div>

      {/* Assessment headers */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 mb-8">
        <div className="space-y-2 border border-(--color-border) rounded-xl p-4">
          <div className="h-5 w-2/3 bg-(--color-border) rounded" />
          <div className="h-3 w-1/3 bg-(--color-border) rounded" />
          <div className="h-8 w-16 bg-(--color-border) rounded mt-2" />
        </div>
        <div className="h-8 w-10 bg-(--color-border) rounded self-center" />
        <div className="space-y-2 border border-(--color-border) rounded-xl p-4">
          <div className="h-5 w-2/3 bg-(--color-border) rounded" />
          <div className="h-3 w-1/3 bg-(--color-border) rounded" />
          <div className="h-8 w-16 bg-(--color-border) rounded mt-2" />
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-6 border-b border-(--color-border) mb-8">
        {[20, 16, 24, 20].map((w, i) => (
          <div key={i} className={`h-8 w-${w} bg-(--color-border) rounded-sm`} />
        ))}
      </div>

      {/* Two-column content */}
      <div className="grid grid-cols-2 gap-0">
        <div className="border-r border-(--color-border) pr-8 space-y-4">
          <div className="h-3 w-24 bg-(--color-border) rounded mb-6" />
          {[100, 75, 90, 60, 85, 70].map((w, i) => (
            <div key={i} className="h-4 bg-(--color-border) rounded" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="pl-8 space-y-4">
          <div className="h-3 w-24 bg-(--color-border) rounded mb-6" />
          {[80, 95, 65, 75, 55, 88].map((w, i) => (
            <div key={i} className="h-4 bg-(--color-border) rounded" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

ComparisonSkeleton.propTypes = {};
export default ComparisonSkeleton;
