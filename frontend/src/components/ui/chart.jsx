/** Shared Recharts primitives for container context, tooltip, legend, and CSS variable theming. */
import PropTypes from 'prop-types';
import * as React from 'react';
import { Tooltip } from 'recharts';

import { cn } from '@/utils/cn';

// Context shared by chart primitives that need series metadata.
const ChartContext = React.createContext(null);

/**
 * Reads the active chart series configuration from the nearest chart container.
 *
 * @returns {{config: Record<string, {label?: string, color?: string, theme?: string}>}}
 *   Chart configuration supplied by `ChartContainer`.
 * @throws {Error} When used outside `ChartContainer`.
 */
function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) throw new Error('useChart must be used within a ChartContainer');
  return context;
}

/**
 * Provides chart configuration, loading state, and themed CSS variables.
 */
function ChartContainer({
  id,
  className,
  children,
  config,
  style,

  // Keep chart-only convenience props from leaking onto the DOM wrapper.
  isLoading,
  showTooltip,
  showLegend,
  colors,
  dataKey,
  nameKey,

  ...props
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn('w-full font-mono text-xs', className)}
        style={style}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        {children}
      </div>
    </ChartContext.Provider>
  );
}

/**
 * Injects Recharts theme variables scoped to a chart instance.
 */
function ChartStyle({ id, config }) {
  const colorConfig = Object.entries(config).filter(([, v]) => v.color || v.theme);
  if (!colorConfig.length) return null;

  const vars = colorConfig.map(([key, value]) => `  --color-${key}: ${value.color};`).join('\n');

  return <style>{`[data-chart="${id}"] {\n${vars}\n}`}</style>;
}

ChartStyle.propTypes = {
  id: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
};

const ChartTooltip = Tooltip;

/**
 * Renders configured labels and colors for an active Recharts tooltip payload.
 */
function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  hideLabel = false,
  hideIndicator = false,
  indicator = 'dot',
  nameKey,
  labelFormatter,
  formatter,
}) {
  const { config } = useChart();

  if (!active || !payload?.length) return null;

  return (
    <div
      className={`min-w-30 rounded-lg border border-(--color-border-ui) bg-(--color-tooltip-bg) p-2 font-mono text-xs text-(--color-text-primary) shadow-sm ${className || ''}`}
    >
      {!hideLabel && label && (
        <p className="mb-1 text-[11px] leading-tight font-semibold text-(--color-text-secondary)">
          {labelFormatter ? labelFormatter(label, payload) : label}
        </p>
      )}
      <div className="flex flex-col gap-1">
        {payload.map((item, i) => {
          const key = nameKey || item.name || item.dataKey || 'value';
          const itemConfig = config[key] || {};
          const color = itemConfig.color || item.color || item.fill;
          const displayName = itemConfig.label || item.name || key;
          const displayValue = formatter
            ? formatter(item.value, item.name, item, i, payload)
            : typeof item.value === 'number'
              ? Number.isInteger(item.value)
                ? item.value
                : item.value.toFixed(1)
              : item.value;

          return (
            <div key={i} className="flex items-center gap-2">
              {!hideIndicator && (
                <span
                  className={`block shrink-0 ${
                    indicator === 'line' ? `h-0.5 w-4 rounded-sm` : `size-2 rounded-full`
                  }`}
                  style={{ backgroundColor: color }}
                />
              )}
              <span className="text-(--color-text-secondary)">{displayName}</span>
              <span className="ml-auto pl-2 font-semibold text-(--color-text-primary)">
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Renders configured labels for a Recharts legend payload.
 */
function ChartLegendContent({ payload, className }) {
  if (!payload?.length) return null;

  return (
    <div
      className={`flex flex-wrap justify-center gap-4 pt-2 font-mono text-[13px] font-medium text-(--color-text-secondary) ${className || ''}`}
    >
      {payload.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span
            className="block size-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

ChartContainer.propTypes = {
  id: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  config: PropTypes.object,
  style: PropTypes.object,
  isLoading: PropTypes.bool,
  showTooltip: PropTypes.bool,
  showLegend: PropTypes.bool,
  colors: PropTypes.array,
  dataKey: PropTypes.string,
  nameKey: PropTypes.string,
};

ChartTooltipContent.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string,
  className: PropTypes.string,
  hideLabel: PropTypes.bool,
  hideIndicator: PropTypes.bool,
  indicator: PropTypes.string,
  nameKey: PropTypes.string,
  labelFormatter: PropTypes.func,
  formatter: PropTypes.func,
};

ChartLegendContent.propTypes = {
  payload: PropTypes.array,
  className: PropTypes.string,
};

export { ChartContainer, ChartLegendContent, ChartTooltip, ChartTooltipContent, useChart };
