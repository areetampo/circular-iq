import useModal from '@/hooks/useModal';
import { RESULTS_MODALS } from '@/components/modals/core/modalTypes';

export default function useResultsModals() {
  const { modal, openModal, onClose, isModalOpen } = useModal();

  return {
    modal,
    isModalOpen,
    onClose,

    openDatabaseEvidenceDetails: (evidenceData) =>
      openModal(RESULTS_MODALS.DATABASE_EVIDENCE_DETAILS, evidenceData),
  };
}
