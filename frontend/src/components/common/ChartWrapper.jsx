import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';
import { Tooltip } from 'recharts';

/**
 * ChartContainer - Simple wrapper that provides consistent height and prevents overflow.
 * NOTE: Chart components should include their own ResponsiveContainer to avoid nested containers.
 */
export function ChartContainer({ children, className, style, height = 280, overflow = 'hidden' }) {
  // wrapper provides minHeight and explicit height. overflow can be 'auto' to enable scrolling when needed.
  const mergedStyle = { minHeight: 200, height, ...style };

  return (
    <div
      className={cn(
        'min-w-0',
        className,
        overflow === 'auto' ? 'overflow-auto' : 'overflow-hidden',
      )}
      style={mergedStyle}
    >
      <div style={{ width: '100%', height: '100%' }}>{children}</div>
    </div>
  );
}

ChartContainer.propTypes = {
  children: PropTypes.node.isRequired,
  config: PropTypes.object,
  className: PropTypes.string,
  style: PropTypes.object,
};

/**
 * ChartTooltip - Wrapper for Recharts Tooltip
 */
export function ChartTooltip({ content, ...props }) {
  return <Tooltip content={content} {...props} />;
}

ChartTooltip.propTypes = {
  content: PropTypes.oneOfType([PropTypes.func, PropTypes.element]),
};

/**
 * ChartTooltipContent - Custom tooltip content component
 */
export function ChartTooltipContent({ active, payload, label, labelFormatter, formatter }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-white p-2 shadow-md">
      {label && (
        <div className="mb-1 text-sm font-semibold">
          {labelFormatter ? labelFormatter(label) : label}
        </div>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const value = formatter ? formatter(entry.value, entry.name) : entry.value;
          const dotColor = entry.color || entry.fill || 'var(--color-primary-500)';
          return (
            <div key={`item-${index}`} className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: dotColor }} />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-medium">{value}</span>
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
