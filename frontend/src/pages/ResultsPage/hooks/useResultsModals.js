import useModal from '@/hooks/useModal';
import { RESULTS_MODALS } from '@/components/modals/core/modalTypes';

export default function useLandingModals() {
  const { modal, openModal, closeModal, isModalOpen } = useModal();

  return {
    modal,
    isModalOpen,
    closeModal,

    openDatabaseEvidenceDetails: (evidenceId) =>
      openModal(RESULTS_MODALS.DATABASE_EVIDENCE_DETAILS, { evidenceId }),

    openMarketAnalysis: (currentAssessmentScore, currentIndustry) =>
      openModal(RESULTS_MODALS.MARKET_ANALYSIS, { currentAssessmentScore, currentIndustry }),
  };
}
