import React from 'react';
import { BarChart as MuiBarChart } from '@mui/x-charts/BarChart';

export default function ComboChart({
  data = [],
  barConfigs = [],
  lineConfigs = [],
  height = 300,
  xAxisKey = 'label',
  showLegend = true,
}) {
  if (!data.length) {
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

  const series = [
    ...barConfigs.map((cfg) => ({
      type: 'bar',
      dataKey: cfg.dataKey,
      label: cfg.name || cfg.dataKey,
      color: cfg.fill || cfg.color,
    })),
    ...lineConfigs.map((cfg) => ({
      type: 'line',
      dataKey: cfg.dataKey,
      label: cfg.name || cfg.dataKey,
      color: cfg.stroke || cfg.color,
      showMark: false,
    })),
  ];

  return (
    <MuiBarChart
      dataset={data}
      xAxis={[{ scaleType: 'band', dataKey: xAxisKey }]}
      series={series}
      height={height}
      slotProps={{ legend: { hidden: !showLegend } }}
    />
  );
}
