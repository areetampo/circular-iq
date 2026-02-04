import React from 'react';
import PropTypes from 'prop-types';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InfoIconButton({ onClick = () => {}, className = '', size = 18 }) {
  return (
    <button
      className={cn(
        'border-none cursor-pointer flex items-center justify-center transition-transform hover:scale-110',
        className,
      )}
      onClick={onClick}
    >
      <Info size={size} />
    </button>
  );
}

InfoIconButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  size: PropTypes.number,
};
