import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { CircularProgress, Typography, Paper, useTheme, Box } from '@mui/material';
import { BarChart as MuiBarChart } from '@mui/x-charts';

function BarChartComponent({
  data,
  barConfigs,
  height,
  showLegend,
  showGrid,
  yAxisDomain,
  xAxisLabel,
  yAxisLabel,
  isLoading,
  barColors,
}) {
  const theme = useTheme();

  const colorPalette = useMemo(
    () => [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.info.main,
    ],
    [theme],
  );

  const chartData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        name: item.name || item.factor || item.subject || 'Unknown',
      })),
    [data],
  );

  const series = useMemo(() => {
    const config = barConfigs[0];
    const dataKey = config?.dataKey ?? 'value';
    if (barColors && Array.isArray(barColors) && barColors.length >= chartData.length) {
      const dataset = chartData.map((row, rowIdx) => {
        const out = { name: row.name };
        chartData.forEach((_, colIdx) => {
          out[`_bar_${colIdx}`] = rowIdx === colIdx ? (Number(row[dataKey]) ?? 0) : 0;
        });
        return out;
      });
      return {
        useCustomDataset: true,
        dataset,
        series: chartData.map((d, idx) => ({
          dataKey: `_bar_${idx}`,
          label: idx === 0 ? config?.name || dataKey : '',
          color: barColors[idx % barColors.length],
          valueFormatter: (value) => (value != null && value > 0 ? `${value}` : ''),
        })),
      };
    }
    return {
      useCustomDataset: false,
      series: barConfigs.map((cfg, index) => ({
        dataKey: cfg.dataKey,
        label: cfg.name || cfg.dataKey,
        valueFormatter: (value) => (value !== null ? `${value}` : ''),
        color: cfg.fill ?? colorPalette[index % colorPalette.length],
      })),
    };
  }, [barConfigs, chartData, colorPalette, barColors]);

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
        p: { xs: 0.5, sm: 1, md: 2 },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ width: '100%', height: '100%', flexGrow: 1, minHeight: 0 }}>
        <MuiBarChart
          dataset={series.useCustomDataset ? series.dataset : chartData}
          series={series.series}
          xAxis={[
            {
              dataKey: 'name',
              scaleType: 'band',
              label: xAxisLabel,
              tickLabelStyle: {
                angle: -30,
                textAnchor: 'end',
                fontSize: 10,
              },
            },
          ]}
          yAxis={[
            {
              label: yAxisLabel,
              min: yAxisDomain?.[0] || 0,
              max: yAxisDomain?.[1] || 100,
              tickLabelStyle: {
                fontSize: 10,
              },
            },
          ]}
          margin={{
            top: 20,
            right: 5,
            bottom: xAxisLabel ? 70 : 50,
            left: yAxisLabel ? 60 : 45,
          }}
          slotProps={{
            legend: showLegend
              ? {
                  hidden: false,
                  position: { vertical: 'top', horizontal: 'right' },
                  labelStyle: {
                    fontSize: 11,
                    fontWeight: 600,
                  },
                  itemMarkWidth: 10,
                  itemMarkHeight: 10,
                  markGap: 5,
                  itemGap: 8,
                }
              : { hidden: true },
            bar: {
              clipPath: 'inset(0px round 4px 4px 0px 0px)',
            },
          }}
          sx={{
            '& .MuiChartsBar-label': {
              fontSize: 11,
              fontWeight: 600,
              fill: theme.palette.text.primary,
            },
          }}
          grid={showGrid ? { vertical: false, horizontal: true } : undefined}
          sx={{
            '& .MuiChartsAxis-line': {
              stroke: theme.palette.divider,
            },
            '& .MuiChartsAxis-tick': {
              stroke: theme.palette.divider,
            },
          }}
        />
      </Box>
    </Paper>
  );
}

BarChartComponent.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      factor: PropTypes.string,
      subject: PropTypes.string,
    }),
  ).isRequired,
  barConfigs: PropTypes.arrayOf(
    PropTypes.shape({
      dataKey: PropTypes.string.isRequired,
      name: PropTypes.string,
      useCustomColors: PropTypes.bool,
    }),
  ).isRequired,
  height: PropTypes.number,
  showLegend: PropTypes.bool,
  showGrid: PropTypes.bool,
  yAxisDomain: PropTypes.arrayOf(PropTypes.number),
  xAxisLabel: PropTypes.string,
  yAxisLabel: PropTypes.string,
  isLoading: PropTypes.bool,
  barColors: PropTypes.arrayOf(PropTypes.string),
};

BarChartComponent.defaultProps = {
  height: 400,
  showLegend: true,
  showGrid: true,
  yAxisDomain: [0, 100],
  xAxisLabel: '',
  yAxisLabel: '',
  isLoading: false,
  barColors: undefined,
};

export default BarChartComponent;
