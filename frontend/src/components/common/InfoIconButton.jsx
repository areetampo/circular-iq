import React from 'react';
import PropTypes from 'prop-types';
import { Info } from 'lucide-react';
import { cn } from '@/utils/cn';

export default function InfoIconButton({
  onClick = () => {},
  className = '',
  size = 18,
  color = '#009689',
}) {
  return (
    <button
      className={cn(
        'border-none cursor-pointer flex items-center justify-center transition-transform hover:scale-110 teal',
        className,
      )}
      onClick={onClick}
    >
      <Info size={size} color={color} />
    </button>
  );
}

InfoIconButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  size: PropTypes.number,
  color: PropTypes.string,
};
