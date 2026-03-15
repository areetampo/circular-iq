import { PieChart as MuiPieChart } from '@mui/x-charts/PieChart';

export default function PieChart({
  data = [],
  dataKey = 'value',
  nameKey = 'value',
  height = 300,
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

  const seriesData = data.map((item, i) => ({
    id: i,
    value: typeof item[dataKey] === 'number' ? item[dataKey] : 0,
    label: item[nameKey] || `Item ${i + 1}`,
  }));

  return (
    <MuiPieChart
      series={[{ data: seriesData }]}
      height={height}
      slotProps={{ legend: { hidden: !showLegend } }}
    />
  );
}
