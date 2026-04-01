import PropTypes from 'prop-types';

import { Chip } from '@/components/common';

export default function DerivedMetricsCard({ scoringResult }) {
  if (!scoringResult?.derived_metrics) return null;

  return (
    <div className="border-t border-(--color-border) pt-8 mt-8">
      <h3 className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-6">
        Derived Metrics
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { key: 'technical_feasibility', label: 'Technical Feasibility' },
          { key: 'economic_viability', label: 'Economic Viability' },
          { key: 'circularity_potential', label: 'Circularity Potential' },
        ].map(({ key, label }) => (
          <div key={key} className="p-4 rounded-lg border border-(--color-border)">
            <p className="text-xs uppercase tracking-wide text-(--color-text-muted) mb-1">
              {label}
            </p>
            <p className="font-mono text-base font-medium text-(--color-text-primary)">
              {scoringResult.derived_metrics[key] ?? 'N/A'}
            </p>
          </div>
        ))}
        <div className="p-4 rounded-lg border border-(--color-border)">
          <p className="text-xs uppercase tracking-wide text-(--color-text-muted) mb-1">
            Risk Level
          </p>
          <Chip variant="score" className="text-xs font-bold">
            {scoringResult.derived_metrics.risk_level?.toUpperCase() || 'UNKNOWN'}
          </Chip>
        </div>
      </div>
    </div>
  );
}

DerivedMetricsCard.propTypes = {
  scoringResult: PropTypes.object.isRequired,
};
