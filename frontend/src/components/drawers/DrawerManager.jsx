/**
 * @module DrawerManager
 * @description Info drawer — Drawer Manager.
 */

import DRAWER_TYPES from '@/constants/drawerTypes';
import { useGlobalDrawer } from '@/contexts/DrawerContext';

import AssessmentMethodologyDrawer from './AssessmentMethodologyDrawer';
import BusinessContextHeadingInfoDrawer from './BusinessContextHeadingInfoDrawer';
import BusinessProblemInfoDrawer from './BusinessProblemInfoDrawer';
import BusinessSolutionInfoDrawer from './BusinessSolutionInfoDrawer';
import EvaluationCriteriaDrawer from './EvaluationCriteriaDrawer';
import EvaluationParametersHeadingInfoDrawer from './EvaluationParametersHeadingInfoDrawer';
import ResultsDatabaseEvidenceDetailsDrawer from './ResultsDatabaseEvidenceDetailsDrawer';
import SampleTestCasesHeadingInfoDrawer from './SampleTestCasesHeadingInfoDrawer';
import SpecificEvaluationParameterInfoDrawer from './SpecificEvaluationParameterInfoDrawer';
import SpecificSampleTestCaseViewDetailsDrawer from './SpecificSampleTestCaseViewDetailsDrawer';

/**
 * Info drawer — Drawer Manager.
 * @returns {import('react').ReactElement}
 */
export default function DrawerManager() {
  const { drawer } = useGlobalDrawer();

  if (!drawer) return null;

  const { type, data } = drawer;

  if (!type) return null;

  switch (type) {
    case DRAWER_TYPES.ASSESSMENT_METHODOLOGY:
      return <AssessmentMethodologyDrawer />;

    case DRAWER_TYPES.EVALUATION_CRITERIA:
      return <EvaluationCriteriaDrawer />;

    case DRAWER_TYPES.BUSINESS_PROBLEM_INFO:
      return <BusinessProblemInfoDrawer />;

    case DRAWER_TYPES.BUSINESS_SOLUTION_INFO:
      return <BusinessSolutionInfoDrawer />;

    case DRAWER_TYPES.BUSINESS_CONTEXT_HEADING_INFO:
      return <BusinessContextHeadingInfoDrawer />;

    case DRAWER_TYPES.EVALUATION_PARAMETERS_HEADING_INFO:
      return <EvaluationParametersHeadingInfoDrawer />;

    case DRAWER_TYPES.SPECIFIC_EVALUATION_PARAMETER_INFO:
      return <SpecificEvaluationParameterInfoDrawer paramKey={data?.paramKey} />;

    case DRAWER_TYPES.SAMPLE_TEST_CASES_HEADING_INFO:
      return <SampleTestCasesHeadingInfoDrawer />;

    case DRAWER_TYPES.SPECIFIC_SAMPLE_TEST_CASE_VIEW_DETAILS:
      return <SpecificSampleTestCaseViewDetailsDrawer testCase={data?.testCase} />;

    case DRAWER_TYPES.RESULTS_DATABASE_EVIDENCE_DETAILS:
      return <ResultsDatabaseEvidenceDetailsDrawer data={data || {}} />;

    default:
      logger.warn('Unknown drawer type:', type);
      return null;
  }
}

DrawerManager.propTypes = {
  /** No props - gets drawer state directly from context */
};
