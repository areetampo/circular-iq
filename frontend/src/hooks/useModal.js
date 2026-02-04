import { useState } from 'react';

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
    openModal,
    onClose,
    isModalOpen: modalState.type !== null,
  };
}
