import { Card, Skeleton } from '@heroui/react';
import { ChartsTooltip } from '@mui/x-charts';
import PropTypes from 'prop-types';

import { cn } from '@/utils/cn';

/**
 * ChartContainer - Responsive wrapper that provides consistent height and modern styling
 * Uses MUI X Charts patterns for optimal responsive behavior
 */
export function ChartContainer({
  children,
  className,
  style,
  height = 280,
  overflow = 'hidden',
  isLoading = false,
  colors,
}) {
  const mergedStyle = { minHeight: 200, height, ...style };

  if (isLoading) {
    return (
      <Card className={cn('min-w-0', className)} style={mergedStyle}>
        <Skeleton className="w-full h-full" />
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'min-w-0',
        className,
        overflow === 'auto' ? 'overflow-auto' : 'overflow-hidden',
      )}
      style={mergedStyle}
    >
      <div style={{ width: '100%', height: '100%' }}>{children}</div>
    </Card>
  );
}

ChartContainer.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
  height: PropTypes.number,
  overflow: PropTypes.string,
  isLoading: PropTypes.bool,
  colors: PropTypes.arrayOf(PropTypes.string),
};

/**
 * ChartTooltip - Wrapper for MUI X Charts Tooltip
 */
export function ChartTooltip({ ...props }) {
  return <ChartsTooltip {...props} />;
}

ChartTooltip.propTypes = {
  // MUI X ChartsTooltip props
};

/**
 * ChartTooltipContent - Custom tooltip content component with warm design tokens
 */
export function ChartTooltipContent({ active, payload, label, labelFormatter, formatter }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div
      className="rounded-lg border p-2 shadow-md backdrop-blur-sm"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
        fontSize: '0.875rem',
      }}
    >
      {label && (
        <div className="mb-1 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
          {labelFormatter ? labelFormatter(label) : label}
        </div>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const value = formatter ? formatter(entry.value, entry.name) : entry.value;
          const dotColor = entry.color || entry.fill || 'var(--accent)';
          return (
            <div key={`item-${index}`} className="flex items-center gap-2 text-sm">
              <div
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: dotColor,
                  boxShadow: `0 0 4px ${dotColor}40`,
                }}
              />
              <span style={{ color: 'var(--muted)' }}>{entry.name}:</span>
              <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

ChartTooltipContent.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  labelFormatter: PropTypes.func,
  formatter: PropTypes.func,
};
