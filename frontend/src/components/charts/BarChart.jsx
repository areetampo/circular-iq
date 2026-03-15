import React from 'react';
import { BarChart as MuiBarChart } from '@mui/x-charts/BarChart';

export default function BarChart({
  data = [],
  barConfigs = [],
  height = 300,
  xAxisLabel,
  yAxisLabel,
  showLegend = true,
}) {
  if (!data.length || !barConfigs.length) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
        }}
      >
        No data available
      </div>
    );
  }

  const series = barConfigs.map((cfg) => ({
    dataKey: cfg.dataKey,
    label: cfg.name || cfg.dataKey,
    color: cfg.fill || cfg.color,
  }));

  return (
    <MuiBarChart
      dataset={data}
      xAxis={[{ scaleType: 'band', dataKey: 'value', label: xAxisLabel }]}
      series={series}
      height={height}
      slotProps={{ legend: { hidden: !showLegend } }}
    />
  );
}
