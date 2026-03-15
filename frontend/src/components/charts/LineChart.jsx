import React from 'react';
import { LineChart as MuiLineChart } from '@mui/x-charts/LineChart';

export default function LineChart({
  data = [],
  lines = [],
  height = 300,
  xAxisKey = 'label',
  showLegend = true,
}) {
  if (!data.length || !lines.length) {
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

  const series = lines.map((line) => ({
    dataKey: line.dataKey,
    label: line.name || line.dataKey,
    color: line.stroke || line.color,
    showMark: false,
  }));

  return (
    <MuiLineChart
      dataset={data}
      xAxis={[{ scaleType: 'point', dataKey: xAxisKey }]}
      series={series}
      height={height}
      slotProps={{ legend: { hidden: !showLegend } }}
    />
  );
}
