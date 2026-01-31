import React from 'react';
import PropTypes from 'prop-types';
import CloseButtonX from '@/components/common/CloseButtonX';
import { MODAL_GRADIENTS } from '@/components/modals/core/modalGradients';

export default function ModalHeading({
  title,
  onClose,
  icon = null,
  type = 'default',
  rightSlot = null,
}) {
  const gradient = MODAL_GRADIENTS[type] || MODAL_GRADIENTS.default;

  return (
    <div className={`sticky top-0 z-10 flex justify-between p-6 bg-gradient-to-r ${gradient}`}>
      <div className="flex items-center gap-4">
        {icon &&
          React.cloneElement(icon, {
            size: 24,
            color: 'white',
          })}
        <div>
          <h2 className="m-0 text-2xl font-bold text-white">{title}</h2>
          {rightSlot && <div className="mt-1 text-sm text-white/80">{rightSlot}</div>}
        </div>
      </div>
      <CloseButtonX onClick={onClose} />
    </div>
  );
}

ModalHeading.propTypes = {
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  icon: PropTypes.node,
  rightSlot: PropTypes.node,
  type: PropTypes.string, // comes from modalTypes
};
