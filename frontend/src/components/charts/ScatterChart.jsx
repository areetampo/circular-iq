import { ScatterChart as MuiScatterChart } from '@mui/x-charts/ScatterChart';

export default function ScatterChart({
  data = [],
  xKey = 'x',
  yKey = 'y',
  height = 300,
  seriesLabel = 'Data',
  color,
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
    x: item[xKey] ?? 0,
    y: item[yKey] ?? 0,
  }));

  return (
    <MuiScatterChart series={[{ data: seriesData, label: seriesLabel, color }]} height={height} />
  );
}
