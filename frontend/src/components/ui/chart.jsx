import * as React from 'react';
import { Tooltip } from 'recharts';

// ─── Context ────────────────────────────────────────────────────────────────
const ChartContext = React.createContext(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) throw new Error('useChart must be used within a ChartContainer');
  return context;
}

// ─── ChartContainer ──────────────────────────────────────────────────────────
// Wraps a Recharts chart. config maps series keys to labels/colors.
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
function ChartStyle({ id, config }) {
  const colorConfig = Object.entries(config).filter(([, v]) => v.color || v.theme);
  if (!colorConfig.length) return null;

  const vars = colorConfig.map(([key, value]) => `  --color-${key}: ${value.color};`).join('\n');

  return <style>{`[data-chart="${id}"] {\n${vars}\n}`}</style>;
}

// ─── ChartTooltip ─────────────────────────────────────────────────────────────
const ChartTooltip = Tooltip;

function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  hideLabel = false,
  hideIndicator = false,
  indicator = 'dot',
  nameKey,
  labelKey,
  labelFormatter,
  formatter,
}) {
  const { config } = useChart();

  if (!active || !payload?.length) return null;

  return (
    <div
      className={`min-w-30 rounded-lg border border-(--color-border-ui) bg-[rgba(247,243,237,0.97)] p-2 font-mono text-xs text-[#1a1510] shadow-sm ${className || ''}`}
    >
      {!hideLabel && label && (
        <p className="mb-1 text-[11px] leading-tight font-semibold text-[#5a4f42]">
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
              <span className="text-[#5a4f42]">{displayName}</span>
              <span className="ml-auto pl-2 font-semibold text-[#1a1510]">{displayValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ChartLegend ──────────────────────────────────────────────────────────────
function ChartLegendContent({ payload, className }) {
  if (!payload?.length) return null;

  return (
    <div
      className={`flex flex-wrap justify-center gap-4 pt-2 font-mono text-[13px] font-medium text-[#5a4f42] ${className || ''}`}
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

export { ChartContainer, ChartLegendContent, ChartTooltip, ChartTooltipContent, useChart };
