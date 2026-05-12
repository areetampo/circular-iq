import { Tooltip } from '@heroui/react';
import PropTypes from 'prop-types';

import { cn } from '@/utils/cn';

/**
 * HistoryBar - A visual history bar showing recent uptime checks
 * Displays the last specified number of checks as a horizontal bar with tooltips
 *
 * @param {Object} props - Component props
 * @param {Array} props.checks - Array of check objects with status and ms properties
 * @param {number} props.count - Number of recent checks to display
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element} Rendered HistoryBar
 *
 * @example
 * Basic usage
 * <HistoryBar checks={uptimeChecks} count={100} />
 *
 * @example
 * With empty checks array
 * <HistoryBar checks={[]} count={50} />
 */
export default function HistoryBar({ checks, count, ...props }) {
  const displayChecks = checks.slice(-count);
  const emptyCount = Math.max(0, count - displayChecks.length);

  return (
    <div className="flex h-5 items-end gap-px" {...props}>
      {[...Array(emptyCount).fill(null), ...displayChecks].map((check, i) => {
        const isEmpty = !check;
        // Calculate opacity: only for data points, scaling from 0.45 to 1.0
        const opacity = isEmpty ? 1 : 0.45 + (i / count) * 0.55;
        return (
          <Tooltip key={i} delay={0}>
            <Tooltip.Trigger
              tabIndex={0}
              style={{ opacity }}
              className={cn(
                'h-3 flex-1 rounded-xs transition-all',
                isEmpty
                  ? 'bg-(--color-accent)/10'
                  : ['h-5', check.up ? 'bg-(--color-success)' : 'bg-(--color-error)'],
              )}
            />
            <Tooltip.Content>
              {isEmpty ? 'No data' : `${check.status} — ${check.ms}ms`}
            </Tooltip.Content>
          </Tooltip>
        );
      })}
    </div>
  );
}

HistoryBar.propTypes = {
  /** Array of check objects with status and ms properties */
  checks: PropTypes.array.isRequired,
  /** Number of recent checks to display */
  count: PropTypes.number.isRequired,
};
