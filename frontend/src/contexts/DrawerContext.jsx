/**
 * Global drawer state shared through `DrawerProvider` and consumed with `useGlobalDrawer`.
 * Mounts in `AppProvider`; `DrawerManager` reads the active drawer type and payload.
 */

import PropTypes from 'prop-types';
import { createContext, useContext } from 'react';

import { useDrawer } from '@/hooks';

const DrawerContext = createContext();

/**
 * Provides one active info drawer at a time and preserves delayed unmount state for close animations.
 *
 * @example
 * const { openBusinessProblemInfoDrawer } = useGlobalDrawer();
 */
export const DrawerProvider = ({ children }) => {
  const drawerValue = useDrawer();
  return <DrawerContext.Provider value={drawerValue}>{children}</DrawerContext.Provider>;
};

DrawerProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Consumes global drawer state. Must be used within `DrawerProvider`.
 *
 * @returns {{
 *   drawer: { type: string|null, data: Object|null, isOpen: boolean },
 *   isDrawerOpen: boolean,
 *   onClose: () => void,
 *   openAssessmentMethodologyDrawer: () => void,
 *   openEvaluationCriteriaDrawer: () => void,
 *   openBusinessProblemInfoDrawer: () => void,
 *   openBusinessSolutionInfoDrawer: () => void,
 *   openBusinessContextHeadingInfoDrawer: () => void,
 *   openEvaluationParametersHeadingInfoDrawer: () => void,
 *   openSpecificEvaluationParameterInfoDrawer: (paramKey: string) => void,
 *   openSampleTestCasesHeadingInfoDrawer: () => void,
 *   openSpecificSampleTestCaseViewDetailsDrawer: (testCase: Object) => void,
 *   openResultsDatabaseEvidenceDetailsDrawer: (caseItem: Object) => void
 * }} Drawer context API used by DrawerManager and feature pages.
 * @throws {Error} When used outside `DrawerProvider`.
 */
export const useGlobalDrawer = () => {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useGlobalDrawer must be used within a DrawerProvider');
  }
  return context;
};
