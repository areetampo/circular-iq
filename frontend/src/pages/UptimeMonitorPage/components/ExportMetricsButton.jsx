import { Tooltip } from '@heroui/react';
import { Download } from 'lucide-react';
import PropTypes from 'prop-types';

import { Button } from '@/components/common';

/**
 * ExportMetricsButton - A button component for exporting uptime metrics as CSV
 * Downloads all stored metrics data in CSV format
 *
 * @param {Object} props - Component props
 * @param {Object} props.history - History object mapping endpoint IDs to check arrays
 * @param {Array} props.endpoints - Array of endpoint configuration objects
 * @param {boolean} [props.hasNoData=false] - Whether there is no data to export
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element} Rendered ExportMetricsButton
 *
 * @example
 * Basic usage
 * <ExportMetricsButton history={uptimeHistory} endpoints={endpointList} />
 *
 * @example
 * With no data state
 * <ExportMetricsButton history={{}} endpoints={[]} hasNoData={true} />
 */
export default function ExportMetricsButton({ history, endpoints, hasNoData = false, ...props }) {
  const handleExport = () => {
    const data = [];
    for (const ep of endpoints) {
      const checks = history[ep.id] || [];
      for (const check of checks) {
        data.push({
          endpoint: ep.id,
          timestamp: new Date(check.ts).toISOString(),
          up: check.up,
          responseTimeMs: check.ms,
          status: check.status,
        });
      }
    }
    const csvRows = [
      ['endpoint', 'timestamp', 'up', 'responseTimeMs', 'status'],
      ...data.map((row) => [row.endpoint, row.timestamp, row.up, row.responseTimeMs, row.status]),
    ];
    const csvContent = csvRows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uptime_export_${new Date().toISOString().slice(0, 19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Tooltip delay={0}>
      <Tooltip.Trigger>
        <Button
          variant="ghost"
          icon={Download}
          onPress={hasNoData ? undefined : handleExport}
          isDisabled={hasNoData}
          {...props}
        >
          Export CSV
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content>
        {hasNoData ? 'No data to export' : 'Download all stored metrics as CSV"'}
      </Tooltip.Content>
    </Tooltip>
  );
}

ExportMetricsButton.propTypes = {
  /** History object mapping endpoint IDs to check arrays */
  history: PropTypes.object.isRequired,
  /** Array of endpoint configuration objects */
  endpoints: PropTypes.array.isRequired,
  /** Whether there is no data to export */
  hasNoData: PropTypes.bool,
};
