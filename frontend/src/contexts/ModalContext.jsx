import React, { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import useModal from '@/hooks/useModal';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const modalValue = useModal();
  return <ModalContext.Provider value={modalValue}>{children}</ModalContext.Provider>;
};

ModalProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Hook to consume the global modal state
export const useGlobalModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useGlobalModal must be used within a ModalProvider');
  }
  return context;
};
