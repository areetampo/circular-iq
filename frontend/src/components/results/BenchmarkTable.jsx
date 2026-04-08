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
      <div className="py-4 text-sm text-(--color-text-muted)">
        No benchmark comparisons available.
      </div>
    );
  }

  return (
    <>
      <div className="mt-2 overflow-x-auto rounded-xl border border-border bg-[rgba(250,248,245,0.5)]">
        <table className="custom-data-table w-full border-collapse">
          <thead>
            <tr className="bg-[rgba(220,200,175,0.4)]">
              <th className="border-b border-border px-4 py-3 text-left text-[0.7rem] font-semibold tracking-wider text-(--color-text-secondary) uppercase">
                Factor
              </th>
              {['Your Score', '25th %ile', '50th %ile', '75th %ile'].map((header) => (
                <th
                  key={header}
                  className="border-b border-border p-3 text-center text-[0.7rem] font-semibold tracking-wider text-(--color-text-secondary) uppercase"
                >
                  {header}
                </th>
              ))}
              <th className="border-b border-border px-4 py-3 text-center text-[0.7rem] font-semibold tracking-wider text-(--color-text-secondary) uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.factor}
                className={`${index % 2 === 1 ? 'bg-[rgba(180,160,130,0.05)]' : ''} transition-colors hover:bg-[rgba(200,180,150,0.2)]`}
              >
                <td className="border-b border-border/30 px-4 py-3 text-left text-sm font-medium text-(--color-text-primary)">
                  {row.displayName}
                </td>
                {['userScore', 'p25', 'p50', 'p75'].map((score) => (
                  <td
                    key={score}
                    className="border-b border-border/30 p-3 text-center text-sm text-(--color-text-primary)"
                  >
                    {row[score] ?? '—'}
                  </td>
                ))}
                <td className="border-b border-border/30 px-4 py-3 text-center">
                  <Chip
                    variant="info"
                    color={row.statusColor}
                    className={`${
                      row.status === 'above_average'
                        ? `border-[rgba(74,124,89,0.3)]! bg-[rgba(74,124,89,0.15)]! text-[#4a7c59]!`
                        : ''
                    } ${
                      row.status === 'average'
                        ? `border-[rgba(176,125,58,0.3)]! bg-[rgba(176,125,58,0.15)]! text-[#b07d3a]!`
                        : ''
                    } ${
                      row.status === 'below_average'
                        ? `border-[rgba(139,58,58,0.3)]! bg-[rgba(139,58,58,0.15)]! text-[#8b3a3a]!`
                        : ''
                    }`}
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
              <div className="mb-2 text-sm font-bold text-(--foreground)">
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
              <div className="mb-2 text-sm font-bold text-(--foreground)">Strengths</div>
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
