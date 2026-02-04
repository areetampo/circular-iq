//header used at multiple pages and so are its modals
//hence this hook does not have its own @/pages/page/hooks

import useModal from './useModal';
import { HEADER_MODALS } from '@/components/modals/core/modalTypes';

export default function useHeaderModals() {
  const { modal, openModal, onClose, isModalOpen } = useModal();

  return {
    modal,
    isModalOpen,
    onClose,

    openAssessmentMethodology: () => openModal(HEADER_MODALS.ASSESSMENT_METHODOLOGY),

    openEvaluationCriteria: () => openModal(HEADER_MODALS.EVALUATION_CRITERIA),
  };
}
