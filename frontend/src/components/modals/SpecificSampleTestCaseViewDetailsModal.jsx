import React from 'react';
import PropTypes from 'prop-types';
import { PencilLine, Target, Lightbulb, BarChart3 } from 'lucide-react';
import { Modal } from '@heroui/react';
import { Button } from '@/components/common';
import { useGlobalModal } from '@/contexts/ModalContext';

export default function SpecificSampleTestCaseViewDetailsModal({ testCase }) {
  if (!testCase) return null;

  const { isModalOpen, onClose } = useGlobalModal();

  return (
    <Modal.Backdrop
      isOpen={isModalOpen}
      onOpenChange={onClose}
      variant="opaque"
      isDismissable={true}
    >
      <Modal.Container placement="center" scroll="inside" size="2xl">
        <Modal.Dialog aria-label="Sample Test Case Information">
          <Modal.Header className="pt-0 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <PencilLine className="size-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{testCase.title}</h2>
                <p className="text-sm text-gray-600">Sample test case details and parameters</p>
              </div>
            </div>
          </Modal.Header>
          <Modal.Body className="gap-6 px-2">
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="size-5 text-emerald-600" strokeWidth={2} />
                  <h3 className="text-base font-bold text-gray-900">Business Problem</h3>
                </div>
                <div className="p-4 border border-emerald-200 bg-emerald-50 rounded-xl">
                  <p className="text-sm leading-relaxed text-gray-600">{testCase.problem}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="size-5 text-teal-600" strokeWidth={2} />
                  <h3 className="text-base font-bold text-gray-900">Business Solution</h3>
                </div>
                <div className="p-4 border border-teal-200 bg-teal-50 rounded-xl">
                  <p className="text-sm leading-relaxed text-gray-600">{testCase.solution}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="size-5 text-blue-600" strokeWidth={2} />
                  <h3 className="text-base font-bold text-gray-900">Parameter Scores</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {Object.entries(testCase.parameters).map(([key, value]) => {
                    const isGood = value >= 75;
                    const isMedium = value >= 50;
                    return (
                      <div
                        key={key}
                        className={`p-3 rounded-lg transition-all hover:scale-105 border-2 ${
                          isGood
                            ? 'bg-emerald-100 border-emerald-300'
                            : isMedium
                              ? 'bg-yellow-100 border-yellow-300'
                              : 'bg-red-100 border-red-300'
                        }`}
                      >
                        <div
                          className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                            isGood
                              ? 'text-emerald-700'
                              : isMedium
                                ? 'text-yellow-700'
                                : 'text-red-700'
                          }`}
                        >
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div
                          className={`text-2xl font-bold ${
                            isGood
                              ? 'text-emerald-600'
                              : isMedium
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        >
                          {value}
                        </div>
                      </div>
                    );
                  })}
                </div>
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

SpecificSampleTestCaseViewDetailsModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  isModalOpen: PropTypes.bool.isRequired,
  testCase: PropTypes.shape({
    title: PropTypes.string.isRequired,
    problem: PropTypes.string.isRequired,
    solution: PropTypes.string.isRequired,
    parameters: PropTypes.object.isRequired,
  }).isRequired,
};
