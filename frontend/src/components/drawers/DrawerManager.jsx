import {
  AssessmentMethodologyDrawer,
  BusinessContextHeadingInfoDrawer,
  BusinessProblemInfoDrawer,
  BusinessSolutionInfoDrawer,
  DashboardFeaturedSolutionsDrawer,
  EvaluationCriteriaDrawer,
  EvaluationParametersHeadingInfoDrawer,
  ResultsDatabaseEvidenceDetailsDrawer,
  SampleTestCasesHeadingInfoDrawer,
  SpecificEvaluationParameterInfoDrawer,
  SpecificSampleTestCaseViewDetailsDrawer,
} from '@/components/drawers';
import DRAWERS from '@/components/drawers/drawerTypes';
import { useGlobalDrawer } from '@/contexts/DrawerContext';

export default function DrawerManager() {
  const { drawer } = useGlobalDrawer();

  if (!drawer) return null;

  const { type, data } = drawer;

  if (!type) return null;

  switch (type) {
    case DRAWERS.ASSESSMENT_METHODOLOGY:
      return <AssessmentMethodologyDrawer />;

    case DRAWERS.EVALUATION_CRITERIA:
      return <EvaluationCriteriaDrawer />;

    case DRAWERS.BUSINESS_PROBLEM_INFO:
      return <BusinessProblemInfoDrawer />;

    case DRAWERS.BUSINESS_SOLUTION_INFO:
      return <BusinessSolutionInfoDrawer />;

    case DRAWERS.BUSINESS_CONTEXT_HEADING_INFO:
      return <BusinessContextHeadingInfoDrawer />;

    case DRAWERS.EVALUATION_PARAMETERS_HEADING_INFO:
      return <EvaluationParametersHeadingInfoDrawer />;

    case DRAWERS.SPECIFIC_EVALUATION_PARAMETER_INFO:
      return <SpecificEvaluationParameterInfoDrawer paramKey={data?.paramKey} />;

    case DRAWERS.SAMPLE_TEST_CASES_HEADING_INFO:
      return <SampleTestCasesHeadingInfoDrawer />;

    case DRAWERS.SPECIFIC_SAMPLE_TEST_CASE_VIEW_DETAILS:
      return <SpecificSampleTestCaseViewDetailsDrawer testCase={data?.testCase} />;

    case DRAWERS.RESULTS_DATABASE_EVIDENCE_DETAILS:
      return <ResultsDatabaseEvidenceDetailsDrawer data={data || {}} />;

    case DRAWERS.DASHBOARD_FEATURED_SOLUTIONS:
      return <DashboardFeaturedSolutionsDrawer data={data || {}} />;

    default:
      logger.warn('Unknown drawer type:', type);
      return null;
  }
}

DrawerManager.propTypes = {};
