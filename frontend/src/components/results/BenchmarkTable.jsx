import React from 'react';
import PropTypes from 'prop-types';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';

function formatFactorName(factor) {
  return factor
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const statusConfig = {
  below_average: { label: 'Needs Work', color: 'error', bg: 'rgba(244, 67, 54, 0.08)' },
  average: { label: 'On Track', color: 'default', bg: 'rgba(120, 144, 156, 0.08)' },
  above_average: { label: 'Strong', color: 'success', bg: 'rgba(46, 125, 50, 0.08)' },
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
      <TableContainer component={Paper} elevation={0} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Factor</TableCell>
              <TableCell align="right">Your Score</TableCell>
              <TableCell align="right">25th %ile</TableCell>
              <TableCell align="right">50th %ile</TableCell>
              <TableCell align="right">75th %ile</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.factor}
                sx={{ backgroundColor: row.statusBg || 'transparent' }}
              >
                <TableCell component="th" scope="row">
                  {row.displayName}
                </TableCell>
                <TableCell align="right">{row.userScore ?? '—'}</TableCell>
                <TableCell align="right">{row.p25 ?? '—'}</TableCell>
                <TableCell align="right">{row.p50 ?? '—'}</TableCell>
                <TableCell align="right">{row.p75 ?? '—'}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={row.statusLabel}
                    color={row.statusColor}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No benchmark comparisons available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {(opportunities?.length > 0 || strengths?.length > 0) && (
        <div className="mt-4">
          {opportunities?.length > 0 && (
            <div className="mb-3">
              <div className="text-sm font-bold text-slate-900 mb-1">Opportunities to Improve</div>
              <div className="flex flex-wrap gap-2">
                {opportunities.map((text) => (
                  <Chip key={text} label={text} color="warning" size="small" />
                ))}
              </div>
            </div>
          )}

          {strengths?.length > 0 && (
            <div>
              <div className="text-sm font-bold text-slate-900 mb-1">Strengths</div>
              <div className="flex flex-wrap gap-2">
                {strengths.map((text) => (
                  <Chip key={text} label={text} color="success" size="small" />
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
