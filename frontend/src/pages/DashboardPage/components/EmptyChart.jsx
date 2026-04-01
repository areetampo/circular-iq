import { BarChart3 } from 'lucide-react';

function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <BarChart3 className="w-8 h-8 text-(--color-border-strong) mb-3" />
      <p className="text-sm text-(--color-text-muted)">No data available yet</p>
    </div>
  );
}

EmptyChart.propTypes = {};

export { EmptyChart };
export default EmptyChart;
