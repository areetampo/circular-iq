import { useState } from 'react';
import { MODALS } from '@/components/modals/modalTypes';

export default function useModal() {
  const [modalState, setModalState] = useState({ type: null, data: null });

  const openModal = (type, data = null) => {
    setModalState({ type, data });
  };

  const onClose = () => {
    setModalState({ type: null, data: null });
  };

  return {
    modal: modalState,
    isModalOpen: modalState.type !== null,
    onClose,

    openAssessmentMethodologyModal: () => openModal(MODALS.ASSESSMENT_METHODOLOGY),

    openEvaluationCriteriaModal: () => openModal(MODALS.EVALUATION_CRITERIA),

    openBusinessProblemInfoModal: () => openModal(MODALS.BUSINESS_PROBLEM_INFO),

    openBusinessSolutionInfoModal: () => openModal(MODALS.BUSINESS_SOLUTION_INFO),

    openEvaluationParametersHeadingInfoModal: () =>
      openModal(MODALS.EVALUATION_PARAMETERS_HEADING_INFO),

    openSpecificEvaluationParameterInfoModal: (paramKey) =>
      openModal(MODALS.SPECIFIC_EVALUATION_PARAMETER_INFO, { paramKey }),

    openTestCasesHeadingInfoModal: () => openModal(MODALS.SAMPLE_TEST_CASES_HEADING_INFO),

    openSpecificTestCaseDetailsModal: (testCase) =>
      openModal(MODALS.SPECIFIC_SAMPLE_TEST_CASE_VIEW_DETAILS, { testCase }),

    openResultsDatabaseEvidenceDetailsModal: (evidenceData) =>
      openModal(MODALS.RESULTS_DATABASE_EVIDENCE_DETAILS, evidenceData),

    openDashboardFeaturedSolutionsModal: (data) =>
      openModal(MODALS.DASHBOARD_FEATURED_SOLUTIONS, data),
  };
}
