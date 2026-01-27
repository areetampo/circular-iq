import React from 'react';
import PropTypes from 'prop-types';

export default function Toast({ id, message, type, onClose }) {
  return (
    <div className={`toast toast-${type}`} role="alert">
      <div className="toast-content">{message}</div>
      <button
        className="mb-1 text-lg font-bold toast-close"
        onClick={() => onClose(id)}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}

Toast.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'info', 'warning']).isRequired,
  onClose: PropTypes.func.isRequired,
};
