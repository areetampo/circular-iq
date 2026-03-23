import { BarChart3 } from 'lucide-react';
import PropTypes from 'prop-types';

import { cn } from '@/utils/cn';

function EmptyChart({ message = 'No data yet', compact }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 text-slate-300',
        compact ? 'h-24' : 'h-44',
      )}
    >
      <BarChart3 size={24} strokeWidth={1} />
      <span className="text-xs font-medium">{message}</span>
    </div>
  );
}

EmptyChart.propTypes = {
  /** Message to display when chart is empty */
  message: PropTypes.string,
  /** Whether to use compact (small) height */
  compact: PropTypes.bool,
};

export { EmptyChart };
export default EmptyChart;
