/**
 * Exports uptime history and aggregates to a downloadable metrics file.
 */

import { Tooltip } from '@heroui/react';
import { Download } from 'lucide-react';
import PropTypes from 'prop-types';
import { useState } from 'react';

import { Button } from '@/components/common';
import { FRONTEND_CONFIG } from '@/config/frontend.config';

import { ENDPOINTS } from '../constants';
import { fetchHistory } from '../utils/uptimeHelpers';

/**
 * Fetches the full history for every endpoint (up to the configured max) and
 * downloads the result as a timestamped CSV file.
 *
 * Rows are sorted oldest-first within each endpoint, matching the order
 * returned by {@link fetchHistory}.
 */
async function exportToCsv() {
  const limit = FRONTEND_CONFIG.uptime.maxHistoryPerEndpoint;

  const results = await Promise.all(
    ENDPOINTS.map((ep) => fetchHistory(ep.id, limit).then((checks) => ({ ep, checks }))),
  );

  const rows = [['endpoint', 'timestamp', 'up', 'responseTimeMs', 'status']];

  for (const { ep, checks } of results) {
    for (const check of checks) {
      rows.push([
        ep.id,
        new Date(check.ts).toISOString(),
        check.up,
        check.ms ?? '',
        check.status ?? '',
      ]);
    }
  }

  const csvContent = rows.map((row) => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `uptime_export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Button that fetches the full uptime check history for every endpoint and
 * downloads it as a CSV file. Disabled when there is no data to export.
 *
 */
export default function ExportMetricsButton({ hasNoData = true, ...props }) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    if (hasNoData || loading) return;
    setLoading(true);
    try {
      await exportToCsv();
    } catch (error) {
      logger.warn('[UPTIME:EXPORT_FAILED]', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Tooltip delay={0}>
      <Tooltip.Trigger tabIndex={0}>
        <Button
          {...props}
          variant="ghost"
          icon={Download}
          isDisabled={hasNoData || loading}
          isLoading={loading}
          onPress={handleExport}
        >
          {loading ? 'Exporting…' : 'Export CSV'}
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content>
        {hasNoData
          ? 'No data to export'
          : loading
            ? 'Fetching all endpoint history…'
            : `Download full metrics history as CSV (max ${FRONTEND_CONFIG.uptime.queryWindowDaysLimit} days)`}
      </Tooltip.Content>
    </Tooltip>
  );
}

ExportMetricsButton.propTypes = {
  /** Disables the button when there is nothing to export. */
  hasNoData: PropTypes.bool,
};
