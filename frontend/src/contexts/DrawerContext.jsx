import PropTypes from 'prop-types';
import { createContext, useContext } from 'react';

import { useDrawer } from '@/hooks';

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
