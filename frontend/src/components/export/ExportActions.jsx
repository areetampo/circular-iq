import React from 'react';
import PropTypes from 'prop-types';
import './ExportActions.css';

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
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      {/* Export CSV Button */}
      <button
        onClick={onExportCSV}
        disabled={isExporting}
        className="export-button csv-button"
        title={isExporting ? 'Export in progress' : 'Export assessment data as CSV'}
        aria-label="Export assessment data as CSV"
        aria-busy={isExportingCSV}
      >
        <span className="export-button-icon">{isExportingCSV ? '⏳' : '📥'}</span>
        <span className="export-button-label">
          {isExportingCSV ? 'Exporting...' : 'Similar Cases CSV'}
        </span>
      </button>

      {/* Export PDF Button */}
      <button
        onClick={onExportPDF}
        disabled={isExporting}
        className="export-button pdf-button"
        title={isExporting ? 'Export in progress' : 'Export assessment as PDF'}
        aria-label="Export assessment as PDF"
        aria-busy={isExportingPDF}
      >
        <span className="export-button-icon">{isExportingPDF ? '⏳' : '📄'}</span>
        <span className="export-button-label">
          {isExportingPDF ? 'Generating...' : 'Download as PDF'}
        </span>
      </button>
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
