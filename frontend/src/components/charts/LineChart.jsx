import { LineChart as MuiLineChart } from '@mui/x-charts/LineChart';

export default function LineChart({
  data = [],
  lines = [],
  height = 300,
  xAxisKey = 'label',
  showLegend = true,
  ariaLabel,
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
    dataKey: line.dataKey || line.id,
    label: line.name || line.dataKey || line.id,
    color: line.stroke || line.color,
    showMark: false,
  }));

  return (
    <div role="img" aria-label={ariaLabel}>
      <MuiLineChart
        dataset={data}
        xAxis={[{ scaleType: 'point', dataKey: xAxisKey }]}
        series={series}
        height={height}
        slotProps={{ legend: { hidden: !showLegend } }}
      />
    </div>
  );
}
