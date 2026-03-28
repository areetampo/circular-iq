import { Chip, Table } from '@heroui/react';
import PropTypes from 'prop-types';

function formatFactorName(factor) {
  return factor
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const statusConfig = {
  below_average: { label: 'Needs Work', color: 'error', bg: 'var(--danger-soft)' },
  average: { label: 'On Track', color: 'default', bg: 'var(--surface)' },
  above_average: { label: 'Strong', color: 'success', bg: 'var(--success-soft)' },
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
      statusBg: config.bg,
      statusColor: config.color,
    };
  });

  return (
    <>
      <Table className="mt-2">
        <Table.ScrollContainer>
          <Table.Content aria-label="Benchmark comparisons">
            <Table.Header>
              <Table.Column isRowHeader>Factor</Table.Column>
              <Table.Column>Your Score</Table.Column>
              <Table.Column>25th %ile</Table.Column>
              <Table.Column>50th %ile</Table.Column>
              <Table.Column>75th %ile</Table.Column>
              <Table.Column>Status</Table.Column>
            </Table.Header>
            <Table.Body>
              {rows.map((row) => (
                <Table.Row key={row.factor}>
                  <Table.Cell>{row.displayName}</Table.Cell>
                  <Table.Cell>{row.userScore ?? '—'}</Table.Cell>
                  <Table.Cell>{row.p25 ?? '—'}</Table.Cell>
                  <Table.Cell>{row.p50 ?? '—'}</Table.Cell>
                  <Table.Cell>{row.p75 ?? '—'}</Table.Cell>
                  <Table.Cell>
                    <Chip color={row.statusColor} size="sm">
                      {row.statusLabel}
                    </Chip>
                  </Table.Cell>
                </Table.Row>
              ))}
              {rows.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={6}>No benchmark comparisons available.</Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      {(opportunities?.length > 0 || strengths?.length > 0) && (
        <div className="mt-4">
          {opportunities?.length > 0 && (
            <div className="mb-3">
              <div
                className="text-sm font-bold mb-1"
                style={{
                  color: 'var(--foreground)',
                }}
              >
                Opportunities to Improve
              </div>
              <div className="flex flex-wrap gap-2">
                {opportunities.map((text) => (
                  <Chip key={text} color="warning" size="sm">
                    {text}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {strengths?.length > 0 && (
            <div>
              <div
                className="text-sm font-bold mb-1"
                style={{
                  color: 'var(--foreground)',
                }}
              >
                Strengths
              </div>
              <div className="flex flex-wrap gap-2">
                {strengths.map((text) => (
                  <Chip key={text} color="success" size="sm">
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
