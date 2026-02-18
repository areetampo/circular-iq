import React from 'react';
import PropTypes from 'prop-types';
import { Download, FileText } from 'lucide-react';
import LoaderIcon from '@/components/common/LoaderIcon';
import { Tooltip } from '@heroui/react';
import { Button } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';

/**
 * ExportActions Component
 * Renders export buttons for CSV and PDF formats with loading states
 *
 * Location: src/components/export/ExportActions.jsx
 */
export function ExportActions({
  onExportCSV,
  onExportPDF,
  isExportingCSV = false,
  isExportingPDF = false,
}) {
  const { user } = useAuth();
  const isExporting = isExportingCSV || isExportingPDF;

  return (
    <div className="flex flex-wrap gap-4">
      {/* Export CSV Button */}
      <Tooltip placement="top" delay={0} isDisabled={!!user}>
        <Tooltip.Trigger>
          <Button
            onClick={user ? onExportCSV : undefined}
            isDisabled={!user || isExporting}
            disabled={!user || isExporting}
            variant="neutral-soft"
            aria-label="Export assessment data as CSV"
            title={!user ? 'Sign in to get access to them' : isExporting ? 'Export in progress' : undefined}
          >
            {isExportingCSV ? <LoaderIcon /> : <Download className="w-4 h-4" />}
            {isExportingCSV ? 'Exporting...' : 'Similar Cases CSV'}
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content showArrow placement="top">
          <Tooltip.Arrow />
          <p className="text-xs font-bold">
            {user ? (isExporting ? 'Export in progress' : 'Export assessment data as CSV') : 'Sign in to get access to them'}
          </p>
        </Tooltip.Content>
      </Tooltip>

      {/* Export PDF Button */}
      <Tooltip placement="top" delay={0} isDisabled={!!user}>
        <Tooltip.Trigger>
          <Button
            onClick={user ? onExportPDF : undefined}
            isDisabled={!user || isExporting}
            disabled={!user || isExporting}
            variant="neutral-soft"
            aria-label="Export assessment as PDF"
            title={!user ? 'Sign in to get access to them' : isExporting ? 'Export in progress' : undefined}
          >
            {isExportingPDF ? <LoaderIcon /> : <FileText className="w-4 h-4" />}
            {isExportingPDF ? 'Generating...' : 'Download as PDF'}
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content showArrow placement="top">
          <Tooltip.Arrow />
          <p className="text-xs font-bold">
            {user ? (isExporting ? 'Export in progress' : 'Export assessment as PDF') : 'Sign in to get access to them'}
          </p>
        </Tooltip.Content>
      </Tooltip>
    </div>
  );
}

ExportActions.propTypes = {
  onExportCSV: PropTypes.func.isRequired,
  onExportPDF: PropTypes.func.isRequired,
  isExportingCSV: PropTypes.bool,
  isExportingPDF: PropTypes.bool,
};

ExportActions.defaultProps = {
  isExportingCSV: false,
  isExportingPDF: false,
};
