import React from 'react';
import PropTypes from 'prop-types';
import { Download, FileText } from 'lucide-react';
import LoaderIcon from '@/components/common/LoaderIcon';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@heroui/react';

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
  const isExporting = isExportingCSV || isExportingPDF;

  return (
    <div className="flex flex-wrap gap-4">
      {/* Export CSV Button */}
      <Tooltip
        placement="top"
        content={
          <div className="px-3 py-1.5 text-xs text-white rounded-md shadow-md bg-slate-900">
            {isExporting ? 'Export in progress' : 'Export assessment data as CSV'}
          </div>
        }
      >
        <Button
          onClick={onExportCSV}
          disabled={isExporting}
          variant="outline"
          aria-label="Export assessment data as CSV"
          className="gap-2"
        >
          {isExportingCSV ? <LoaderIcon /> : <Download className="w-4 h-4" />}
          {isExportingCSV ? 'Exporting...' : 'Similar Cases CSV'}
        </Button>
      </Tooltip>

      {/* Export PDF Button */}
      <Tooltip
        placement="top"
        content={
          <div className="px-3 py-1.5 text-xs text-white rounded-md shadow-md bg-slate-900">
            {isExporting ? 'Export in progress' : 'Export assessment as PDF'}
          </div>
        }
      >
        <Button
          onClick={onExportPDF}
          disabled={isExporting}
          variant="outline"
          aria-label="Export assessment as PDF"
          className="gap-2"
        >
          {isExportingPDF ? <LoaderIcon /> : <FileText className="w-4 h-4" />}
          {isExportingPDF ? 'Generating...' : 'Download as PDF'}
        </Button>
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
