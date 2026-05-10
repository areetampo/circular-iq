import { BarChart } from '@/components/charts';
import { Tilt3D } from '@/components/common';

function getLatencyColor(ms) {
  if (ms < 200) return 'var(--color-success)';
  if (ms < 500) return 'var(--color-warning)';
  return 'var(--color-error)';
}

// Custom tooltip that shows the value in the bar's actual color
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const color = getLatencyColor(value);
    return (
      <div className="rounded-md border border-(--color-border-strong) bg-(--color-bg-elevated) px-3 py-2 shadow-md backdrop-blur-sm">
        <p className="font-mono text-xs text-(--color-text-muted)">{label}</p>
        <p className="font-mono text-sm font-bold" style={{ color }}>
          {value}ms
        </p>
      </div>
    );
  }
  return null;
};

export default function EndpointLatencyBarChart({ history, endpoints }) {
  const data = endpoints
    .map((ep) => {
      const checks = history[ep.id] || [];
      const upChecks = checks.filter((c) => c.up && c.ms);
      const avg = upChecks.length
        ? upChecks.reduce((sum, c) => sum + c.ms, 0) / upChecks.length
        : 0;
      return { name: ep.label, avgLatency: Math.round(avg), barColor: getLatencyColor(avg) };
    })
    .filter((d) => !isNaN(d.avgLatency) && d.avgLatency > 0)
    .sort((a, b) => b.avgLatency - a.avgLatency);

  if (data.length === 0) return null;

  const barColors = data.map((item) => getLatencyColor(item.avgLatency));

  return (
    <Tilt3D
      rotateRange={{ x: 1, y: 1 }}
      block
      className="h-full rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-4"
    >
      <h3 className="mb-2 font-mono text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
        Avg Response Time by Endpoint (ms)
      </h3>
      <BarChart
        data={data}
        barConfigs={[{ dataKey: 'avgLatency', name: 'Response Time', fill: 'var(--color-accent)' }]}
        xAxisKey="name"
        height={280}
        showLegend={false}
        tickAngle={-30}
        tickAnchor="end"
        barColors={barColors}
        tooltipContent={<CustomTooltip />}
      />
    </Tilt3D>
  );
}
