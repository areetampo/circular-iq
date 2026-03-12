import React, { useMemo } from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import { BarChart as MuiBarChart } from '@mui/x-charts/BarChart';
import { LineChart as MuiLineChart } from '@mui/x-charts/LineChart';

const DEFAULT_BAR_COLORS = ['#2563eb', '#059669', '#f97316', '#8b5cf6', '#ef4444', '#f59e0b'];

export default function ComboChart({
  data,
  bars = [],
  lines = [],
  xAxisKey = 'name',
  height = 300,
  leftYAxisKey = null,
  rightYAxisKey = null,
  barColors = null,
}) {
  const theme = useTheme();
  const hasDualAxis = leftYAxisKey && rightYAxisKey;

  const colors = useMemo(() => barColors ?? DEFAULT_BAR_COLORS, [barColors]);

  const { barDataset, barSeries, lineDataset, lineSeries } = useMemo(() => {
    if (!data || !data.length) {
      return { barDataset: [], barSeries: [], lineDataset: [], lineSeries: [] };
    }

    const barDataKey = bars[0]?.dataKey ?? 'value';
    const lineDataKeys = (lines || []).map((l) => l.dataKey);

    if (hasDualAxis && barColors && barColors.length >= data.length) {
      const barDataset = data.map((row, rowIdx) => {
        const out = { [xAxisKey]: row[xAxisKey] ?? row.name };
        data.forEach((_, colIdx) => {
          out[`_bar_${colIdx}`] = rowIdx === colIdx ? (Number(row[barDataKey]) ?? 0) : 0;
        });
        return out;
      });
      const barSeries = data.map((d, idx) => ({
        dataKey: `_bar_${idx}`,
        label: idx === 0 ? (bars[0]?.name ?? 'Count') : '',
        color: barColors[idx % barColors.length],
        valueFormatter: (v) => (v != null && v > 0 ? String(v) : ''),
      }));
      const lineDataset = data;
      const lineSeries = (lines || []).map((line, idx) => ({
        dataKey: line.dataKey,
        label: line.name ?? line.dataKey,
        color: line.stroke ?? theme.palette.secondary.main,
        curve: 'monotoneX',
        showMark: true,
        valueFormatter: (v) => (v != null ? String(Number(v).toFixed(0)) : ''),
      }));
      return { barDataset, barSeries, lineDataset, lineSeries };
    }

    const barDataset = data;
    const barSeries = (bars || []).map((bar, idx) => ({
      dataKey: bar.dataKey,
      label: bar.name ?? bar.dataKey,
      color: bar.fill ?? colors[idx % colors.length],
      valueFormatter: (v) => (v != null ? String(v) : ''),
    }));
    const lineDataset = data;
    const lineSeries = (lines || []).map((line) => ({
      dataKey: line.dataKey,
      label: line.name ?? line.dataKey,
      color: line.stroke ?? theme.palette.secondary.main,
      curve: 'monotoneX',
      showMark: true,
      valueFormatter: (v) => (v != null ? String(Number(v).toFixed(0)) : ''),
    }));
    return { barDataset, barSeries, lineDataset, lineSeries };
  }, [data, bars, lines, xAxisKey, hasDualAxis, barColors, colors, theme.palette.secondary.main]);

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

  const barHeight = hasDualAxis && lineSeries.length > 0 ? Math.floor(height * 0.55) : height - 32;
  const lineHeight = height - barHeight - 16;

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        minWidth: 0,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        p: 1,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ width: '100%', minHeight: 0 }}>
        <Box sx={{ width: '100%', height: barHeight }}>
          <MuiBarChart
            dataset={barDataset}
            series={barSeries}
            xAxis={[
              {
                dataKey: xAxisKey,
                scaleType: 'band',
                tickLabelStyle: { fontSize: 11, fill: theme.palette.text.secondary },
                tickPlacement: 'middle',
              },
            ]}
            yAxis={[
              {
                tickLabelStyle: { fontSize: 11, fill: theme.palette.text.secondary },
              },
            ]}
            height={barHeight - 24}
            margin={{ top: 20, right: 16, bottom: 44, left: 44 }}
            slotProps={{
              legend: { hidden: true },
            }}
            grid={{ vertical: false, horizontal: true }}
            sx={{
              '& .MuiChartsAxis-line': { stroke: theme.palette.divider },
              '& .MuiChartsAxis-tick': { stroke: theme.palette.divider },
              '& .MuiChartsBar-label': { fontSize: 11, fontWeight: 600 },
            }}
          />
        </Box>
        {hasDualAxis && lineSeries.length > 0 && (
          <Box sx={{ width: '100%', height: lineHeight, mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Avg Score
            </Typography>
            <MuiLineChart
              dataset={lineDataset}
              xAxis={[{ dataKey: xAxisKey, scaleType: 'point', tickLabelStyle: { fontSize: 10 } }]}
              yAxis={[{ min: 0, max: 100, tickLabelStyle: { fontSize: 10 } }]}
              series={lineSeries}
              height={lineHeight - 28}
              margin={{ top: 8, right: 16, bottom: 28, left: 36 }}
              grid={{ vertical: false, horizontal: true }}
              slotProps={{ legend: { hidden: true } }}
              sx={{
                '& .MuiChartsAxis-line': { stroke: theme.palette.divider },
                '& .MuiChartsAxis-tick': { stroke: theme.palette.divider },
              }}
            />
          </Box>
        )}
      </Box>
    </Paper>
  );
}
