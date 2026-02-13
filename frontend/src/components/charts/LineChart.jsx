import React, { useMemo } from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import { LineChart as MuiLineChart } from '@mui/x-charts/LineChart';

export default function LineChart({
  data,
  lines = [{ dataKey: 'value', stroke: '#2563eb', name: 'Value' }],
  xAxisKey = 'name',
  height = 300,
  area = false,
  margin = { top: 20, right: 24, bottom: 48, left: 56 },
}) {
  const theme = useTheme();

  const dataset = useMemo(() => data ?? [], [data]);
  const xAxisData = useMemo(
    () => (dataset.length ? dataset.map((row) => row[xAxisKey] ?? row.label ?? '') : []),
    [dataset, xAxisKey],
  );

  const series = useMemo(
    () =>
      (lines || [])
        .filter((line) => line && !line.band && line.dataKey)
        .map((line) => ({
          dataKey: line.dataKey,
          label: line.name ?? line.dataKey,
          color: line.stroke ?? theme.palette.primary.main,
          curve: 'monotoneX',
          showMark: line.dot !== false,
          area: line.area ?? area,
          valueFormatter: (value) => (value != null ? String(value) : ''),
        })),
    [lines, area, theme.palette.primary.main],
  );

  if (!data || data.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="body2" color="text.secondary">
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
        minWidth: 0,
        height,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        p: { xs: 0.5, sm: 1 },
        overflow: 'hidden',
      }}
    >
      <Box sx={{ width: '100%', height: '100%', minHeight: 0 }}>
        <MuiLineChart
          dataset={dataset}
          xAxis={[
            {
              dataKey: xAxisKey,
              scaleType: 'point',
              tickLabelStyle: { fontSize: 11, fill: theme.palette.text.secondary },
              valueFormatter: (v) => String(v ?? ''),
            },
          ]}
          yAxis={[
            {
              tickLabelStyle: { fontSize: 11, fill: theme.palette.text.secondary },
            },
          ]}
          series={series}
          height={height - 24}
          margin={margin}
          grid={{ vertical: false, horizontal: true }}
          slotProps={{
            legend: {
              hidden: false,
              direction: 'row',
              position: { vertical: 'top', horizontal: 'middle' },
              padding: 4,
              labelStyle: { fontSize: 12, fontWeight: 500 },
            },
          }}
          sx={{
            '& .MuiChartsAxis-line': { stroke: theme.palette.divider },
            '& .MuiChartsAxis-tick': { stroke: theme.palette.divider },
            '& .MuiAreaElement-root': {
              opacity: 0.6,
            },
            '& .MuiLineElement-root': {
              strokeWidth: 2.5,
            },
          }}
        />
      </Box>
    </Paper>
  );
}
