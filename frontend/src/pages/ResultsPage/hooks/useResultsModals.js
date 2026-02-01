import useModal from '@/hooks/useModal';
import { RESULTS_MODALS } from '@/components/modals/core/modalTypes';

export default function useResultsModals() {
  const { modal, openModal, closeModal, isModalOpen } = useModal();

  return {
    modal,
    isModalOpen,
    closeModal,

    openDatabaseEvidenceDetails: (evidenceData) =>
      openModal(RESULTS_MODALS.DATABASE_EVIDENCE_DETAILS, evidenceData),

    openMarketAnalysis: (currentAssessmentScore, currentIndustry) =>
      openModal(RESULTS_MODALS.MARKET_ANALYSIS, { currentAssessmentScore, currentIndustry }),
  };
}
