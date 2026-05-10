import { Tooltip } from '@heroui/react';
import { Download } from 'lucide-react';

import { Button } from '@/components/common';

export default function ExportMetricsButton({ history, endpoints, hasNoData = false }) {
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
          onPress={hasNoData ? undefined : handleExport}
          isDisabled={hasNoData}
        >
          <Download size={14} />
          Export CSV
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content>{hasNoData ? 'No data to export' : 'Export metrics as CSV'}</Tooltip.Content>
    </Tooltip>
  );
}
