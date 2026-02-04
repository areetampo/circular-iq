import React from 'react';
import PropTypes from 'prop-types';
import { ClipboardPenLine, Lightbulb, X } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';

export default function SampleTestCasesHeadingInfoModal({ onClose, isModalOpen }) {
  return (
    <Modal
      isOpen={isModalOpen}
      onOpenChange={onClose}
      size="lg"
      scrollBehavior="inside"
      backdrop="opaque"
      placement="center"
      hideCloseButton={true}
      classNames={{
        backdrop: 'bg-black/50',
        base: 'bg-white rounded-2xl shadow-xl',
      }}
    >
      <ModalContent className="outline-none focus:outline-none focus-visible:outline-none ring-0">
        <ModalHeader className="flex items-center gap-3 py-5">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ClipboardPenLine className="text-blue-600" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[#2c3e50]">Sample Test Cases</h2>
            <p className="text-xs text-gray-500">Pre-filled business model examples</p>
          </div>
          <Button
            isIconOnly
            variant="light"
            onPress={onClose}
            aria-label="Close"
            className="ml-auto hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </Button>
        </ModalHeader>
        <ModalBody className="gap-4 px-6 py-6">
          <p className="leading-relaxed text-gray-700">
            <strong>Test Cases</strong> are pre-filled form submissions representing real circular
            economy business models. They help you:
          </p>
          <ul className="ml-3 space-y-2">
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <span className="mt-1 font-bold text-blue-500">→</span>
              <span>See what good problem/solution descriptions look like</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <span className="mt-1 font-bold text-blue-500">→</span>
              <span>Understand parameter scoring in real-world contexts</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <span className="mt-1 font-bold text-blue-500">→</span>
              <span>Quickly test the evaluation framework</span>
            </li>
          </ul>

          <div className="pt-2">
            <h3 className="mb-3 text-base font-bold text-slate-800">How They Work</h3>
            <ol className="space-y-2">
              {[
                { num: 1, title: 'Select', desc: 'Pick any test case from the dropdown' },
                { num: 2, title: 'Auto-fill', desc: 'Your form populates automatically' },
                { num: 3, title: 'Submit', desc: 'Click "Get Evaluation" to see scores' },
                { num: 4, title: 'Learn', desc: 'Review the evaluation against known results' },
              ].map((step) => (
                <li key={step.num} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="flex items-center justify-center flex-shrink-0 w-6 h-6 text-xs font-bold text-blue-600 bg-blue-100 rounded-full">
                    {step.num}
                  </span>
                  <div>
                    <strong>{step.title}:</strong> {step.desc}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
            <p className="flex items-start gap-2 m-0 text-xs text-blue-900">
              <Lightbulb className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" strokeWidth={2} />
              <span>
                <strong>Tip:</strong> Great for learning before submitting your own idea.
              </span>
            </p>
          </div>
        </ModalBody>
        <ModalFooter className="gap-2 py-2" />
      </ModalContent>
    </Modal>
  );
}

SampleTestCasesHeadingInfoModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  isModalOpen: PropTypes.bool.isRequired,
};
