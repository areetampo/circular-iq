import PropTypes from 'prop-types';
import MODALS from '@/components/modals/modalTypes';
import AssessmentMethodologyModal from '@/components/modals/AssessmentMethodologyModal';
import EvaluationCriteriaModal from '@/components/modals/EvaluationCriteriaModal';
import BusinessProblemInfoModal from '@/components/modals/BusinessProblemInfoModal';
import BusinessSolutionInfoModal from '@/components/modals/BusinessSolutionInfoModal';
import EvaluationParametersHeadingInfoModal from '@/components/modals/EvaluationParametersHeadingInfoModal';
import SpecificEvaluationParameterInfoModal from '@/components/modals/SpecificEvaluationParameterInfoModal';
import SampleTestCasesHeadingInfoModal from '@/components/modals/SampleTestCasesHeadingInfoModal';
import SpecificSampleTestCaseViewDetailsModal from '@/components/modals/SpecificSampleTestCaseViewDetailsModal';
import ResultsDatabaseEvidenceDetailsModal from '@/components/modals/ResultsDatabaseEvidenceDetailsModal';
import DashboardFeaturedSolutionsModal from '@/components/modals/DashboardFeaturedSolutionsModal';
import { useGlobalModal } from '@/contexts/ModalContext';

export default function ModalManager() {
  const { modal } = useGlobalModal();

  if (!modal) return null;

  const { type, data } = modal;

  if (!type) return null;

  switch (type) {
    case MODALS.ASSESSMENT_METHODOLOGY:
      return <AssessmentMethodologyModal />;

    case MODALS.EVALUATION_CRITERIA:
      return <EvaluationCriteriaModal />;

    case MODALS.BUSINESS_PROBLEM_INFO:
      return <BusinessProblemInfoModal />;

    case MODALS.BUSINESS_SOLUTION_INFO:
      return <BusinessSolutionInfoModal />;

    case MODALS.EVALUATION_PARAMETERS_HEADING_INFO:
      return <EvaluationParametersHeadingInfoModal />;

    case MODALS.SPECIFIC_EVALUATION_PARAMETER_INFO:
      return <SpecificEvaluationParameterInfoModal paramKey={data?.paramKey} />;

    case MODALS.SAMPLE_TEST_CASES_HEADING_INFO:
      return <SampleTestCasesHeadingInfoModal />;

    case MODALS.SPECIFIC_SAMPLE_TEST_CASE_VIEW_DETAILS: {
      return <SpecificSampleTestCaseViewDetailsModal testCase={data?.testCase} />;
    }

    case MODALS.RESULTS_DATABASE_EVIDENCE_DETAILS:
      return <ResultsDatabaseEvidenceDetailsModal data={data || {}} />;

    case MODALS.DASHBOARD_FEATURED_SOLUTIONS:
      return <DashboardFeaturedSolutionsModal data={data || {}} />;

    default:
      console.warn('Unknown modal type:', type);
      return null;
  }
}

ModalManager.propTypes = {
  modal: PropTypes.shape({
    type: PropTypes.string.isRequired,
    data: PropTypes.any,
  }),
  isModalOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
