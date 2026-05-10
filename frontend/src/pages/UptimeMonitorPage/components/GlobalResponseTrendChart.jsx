import { LineChart } from '@/components/charts';
import { Tilt3D } from '@/components/common';

export default function GlobalResponseTrendChart({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <Tilt3D
      rotateRange={{ x: 1, y: 1 }}
      block
      className="h-full rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-4"
    >
      <h3 className="mb-2 font-mono text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
        Global Avg Response Time (last 24h)
      </h3>
      <LineChart
        data={data}
        lines={[
          { dataKey: 'avgResponseTime', name: 'Response Time (ms)', color: 'var(--color-accent)' },
        ]}
        xAxisKey="hourLabel"
        height={220}
        showLegend={false}
      />
    </Tilt3D>
  );
}
