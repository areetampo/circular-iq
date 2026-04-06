import PropTypes from 'prop-types';

import { Chip } from '@/components/common';

function formatFactorName(factor) {
  return factor
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const statusConfig = {
  below_average: { label: 'Needs Work', color: 'danger' },
  average: { label: 'On Track', color: 'default' },
  above_average: { label: 'Strong', color: 'success' },
};

export default function BenchmarkTable({ comparisons = {}, opportunities = [], strengths = [] }) {
  const rows = Object.entries(comparisons || {}).map(([factor, data]) => {
    const status = data.status || 'average';
    const config = statusConfig[status] || statusConfig.average;
    return {
      factor,
      displayName: formatFactorName(factor),
      userScore: data.userScore,
      p25: data.p25,
      p50: data.p50,
      p75: data.p75,
      status,
      statusLabel: config.label,
      statusColor: config.color,
    };
  });

  if (rows.length === 0) {
    return (
      <div className="text-sm text-(--color-text-muted) py-4">
        No benchmark comparisons available.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto mt-2 rounded-xl border border-(--color-border) bg-[rgba(250,248,245,0.5)]">
        <table className="custom-data-table w-full border-collapse">
          <thead>
            <tr className="bg-[rgba(220,200,175,0.4)]">
              <th className="text-left py-3 px-4 text-[0.7rem] font-semibold text-(--color-text-secondary) uppercase tracking-wider border-b border-(--color-border)">
                Factor
              </th>
              <th className="text-center py-3 px-3 text-[0.7rem] font-semibold text-(--color-text-secondary) uppercase tracking-wider border-b border-(--color-border)">
                Your Score
              </th>
              <th className="text-center py-3 px-3 text-[0.7rem] font-semibold text-(--color-text-secondary) uppercase tracking-wider border-b border-(--color-border)">
                25th %ile
              </th>
              <th className="text-center py-3 px-3 text-[0.7rem] font-semibold text-(--color-text-secondary) uppercase tracking-wider border-b border-(--color-border)">
                50th %ile
              </th>
              <th className="text-center py-3 px-3 text-[0.7rem] font-semibold text-(--color-text-secondary) uppercase tracking-wider border-b border-(--color-border)">
                75th %ile
              </th>
              <th className="text-center py-3 px-4 text-[0.7rem] font-semibold text-(--color-text-secondary) uppercase tracking-wider border-b border-(--color-border)">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.factor}
                className={`${index % 2 === 1 ? 'bg-[rgba(180,160,130,0.05)]' : ''} hover:bg-[rgba(200,180,150,0.2)] transition-colors`}
              >
                <td className="text-left py-3 px-4 text-sm font-medium text-(--color-text-primary) border-b border-(--color-border) border-opacity-30">
                  {row.displayName}
                </td>
                <td className="text-center py-3 px-3 text-sm text-(--color-text-primary) border-b border-(--color-border) border-opacity-30">
                  {row.userScore ?? '—'}
                </td>
                <td className="text-center py-3 px-3 text-sm text-(--color-text-primary) border-b border-(--color-border) border-opacity-30">
                  {row.p25 ?? '—'}
                </td>
                <td className="text-center py-3 px-3 text-sm text-(--color-text-primary) border-b border-(--color-border) border-opacity-30">
                  {row.p50 ?? '—'}
                </td>
                <td className="text-center py-3 px-3 text-sm text-(--color-text-primary) border-b border-(--color-border) border-opacity-30">
                  {row.p75 ?? '—'}
                </td>
                <td className="text-center py-3 px-4 border-b border-(--color-border) border-opacity-30">
                  <Chip
                    variant="info"
                    color={row.statusColor}
                    className={`
                      ${row.status === 'above_average' ? '!bg-[rgba(74,124,89,0.15)] !text-[#4a7c59] !border-[rgba(74,124,89,0.3)]' : ''}
                      ${row.status === 'average' ? '!bg-[rgba(176,125,58,0.15)] !text-[#b07d3a] !border-[rgba(176,125,58,0.3)]' : ''}
                      ${row.status === 'below_average' ? '!bg-[rgba(139,58,58,0.15)] !text-[#8b3a3a] !border-[rgba(139,58,58,0.3)]' : ''}
                    `}
                  >
                    {row.statusLabel}
                  </Chip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(opportunities?.length > 0 || strengths?.length > 0) && (
        <div className="mt-4">
          {opportunities?.length > 0 && (
            <div className="mb-3">
              <div
                className="text-sm font-bold mb-2"
                style={{
                  color: 'var(--foreground)',
                }}
              >
                Opportunities to Improve
              </div>
              <div className="flex flex-wrap gap-2">
                {opportunities.map((text) => (
                  <Chip key={text} variant="status" color="warning">
                    {text}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {strengths?.length > 0 && (
            <div>
              <div
                className="text-sm font-bold mb-2"
                style={{
                  color: 'var(--foreground)',
                }}
              >
                Strengths
              </div>
              <div className="flex flex-wrap gap-2">
                {strengths.map((text) => (
                  <Chip key={text} variant="status" color="success">
                    {text}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

BenchmarkTable.propTypes = {
  comparisons: PropTypes.object,
  opportunities: PropTypes.arrayOf(PropTypes.string),
  strengths: PropTypes.arrayOf(PropTypes.string),
};
