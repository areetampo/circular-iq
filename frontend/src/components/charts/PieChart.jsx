import React from 'react';
import { PieChart as RePieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export default function PieChart({
  data,
  dataKey,
  nameKey,
  height = 300,
  width = 450,
  colors = [
    '#3b82f6',
    '#10b981',
    '#f59e42',
    '#a78bfa',
    '#ef4444',
    '#fbbf24',
    '#6366f1',
    '#f472b6',
    '#22223b',
    '#9d0208',
  ],
  labelType = 'both', // 'count', 'percent', 'both'
  showLegend = true,
  innerRadius = 0,
  centerLabel = null,
}) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-500"
        style={{ height: `${height}px` }}
      >
        No data available
      </div>
    );
  }

  const renderLabel = ({ name, value, percent }) => {
    const pct = `${(percent * 100).toFixed(0)}%`;
    if (labelType === 'count') return `${name}: ${value}`;
    if (labelType === 'percent') return `${name}: ${pct}`;
    return `${name}: ${value} (${pct})`;
  };

  // compute radii
  const outer = Math.min(height, width) / 3;
  const inner = innerRadius || Math.max(0, Math.floor(outer * 0.5));

  return (
    <div className="relative" style={{ width, height }}>
      <RePieChart width={width} height={height}>
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          cx="45%"
          cy="50%"
          outerRadius={outer}
          innerRadius={inner}
          label={renderLabel}
          labelLine={true}
          paddingAngle={4}
        >
          {data.map((entry, idx) => (
            <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} stroke="#fff" />
          ))}
        </Pie>
        <Tooltip formatter={(value, name, props) => [value, name]} />
        {showLegend && <Legend verticalAlign="bottom" height={36} />}
      </RePieChart>

      {centerLabel && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none"
          style={{ width: inner * 1.6 }}
        >
          <div className="text-sm text-slate-500">{centerLabel.subLabel}</div>
          <div className="text-lg font-semibold text-slate-800">{centerLabel.main}</div>
        </div>
      )}
    </div>
  );
}
