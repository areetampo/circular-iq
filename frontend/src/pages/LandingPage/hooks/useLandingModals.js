import useModal from '@/hooks/useModal';
import { LANDING_MODALS } from '@/components/modals/modalTypes';

export default function useLandingModals() {
  const { modal, openModal, onClose, isModalOpen } = useModal();

  return {
    modal,
    isModalOpen,
    onClose,

    openAssessmentMethodologyModal: () => openModal(LANDING_MODALS.ASSESSMENT_METHODOLOGY),

    openEvaluationCriteriaModal: () => openModal(LANDING_MODALS.EVALUATION_CRITERIA),

    openBusinessProblemInfoModal: () => openModal(LANDING_MODALS.BUSINESS_PROBLEM_INFO),

    openBusinessSolutionInfoModal: () => openModal(LANDING_MODALS.BUSINESS_SOLUTION_INFO),

    openEvaluationParametersInfoModal: () => openModal(LANDING_MODALS.EVALUATION_PARAMETERS_INFO),

    openParameterInfoModal: (paramKey) => openModal(LANDING_MODALS.PARAMETER_INFO, { paramKey }),

    openTestCasesHeadingInfoModal: () => openModal(LANDING_MODALS.SAMPLE_TEST_CASES_HEADING_INFO),

    openTestCaseDetailsModal: (testCase) => openModal(LANDING_MODALS.TEST_CASE_INFO, { testCase }),
  };
}
