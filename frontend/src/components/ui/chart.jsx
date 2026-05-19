/**
 * @module chart
 * @description Shared chart UI primitives for the application.
 * Exposes chart container layout, tooltip rendering, legend helpers, and
 * context-based color configuration for Recharts components.
 */
import PropTypes from 'prop-types';
import * as React from 'react';
import { Tooltip } from 'recharts';

// ─── Context ────────────────────────────────────────────────────────────────
const ChartContext = React.createContext(null);

/**
 * Reads chart configuration from the current chart context.
 * @returns {{config: Object<string, {label?: string, color?: string, theme?: string}>}}
 */
function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) throw new Error('useChart must be used within a ChartContainer');
  return context;
}

// ─── ChartContainer ──────────────────────────────────────────────────────────
// Wraps a Recharts chart. config maps series keys to labels/colors.
/**
 * Chart container wrapper that injects theme variables and layout for Recharts charts.
 * @param {Object} props
 * @param {string} [props.id] - Optional ID to use for the chart container.
 * @param {string} [props.className] - Additional CSS class names.
 * @param {React.ReactNode} props.children - Chart children elements.
 * @param {Object} props.config - Series configuration mapping data keys to labels/colors.
 * @param {Object} [props.style] - Inline styles for the container.
 * @returns {JSX.Element}
 */
function ChartContainer({ id, className, children, config, style, ...props }) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={`w-full font-mono text-xs ${className || ''}`}
        style={style}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        {children}
      </div>
    </ChartContext.Provider>
  );
}

// ─── ChartStyle ───────────────────────────────────────────────────────────────
// Injects per-chart CSS variables for colors
/**
 * Injects CSS custom properties for chart series colors directly into the chart wrapper.
 * @param {Object} props
 * @param {string} props.id - Chart container identifier.
 * @param {Object} props.config - Series configuration mapping data keys to label/color values.
 * @returns {JSX.Element|null}
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

// ─── ChartTooltip ─────────────────────────────────────────────────────────────
const ChartTooltip = Tooltip;

/**
 * Custom tooltip content renderer for Recharts charts.
 * @param {Object} props
 * @param {boolean} props.active - Whether the tooltip is active.
 * @param {Array} props.payload - Tooltip payload data.
 * @param {string} props.label - Tooltip label value.
 * @param {string} [props.className] - Extra CSS classes.
 * @param {boolean} [props.hideLabel=false] - Hide the label section.
 * @param {boolean} [props.hideIndicator=false] - Hide the indicator dot/line.
 * @param {'dot'|'line'} [props.indicator='dot'] - Indicator shape.
 * @param {string} [props.nameKey] - Data key used for series names.
 * @param {Function} [props.labelFormatter] - Formatter for tooltip labels.
 * @param {Function} [props.formatter] - Formatter for tooltip values.
 * @returns {JSX.Element|null}
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

// ─── ChartLegend ──────────────────────────────────────────────────────────────
/**
 * Custom legend renderer for chart data payloads.
 * @param {Object} props
 * @param {Array} props.payload - Legend payload items.
 * @param {string} [props.className] - Extra CSS classes.
 * @returns {JSX.Element|null}
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
