import React from 'react';
import PropTypes from 'prop-types';
import { Download, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      <Button
        onClick={onExportCSV}
        disabled={isExporting}
        variant="outline"
        title={isExporting ? 'Export in progress' : 'Export assessment data as CSV'}
        aria-label="Export assessment data as CSV"
        className="gap-2"
      >
        {isExportingCSV ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {isExportingCSV ? 'Exporting...' : 'Similar Cases CSV'}
      </Button>

      {/* Export PDF Button */}
      <Button
        onClick={onExportPDF}
        disabled={isExporting}
        variant="outline"
        title={isExporting ? 'Export in progress' : 'Export assessment as PDF'}
        aria-label="Export assessment as PDF"
        className="gap-2"
      >
        {isExportingPDF ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        {isExportingPDF ? 'Generating...' : 'Download as PDF'}
      </Button>
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
