import { Table } from '@heroui/react';
import { MoveDown, MoveUp } from 'lucide-react';
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
      <div className="mt-2 overflow-x-auto">
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Benchmark comparison table">
              <Table.Header>
                <Table.Column className="px-4 py-3">Factor</Table.Column>
                <Table.Column className="p-3 text-center">Your Score</Table.Column>
                <Table.Column className="p-3 text-center">25th %ile</Table.Column>
                <Table.Column className="p-3 text-center">50th %ile</Table.Column>
                <Table.Column className="p-3 text-center">75th %ile</Table.Column>
                <Table.Column className="px-4 py-3 text-center">Status</Table.Column>
              </Table.Header>
              <Table.Body>
                {rows.map((row) => (
                  <Table.Row key={row.factor}>
                    <Table.Cell className="font-medium">{row.displayName}</Table.Cell>
                    <Table.Cell className="text-center">{row.userScore ?? '—'}</Table.Cell>
                    <Table.Cell className="text-center">{row.p25 ?? '—'}</Table.Cell>
                    <Table.Cell className="text-center">{row.p50 ?? '—'}</Table.Cell>
                    <Table.Cell className="text-center">{row.p75 ?? '—'}</Table.Cell>
                    <Table.Cell className="text-center">
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
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </div>

      {(opportunities?.length > 0 || strengths?.length > 0) && (
        <div className="mt-8">
          {opportunities?.length > 0 && (
            <div className="mb-3">
              <div className="mb-2 text-sm font-medium text-(--foreground)">
                Opportunities to Improve
              </div>
              <div className="flex flex-wrap gap-2">
                {opportunities.map((text) => (
                  <Chip key={text} variant="status" color="warning">
                    <MoveUp size={14} />
                    <span>{text}</span>
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
                    <MoveDown size={14} />
                    <span>{text}</span>
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
