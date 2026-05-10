import PieChart from '@/components/charts/PieChart';
import { Tilt3D } from '@/components/common';

export default function HealthDistributionChart({ healthy, degraded, unhealthy, noData }) {
  const data = [
    { name: 'Healthy', value: healthy },
    { name: 'Degraded', value: degraded },
    { name: 'Unhealthy', value: unhealthy },
    { name: 'No Data', value: noData },
  ].filter((d) => d.value > 0);

  if (data.length === 0) return null;

  // Colors: success, warning, error, muted (for no data)
  const colors = [
    'var(--color-success)',
    'var(--color-warning)',
    'var(--color-error)',
    'var(--color-text-muted)',
  ];

  return (
    <Tilt3D
      rotateRange={{ x: 1, y: 1 }}
      block
      className="rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-4"
    >
      <h3 className="mb-2 font-mono text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
        Health Distribution
      </h3>
      <PieChart
        data={data}
        dataKey="value"
        nameKey="name"
        height={220}
        showLegend={true}
        colors={colors}
      />
    </Tilt3D>
  );
}
