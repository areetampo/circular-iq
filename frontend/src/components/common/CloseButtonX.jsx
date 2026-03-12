import { X } from 'lucide-react';
import React from 'react';
import PropTypes from 'prop-types';

export default function CloseButtonX({ onClick, className }) {
  return (
    <button
      onClick={onClick}
      className={
        `flex items-center justify-center p-2 text-white transition-all border-none rounded-lg cursor-pointer bg-white/20 hover:bg-white/30 w-9 h-9 ` +
        (className || '')
      }
    >
      <X size={25} strokeWidth={4} />
    </button>
  );
}

CloseButtonX.propTypes = {
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
};
