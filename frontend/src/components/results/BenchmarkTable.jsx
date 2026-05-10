import { Table } from '@heroui/react';
import PropTypes from 'prop-types';

import { Chip } from '@/components/common';
import { formatFactorName } from '@/lib/scoring';

const statusConfig = {
  below_average: { label: 'Needs Work', color: 'danger' },
  average: { label: 'On Track', color: 'default' },
  above_average: { label: 'Strong', color: 'success' },
};

export default function BenchmarkTable({ comparisons = {} }) {
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
    <div className="mt-2 overflow-x-auto">
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Benchmark comparison table">
            <Table.Header>
              <Table.Column isRowHeader className="px-4 py-3">
                Factor
              </Table.Column>
              <Table.Column className="p-3">Your Score</Table.Column>
              <Table.Column className="p-3">25th %ile</Table.Column>
              <Table.Column className="p-3">50th %ile</Table.Column>
              <Table.Column className="p-3">75th %ile</Table.Column>
              <Table.Column className="px-4 py-3">Status</Table.Column>
            </Table.Header>
            <Table.Body>
              {rows.map((row) => (
                <Table.Row key={row.factor}>
                  <Table.Cell className="font-medium">{row.displayName}</Table.Cell>
                  <Table.Cell>{row.userScore ?? '—'}</Table.Cell>
                  <Table.Cell>{row.p25 ?? '—'}</Table.Cell>
                  <Table.Cell>{row.p50 ?? '—'}</Table.Cell>
                  <Table.Cell>{row.p75 ?? '—'}</Table.Cell>
                  <Table.Cell>
                    <Chip
                      variant="info"
                      color={row.statusColor}
                      className={`${
                        row.status === 'above_average'
                          ? `border-(--color-success-border)! bg-(--color-success-soft-15)! text-(--color-success)!`
                          : ''
                      } ${
                        row.status === 'average'
                          ? `border-(--color-warning-border)! bg-(--color-warning-soft-15)! text-(--color-warning)!`
                          : ''
                      } ${
                        row.status === 'below_average'
                          ? `border-(--color-error-border)! bg-(--color-error-soft-15)! text-(--color-error)!`
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
  );
}

BenchmarkTable.propTypes = {
  comparisons: PropTypes.object,
};
