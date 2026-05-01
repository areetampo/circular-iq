import { BarChart3 } from 'lucide-react';

/**
 * Empty chart component for displaying when no data is available
 */
export default function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <BarChart3 className="mb-3 size-8 text-emerald-800/60" />
      <p className="font-mono text-sm text-(--color-text-muted)">No data available yet</p>
    </div>
  );
}

EmptyChart.propTypes = {};
