import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CircularProgress, Typography, Paper, useTheme } from '@mui/material';

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
        <CircularProgress size={48} />
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
        <Typography color="textSecondary" variant="body2">
          No data available
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        height: height || 400,
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        p: { xs: 1, sm: 1.5, md: 2 },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart
          data={chartData}
          margin={{
            top: 10,
            right: 20,
            bottom: 10,
            left: 20,
          }}
        >
          <PolarGrid
            stroke={theme.palette.divider}
            strokeDasharray="3 3"
            fill={theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}
          />
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: theme.palette.text.secondary,
              fontSize: 10,
              fontWeight: 600,
            }}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{
              fontSize: 9,
              fill: theme.palette.text.secondary,
              fontWeight: 500,
            }}
            tickCount={5}
            axisLine={false}
          />

          {showTooltip && (
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: theme.spacing(1),
                boxShadow: theme.shadows[4],
                fontSize: 12,
              }}
              labelStyle={{
                color: theme.palette.text.primary,
                fontSize: 12,
                fontWeight: 600,
              }}
              cursor={false}
              itemStyle={{
                color: theme.palette.text.secondary,
                fontSize: 11,
              }}
            />
          )}

          {radarConfigs.map((config) => (
            <Radar
              key={config.dataKey}
              name={config.name}
              dataKey={config.dataKey}
              stroke={colorMap[config.dataKey]}
              fill={colorMap[config.dataKey]}
              fillOpacity={config.fillOpacity || 0.2}
              strokeWidth={config.strokeWidth || 2}
              dot={{
                fill: colorMap[config.dataKey],
                r: 3,
                strokeWidth: 0,
              }}
              activeDot={{
                r: 5,
                strokeWidth: 2,
                stroke: colorMap[config.dataKey],
              }}
            />
          ))}

          {showLegend && (
            <Legend
              wrapperStyle={{
                paddingTop: theme.spacing(1),
                fontSize: '12px',
                fontWeight: '600',
                color: theme.palette.text.secondary,
              }}
              iconType="circle"
              verticalAlign="bottom"
              height={32}
            />
          )}
        </RechartsRadarChart>
      </ResponsiveContainer>
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
