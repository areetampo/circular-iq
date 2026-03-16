import { ProgressCircle } from '@heroui/react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';

function RadarChartComponent({ data, radarConfigs, height, showLegend, showTooltip, isLoading }) {
  const theme = useTheme();

  const chartData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        subject: item.subject || item.factor || item.name || 'Unknown',
      })),
    [data],
  );

  const colorMap = useMemo(() => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.info.main,
    ];
    return radarConfigs.reduce((acc, config, i) => {
      acc[config.dataKey] = config.stroke || colors[i % colors.length];
      return acc;
    }, {});
  }, [radarConfigs, theme]);

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
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: height || 400,
          width: '100%',
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <ProgressCircle size="lg" />
      </Paper>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: height || 400,
          width: '100%',
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography color="text.secondary" variant="body2">
          No data available
        </Typography>
      </Paper>
    );
  }

  const { size, center, radius } = dimensions;
  const gridLevels = 5;
  const maxValue = 100;

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        minWidth: 0,
        height: height || 400,
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        p: { xs: 1, sm: 1.5, md: 2 },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
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
                stroke={theme.palette.divider}
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
                stroke={theme.palette.divider}
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
                      stroke={theme.palette.background.paper}
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
                fill={theme.palette.text.secondary}
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
                fill={theme.palette.text.secondary}
                fontWeight={500}
              >
                {value}
              </text>
            );
          })}
        </svg>

        {/* Legend */}
        {showLegend && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 2,
              mt: 2,
              pt: 1,
            }}
          >
            {radarConfigs.map((config) => {
              const color = colorMap[config.dataKey];
              return (
                <Box key={config.dataKey} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: color,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}
                  >
                    {config.name}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Paper>
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

RadarChartComponent.defaultProps = {
  height: 400,
  showLegend: true,
  showTooltip: true,
  isLoading: false,
};

export default RadarChartComponent;
