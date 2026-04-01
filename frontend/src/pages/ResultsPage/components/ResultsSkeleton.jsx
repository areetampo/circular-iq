/**
 * ResultsSkeleton Component
 * Aligned with ResultsPage structure to provide a seamless loading experience.
 */
export default function ResultsSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-6 animate-pulse">
      {/* Action bar skeleton */}
      <div className="flex justify-between mb-8">
        <div className="h-8 w-24 bg-(--color-border) rounded" />
        <div className="flex gap-3">
          <div className="h-8 w-28 bg-(--color-border) rounded" />
          <div className="h-8 w-24 bg-(--color-border) rounded" />
          <div className="h-8 w-20 bg-(--color-border) rounded" />
        </div>
      </div>

      {/* Score hero skeleton */}
      <div className="text-center py-12">
        <div className="h-24 w-32 bg-(--color-border) rounded mx-auto mb-3" />
        <div className="h-4 w-40 bg-(--color-border) rounded mx-auto mb-2" />
        <div className="h-3 w-64 bg-(--color-border) rounded mx-auto" />
      </div>

      {/* Section skeletons — each with border-t */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="border-t border-(--color-border) pt-8 mt-8">
          <div className="h-3 w-32 bg-(--color-border) rounded mb-6" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-(--color-border) rounded" />
            <div className="h-4 w-3/4 bg-(--color-border) rounded" />
            <div className="h-4 w-5/6 bg-(--color-border) rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
