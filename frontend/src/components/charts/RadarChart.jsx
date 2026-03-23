import { Card, ProgressCircle } from '@heroui/react';
import PropTypes from 'prop-types';
import { useMemo } from 'react';

function RadarChartComponent({
  data,
  radarConfigs,
  height = 400,
  showLegend = true,
  showTooltip = true,
  isLoading = false,
}) {
  // Default color palette for charts
  const defaultColors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
  ];

  const chartData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        subject: item.subject || item.factor || item.name || 'Unknown',
      })),
    [data],
  );

  const colorMap = useMemo(() => {
    return radarConfigs.reduce((acc, config, i) => {
      acc[config.dataKey] = config.stroke || defaultColors[i % defaultColors.length];
      return acc;
    }, {});
  }, [radarConfigs]);

  const dimensions = useMemo(() => {
    const size = Math.min(height - 80, 400);
    const center = size / 2;
    const radius = center - 40;
    return { size, center, radius };
  }, [height]);

  const { angles, points } = useMemo(() => {
    if (!chartData.length) return { angles: [], points: [] };
    const count = chartData.length;
    const angles = Array.from({ length: count }, (_, i) => (i * 2 * Math.PI) / count - Math.PI / 2);
    return { angles, count };
  }, [chartData]);

  const getPoint = (angle, value, maxValue = 100) => {
    const { center, radius } = dimensions;
    const normalizedValue = Math.min(Math.max(value / maxValue, 0), 1);
    const r = radius * normalizedValue;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  const getPath = (values, maxValue = 100) => {
    if (!angles.length || !values.length) return '';
    const { center } = dimensions;
    const points = angles.map((angle, idx) => {
      const val = values[idx] ?? 0;
      return getPoint(angle, val, maxValue);
    });
    return `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')} Z`;
  };

  if (isLoading) {
    return (
      <Card className="w-full border border-default-200">
        <div
          className="flex items-center justify-center w-full"
          style={{ minHeight: height || 400 }}
        >
          <ProgressCircle size="lg" />
        </div>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="w-full border border-default-200">
        <div
          className="flex items-center justify-center w-full text-default-400"
          style={{ minHeight: height || 400 }}
        >
          <span className="text-sm">No data available</span>
        </div>
      </Card>
    );
  }

  const { size, center, radius } = dimensions;
  const gridLevels = 5;
  const maxValue = 100;

  return (
    <Card
      className="w-full border border-default-200 overflow-hidden"
      style={{ height: height || 400 }}
    >
      <div className="w-full h-full flex flex-col items-center justify-center relative p-4">
        <svg width={size} height={size} style={{ overflow: 'visible' }}>
          <defs>
            {radarConfigs.map((config) => {
              const color = colorMap[config.dataKey];
              return (
                <linearGradient
                  key={config.dataKey}
                  id={`gradient-${config.dataKey}`}
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={color} stopOpacity={config.fillOpacity || 0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={config.fillOpacity || 0.1} />
                </linearGradient>
              );
            })}
          </defs>

          {/* Grid circles */}
          {Array.from({ length: gridLevels }).map((_, level) => {
            const r = (radius * (level + 1)) / gridLevels;
            return (
              <circle
                key={level}
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke="#d1d5db"
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.3}
              />
            );
          })}

          {/* Grid lines */}
          {angles.map((angle, idx) => {
            const end = getPoint(angle, maxValue);
            return (
              <line
                key={idx}
                x1={center}
                y1={center}
                x2={end.x}
                y2={end.y}
                stroke="#d1d5db"
                strokeWidth={1}
                opacity={0.3}
              />
            );
          })}

          {/* Data polygons */}
          {radarConfigs.map((config) => {
            const values = chartData.map((item) => Number(item[config.dataKey]) || 0);
            const path = getPath(values, maxValue);
            const color = colorMap[config.dataKey];
            const fillOpacity = config.fillOpacity || 0.2;
            const strokeWidth = config.strokeWidth || 2;

            return (
              <g key={config.dataKey}>
                <path
                  d={path}
                  fill={`url(#gradient-${config.dataKey})`}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  opacity={fillOpacity > 0.2 ? 1 : fillOpacity}
                />
                <path d={path} fill="none" stroke={color} strokeWidth={strokeWidth} opacity={0.8} />
                {chartData.map((item, idx) => {
                  const val = Number(item[config.dataKey]) || 0;
                  const point = getPoint(angles[idx], val, maxValue);
                  return (
                    <circle
                      key={idx}
                      cx={point.x}
                      cy={point.y}
                      r={3}
                      fill={color}
                      stroke="#ffffff"
                      strokeWidth={1}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Labels */}
          {angles.map((angle, idx) => {
            const labelPoint = getPoint(angle, maxValue * 1.15);
            const subject = chartData[idx]?.subject || '';
            return (
              <text
                key={idx}
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={11}
                fontWeight={600}
                fill="#6b7280"
              >
                {subject}
              </text>
            );
          })}

          {/* Value labels on axes */}
          {Array.from({ length: gridLevels }).map((_, level) => {
            const value = ((level + 1) * maxValue) / gridLevels;
            return (
              <text
                key={level}
                x={center + 5}
                y={center - (radius * (level + 1)) / gridLevels}
                fontSize={9}
                fill="#6b7280"
                fontWeight={500}
              >
                {value}
              </text>
            );
          })}
        </svg>

        {/* Legend */}
        {showLegend && (
          <div className="flex flex-wrap justify-center gap-4 mt-4 pt-2">
            {radarConfigs.map((config) => {
              const color = colorMap[config.dataKey];
              return (
                <div key={config.dataKey} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs font-semibold text-default-500">{config.name}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

RadarChartComponent.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      subject: PropTypes.string,
      factor: PropTypes.string,
      name: PropTypes.string,
    }),
  ).isRequired,
  radarConfigs: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      dataKey: PropTypes.string.isRequired,
      stroke: PropTypes.string,
      fillOpacity: PropTypes.number,
      strokeWidth: PropTypes.number,
    }),
  ).isRequired,
  height: PropTypes.number,
  showLegend: PropTypes.bool,
  showTooltip: PropTypes.bool,
  isLoading: PropTypes.bool,
};

export default RadarChartComponent;
