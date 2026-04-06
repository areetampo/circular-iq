import PropTypes from 'prop-types';

import RadarChart from '@/components/charts/RadarChart';
import { SectionHeading } from '@/components/common/SectionHeading';

export function PerformanceComparison({ resolvedRadarData, radarConfigs, detailLoading }) {
  if (resolvedRadarData && resolvedRadarData.length > 0) {
    return (
      <div className="border-2 border-[rgba(180,160,130,0.25)] rounded-3xl bg-transparent">
        <div className="p-1 sm:p-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <SectionHeading variant="large">Performance Comparison</SectionHeading>
              <p className="text-sm text-(--color-text-muted) -mt-4">
                How your idea compares to similar projects in the database
              </p>
            </div>
          </div>

          <div
            className="w-full rounded-3xl p-4 bg-[rgba(245,240,232,0.5)] border-0 border-[rgba(180,160,130,0.18)]"
            style={{
              '--color-userValue': 'var(--success)',
              '--color-marketAvg': 'var(--accent)',
            }}
          >
            <RadarChart
              data={resolvedRadarData}
              radarConfigs={radarConfigs}
              height={380}
              showLegend={true}
              showTooltip={true}
              isLoading={detailLoading}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[rgba(180,160,130,0.25)] rounded-3xl bg-transparent">
      <div className="p-5 sm:p-6">
        <SectionHeading variant="large">Performance Comparison</SectionHeading>
        <p className="text-sm text-(--color-text-muted)">
          No comparison data available. Check that sub-scores are present in the assessment result.
        </p>
      </div>
    </div>
  );
}

PerformanceComparison.propTypes = {
  resolvedRadarData: PropTypes.array,
  radarConfigs: PropTypes.object,
  detailLoading: PropTypes.bool,
};

export default PerformanceComparison;
