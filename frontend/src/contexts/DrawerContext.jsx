/**
 * @module DrawerContext
 * @description Global drawer state — wraps useDrawer() for app-wide access via useGlobalDrawer().
 * Mount DrawerProvider in AppProvider; DrawerManager renders the active info drawer by type.
 */

import PropTypes from 'prop-types';
import { createContext, useContext } from 'react';

import { useDrawer } from '@/hooks';

const DrawerContext = createContext();

/**
 * Provides global drawer state from `useDrawer()` to the React tree.
 *
 * @param {Object} props
 * @param {import('react').ReactNode} props.children
 * @returns {import('react').ReactElement}
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
 *   openResultsDatabaseEvidenceDetailsDrawer: (evidenceData: Object) => void
 * }}
 * @throws {Error} When used outside `DrawerProvider`.
 */
export const useGlobalDrawer = () => {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useGlobalDrawer must be used within a DrawerProvider');
  }
  return context;
};
