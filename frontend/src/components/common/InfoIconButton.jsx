import React from 'react';
import PropTypes from 'prop-types';

export default function InfoIconButton({ onClick, title, size = 20, className }) {
  return (
    <button
      className={
        'border-none cursor-pointer flex items-center justify-center transition-transform hover:scale-110' +
        (className ? ` ${className}` : '')
      }
      onClick={onClick}
      title={title}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#34a83a" strokeWidth="2" />
        <path d="M12 16v-4M12 8h.01" stroke="#34a83a" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

InfoIconButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  title: PropTypes.string,
  size: PropTypes.number,
  className: PropTypes.string,
};

InfoIconButton.defaultProps = {
  title: '',
  size: 20,
  className: '',
};
