import React from 'react';
import {
  LineChart as RechartsLine,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function LineChart({
  data,
  lines = [{ dataKey: 'value', stroke: 'hsl(200, 100%, 50%)', name: 'Value' }],
  xAxisKey = 'name',
  height = 300,
  ariaLabel = undefined,
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

  // If any band entries are present, derive additional fields for stacked area rendering
  let derivedData = data;
  const bandEntries = (lines || []).filter((l) => l.band === true && l.upperKey && l.lowerKey);
  if (bandEntries.length > 0) {
    derivedData = (data || []).map((row) => ({ ...row }));
    bandEntries.forEach((band, idx) => {
      const id = band.id || `band_${idx}`;
      const lowerKey = `${id}_lower`;
      const rangeKey = `${id}_range`;
      derivedData.forEach((row) => {
        const upper = Number(row[band.upperKey] ?? 0);
        const lower = Number(row[band.lowerKey] ?? 0);
        const range = Math.max(0, upper - lower);
        row[lowerKey] = Number(lower.toFixed(2));
        row[rangeKey] = Number(range.toFixed(2));
      });
      // Attach the computed keys to the band object so we can reference them when rendering
      band._computedLower = lowerKey;
      band._computedRange = rangeKey;
      // Compute gradient id for this band
      band._gradientId = `gradient-${id}`;
    });
  }

  return (
    <div role={ariaLabel ? 'img' : undefined} aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLine data={derivedData}>
          <defs>
            {bandEntries.map((band) => (
              <linearGradient
                id={band._gradientId}
                key={`def-${band._gradientId}`}
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={band.fill || '#e6f4ea'}
                  stopOpacity={band.fillOpacity ?? 0.9}
                />
                <stop
                  offset="100%"
                  stopColor={band.fill || '#e6f4ea'}
                  stopOpacity={band.fillOpacity ? band.fillOpacity * 0.2 : 0.1}
                />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {/* Render bands as stacked areas: lower (invisible) + range (filled with gradient) */}
          {bandEntries.map((band, idx) => (
            <React.Fragment key={`band-${idx}`}>
              <Area
                dataKey={band._computedLower}
                stackId={`band-${idx}`}
                stroke="none"
                fill="none"
                isAnimationActive={false}
              />
              <Area
                dataKey={band._computedRange}
                stackId={`band-${idx}`}
                stroke="none"
                fill={`url(#${band._gradientId})`}
                fillOpacity={1}
                isAnimationActive={true}
                animationDuration={800}
              />
            </React.Fragment>
          ))}

          {lines.map((line, index) => {
            // Skip band entries when rendering regular lines
            if (line.band === true) return null;
            const { dataKey, stroke, name, ...rest } = line;
            return (
              <Line
                key={index}
                type="monotone"
                dataKey={dataKey}
                stroke={stroke}
                strokeWidth={2.5}
                name={name}
                dot={{ r: 5, fill: stroke }}
                activeDot={{ r: 7 }}
                isAnimationActive={true}
                {...rest}
              />
            );
          })}
        </RechartsLine>
      </ResponsiveContainer>
    </div>
  );
}
