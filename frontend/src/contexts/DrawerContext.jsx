import React, { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import useDrawer from '@/hooks/useDrawer';

const DrawerContext = createContext();

export const DrawerProvider = ({ children }) => {
  const drawerValue = useDrawer();
  return <DrawerContext.Provider value={drawerValue}>{children}</DrawerContext.Provider>;
};

DrawerProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/** Consume global drawer state inside any drawer component */
export const useGlobalDrawer = () => {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useGlobalDrawer must be used within a DrawerProvider');
  }
  return context;
};
