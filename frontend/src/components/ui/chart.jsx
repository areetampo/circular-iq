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
        className={className}
        style={{
          width: '100%',
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
          fontSize: 12,
          ...style,
        }}
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
      className={className}
      style={{
        background: 'rgba(247, 243, 237, 0.97)',
        border: '1px solid rgba(180, 160, 130, 0.25)',
        borderRadius: 8,
        padding: '8px 12px',
        boxShadow: '0 2px 12px rgba(26,21,16,0.1)',
        fontFamily:
          'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
        fontSize: 12,
        color: '#1a1510',
        minWidth: 120,
      }}
    >
      {!hideLabel && label && (
        <p style={{ fontWeight: 600, marginBottom: 4, color: '#5a4f42', fontSize: 11 }}>
          {labelFormatter ? labelFormatter(label, payload) : label}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {!hideIndicator && (
                <span
                  style={{
                    display: 'inline-block',
                    width: indicator === 'line' ? 16 : 8,
                    height: indicator === 'line' ? 2 : 8,
                    borderRadius: indicator === 'dot' ? '50%' : 2,
                    background: color,
                    flexShrink: 0,
                  }}
                />
              )}
              <span style={{ color: '#5a4f42' }}>{displayName}</span>
              <span
                style={{ marginLeft: 'auto', fontWeight: 600, color: '#1a1510', paddingLeft: 8 }}
              >
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
function ChartLegendContent({ payload, className }) {
  if (!payload?.length) return null;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px 16px',
        justifyContent: 'center',
        paddingTop: 8,
        fontFamily:
          'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
        fontSize: 13,
        fontWeight: 500,
        color: '#5a4f42',
      }}
    >
      {payload.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: 3,
              background: item.color,
              flexShrink: 0,
            }}
          />
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export { ChartContainer, ChartLegendContent, ChartTooltip, ChartTooltipContent, useChart };
