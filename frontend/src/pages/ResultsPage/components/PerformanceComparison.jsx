import PropTypes from 'prop-types';

import RadarChart from '@/components/charts/RadarChart';
import { SectionHeading } from '@/components/common';

export function PerformanceComparison({ resolvedRadarData, radarConfigs, detailLoading }) {
  if (resolvedRadarData && resolvedRadarData.length > 0) {
    return (
      <div className="rounded-3xl border-2 border-(--color-border-ui) bg-transparent">
        <div className="p-1 sm:p-3">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <SectionHeading variant="large">Performance Comparison</SectionHeading>
              <p className="-mt-4 pl-2 text-sm text-(--color-text-muted)">
                How your idea compares to similar projects in the database
              </p>
            </div>
          </div>

          <div className="w-full rounded-3xl border-0 border-(--color-border-card) bg-(--color-bg-card-light) p-4">
            <RadarChart
              data={resolvedRadarData}
              radarConfigs={radarConfigs}
              height={440}
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
    <div className="rounded-3xl border border-(--color-border-ui) bg-transparent">
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
