import PropTypes from 'prop-types';

import PieChart from '@/components/charts/PieChart';
import { Tilt3D } from '@/components/common';

/**
 * HealthDistributionChart - A pie chart showing health status distribution
 * Displays the distribution of healthy, degraded, unhealthy, and no data states
 *
 * @param {Object} props - Component props
 * @param {number} props.healthy - Number of healthy endpoints
 * @param {number} props.degraded - Number of degraded endpoints
 * @param {number} props.unhealthy - Number of unhealthy endpoints
 * @param {number} props.noData - Number of endpoints with no data
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element|null} Rendered HealthDistributionChart or null if no data
 *
 * @example
 * Basic usage
 * <HealthDistributionChart healthy={8} degraded={2} unhealthy={1} noData={0} />
 *
 * @example
 * With no data
 * <HealthDistributionChart healthy={0} degraded={0} unhealthy={0} noData={0} />
 */
export default function HealthDistributionChart({
  healthy,
  degraded,
  unhealthy,
  noData,
  ...props
}) {
  const data = [
    { name: 'Healthy', value: healthy },
    { name: 'Degraded', value: degraded },
    { name: 'Unhealthy', value: unhealthy },
    { name: 'No Data', value: noData },
  ].filter((d) => d.value > 0);

  const hasAnyData = healthy + degraded + unhealthy + noData > 0;

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
      {...props}
    >
      <h3 className="mb-2 font-mono text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
        Health Distribution
      </h3>
      {!hasAnyData ? (
        <div className="flex h-55 items-center justify-center text-sm text-(--color-text-muted)">
          No data available
        </div>
      ) : (
        <PieChart
          data={data}
          dataKey="value"
          nameKey="name"
          height={220}
          showLegend={true}
          colors={colors}
        />
      )}
    </Tilt3D>
  );
}

HealthDistributionChart.propTypes = {
  /** Number of healthy endpoints */
  healthy: PropTypes.number.isRequired,
  /** Number of degraded endpoints */
  degraded: PropTypes.number.isRequired,
  /** Number of unhealthy endpoints */
  unhealthy: PropTypes.number.isRequired,
  /** Number of endpoints with no data */
  noData: PropTypes.number.isRequired,
};
