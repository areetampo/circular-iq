import React from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable export button component with consistent styling and loading state
 * Reduces code duplication across views
 *
 * @param {boolean} isLoading - Whether export is in progress
 * @param {string} icon - Emoji icon for button
 * @param {string} label - Button text when not loading
 * @param {string} loadingLabel - Button text while loading (optional)
 * @param {Function} onClick - Click handler
 * @param {string} className - CSS class name
 * @param {string} title - Tooltip title
 */
export default function ExportButton({
  isLoading,
  icon,
  label,
  loadingLabel,
  onClick,
  className = 'download-button',
  title = '',
}) {
  return (
    <button className={className} onClick={onClick} disabled={isLoading} title={title}>
      {isLoading ? `⏳ ${loadingLabel || label}` : `${icon} ${label}`}
    </button>
  );
}

ExportButton.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  loadingLabel: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  title: PropTypes.string,
};
