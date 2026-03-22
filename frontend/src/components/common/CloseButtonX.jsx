import { X } from 'lucide-react';
import PropTypes from 'prop-types';

export default function CloseButtonX({ onClick, className, 'aria-label': ariaLabel = 'Close' }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
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
  'aria-label': PropTypes.string,
};
