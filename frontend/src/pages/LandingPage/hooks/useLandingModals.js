import useModal from '@/hooks/useModal';
import { LANDING_MODALS } from '@/components/modals/core/modalTypes';

export default function useLandingModals() {
  const { modal, openModal, onClose, isModalOpen } = useModal();

  return {
    modal,
    isModalOpen,
    onClose,

    openBusinessProblem: () => openModal(LANDING_MODALS.BUSINESS_PROBLEM_INFO),

    openBusinessSolution: () => openModal(LANDING_MODALS.BUSINESS_SOLUTION_INFO),

    openEvaluationParameters: () => openModal(LANDING_MODALS.EVALUATION_PARAMETERS_INFO),

    openParameterInfo: (paramKey) => openModal(LANDING_MODALS.PARAMETER_INFO, { paramKey }),

    openTestCaseHeading: () => openModal(LANDING_MODALS.SAMPLE_TEST_CASES_HEADING_INFO),

    openTestCase: (testCase) => openModal(LANDING_MODALS.TEST_CASE_INFO, { testCase }),
  };
}
