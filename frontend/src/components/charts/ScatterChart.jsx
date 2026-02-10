import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { CircularProgress, Typography, Paper, useTheme, Box } from '@mui/material';
import { ScatterChart as MuiScatterChart } from '@mui/x-charts';

function ScatterChartComponent({
  data,
  height,
  xAxisLabel,
  xDomain,
  yDomain,
  showGrid,
  isLoading,
}) {
  const theme = useTheme();

  const chartData = useMemo(() => data, [data]);

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
        <MuiScatterChart
          dataset={chartData}
          series={[
            {
              type: 'scatter',
              data: chartData,
              color: theme.palette.primary.main,
              markerSize: 6,
              valueFormatter: (value) =>
                value !== null ? `Score: ${value.x}, Index: ${value.y}` : '',
            },
          ]}
          xAxis={[
            {
              dataKey: 'x',
              min: xDomain?.[0] || 0,
              max: xDomain?.[1] || 100,
              label: xAxisLabel,
              tickLabelStyle: {
                fontSize: 10,
              },
            },
          ]}
          yAxis={[
            {
              dataKey: 'y',
              min: yDomain?.[0],
              max: yDomain?.[1],
              tickLabelStyle: {
                fontSize: 10,
              },
            },
          ]}
          margin={{
            top: 20,
            right: 5,
            bottom: xAxisLabel ? 55 : 40,
            left: 45,
          }}
          grid={showGrid ? { vertical: true, horizontal: true } : undefined}
          slotProps={{
            legend: { hidden: true },
          }}
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

ScatterChartComponent.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
    }),
  ).isRequired,
  height: PropTypes.number,
  xAxisLabel: PropTypes.string,
  xDomain: PropTypes.arrayOf(PropTypes.number),
  yDomain: PropTypes.arrayOf(PropTypes.number),
  showGrid: PropTypes.bool,
  isLoading: PropTypes.bool,
};

ScatterChartComponent.defaultProps = {
  height: 400,
  xAxisLabel: '',
  xDomain: [0, 100],
  yDomain: undefined,
  showGrid: true,
  isLoading: false,
};

export default ScatterChartComponent;
