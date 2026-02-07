import React from 'react';
import PropTypes from 'prop-types';
import { ClipboardPenLine, Lightbulb } from 'lucide-react';
import { Modal, Button } from '@heroui/react';

export default function SampleTestCasesHeadingInfoModal({ onClose, isModalOpen }) {
  return (
    <Modal.Backdrop
      isOpen={isModalOpen}
      onOpenChange={onClose}
      variant="opaque"
      isDismissable={true}
    >
      <Modal.Container placement="center" scroll="inside" size="xl">
        <Modal.Dialog aria-label="Sample Test Cases">
          <Modal.Header className="pt-0 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <ClipboardPenLine className="size-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Sample Test Cases</h2>
                <p className="text-sm text-gray-600">Pre-filled business model examples</p>
              </div>
            </div>
          </Modal.Header>
          <Modal.Body className="gap-6 px-2">
            <div className="space-y-6">
              <p className="leading-relaxed text-gray-600">
                <strong>Test Cases</strong> are pre-filled form submissions representing real
                circular economy business models. They help you:
              </p>
              <ul className="ml-3 space-y-2">
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="font-bold text-blue-500">→</span>
                  <span>See what good problem/solution descriptions look like</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="font-bold text-blue-500">→</span>
                  <span>Understand parameter scoring in real-world contexts</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="font-bold text-blue-500">→</span>
                  <span>Quickly test the evaluation framework</span>
                </li>
              </ul>

              <div className="pt-2">
                <h3 className="mb-3 text-base font-bold text-gray-900">How They Work</h3>
                <ol className="space-y-2">
                  {[
                    { num: 1, title: 'Select', desc: 'Pick any test case from the dropdown' },
                    { num: 2, title: 'Auto-fill', desc: 'Your form populates automatically' },
                    { num: 3, title: 'Submit', desc: 'Click "Get Evaluation" to see scores' },
                    { num: 4, title: 'Learn', desc: 'Review the evaluation against known results' },
                  ].map((step) => (
                    <li key={step.num} className="flex items-start gap-3 text-sm text-gray-600">
                      <span className="flex items-center justify-center shrink-0 w-6 h-6 text-xs font-bold text-blue-600 bg-blue-100 rounded-full">
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
                  <Lightbulb className="w-4 h-4 mt-0.5 text-blue-600 shrink-0" strokeWidth={2} />
                  <span>
                    <strong>Tip:</strong> Great for learning before submitting your own idea.
                  </span>
                </p>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="">
            <Button variant="tertiary" onPress={onClose}>
              Close
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

SampleTestCasesHeadingInfoModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  isModalOpen: PropTypes.bool.isRequired,
};
