import PropTypes from 'prop-types';

import { Chip } from '@/components/common';

export default function DerivedMetricsCard({ scoringResult }) {
  if (!scoringResult?.derived_metrics) return null;

  return (
    <div
      className="shadow-sm rounded-xl"
      style={{
        border: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
      }}
    >
      <div className="p-4">
        <h3
          className="text-lg font-bold mb-4"
          style={{
            color: 'var(--foreground)',
          }}
        >
          Derived Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { key: 'technical_feasibility', label: 'Technical Feasibility' },
            { key: 'economic_viability', label: 'Economic Viability' },
            { key: 'circularity_potential', label: 'Circularity Potential' },
          ].map(({ key, label }) => (
            <div
              key={key}
              className="p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--accent-soft)',
                border: '1px solid var(--border)',
              }}
            >
              <p
                className="text-xs mb-1"
                style={{
                  color: 'var(--muted)',
                }}
              >
                {label}
              </p>
              <p
                className="text-2xl font-bold"
                style={{
                  color: 'var(--foreground)',
                }}
              >
                {scoringResult.derived_metrics[key] ?? 'N/A'}
              </p>
            </div>
          ))}
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'var(--accent-soft)',
              border: '1px solid var(--border)',
            }}
          >
            <p
              className="text-xs mb-1"
              style={{
                color: 'var(--muted)',
              }}
            >
              Risk Level
            </p>
            <Chip
              variant="default"
              className="text-xs font-bold"
              style={{
                color:
                  scoringResult.derived_metrics.risk_level === 'low'
                    ? 'var(--success)'
                    : scoringResult.derived_metrics.risk_level === 'medium'
                      ? 'var(--warning)'
                      : 'var(--danger)',
              }}
            >
              {scoringResult.derived_metrics.risk_level?.toUpperCase() || 'UNKNOWN'}
            </Chip>
          </div>
        </div>
      </div>
    </div>
  );
}

DerivedMetricsCard.propTypes = {
  scoringResult: PropTypes.object.isRequired,
};
