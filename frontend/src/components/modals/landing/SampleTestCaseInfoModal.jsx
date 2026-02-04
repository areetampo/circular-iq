import React from 'react';
import PropTypes from 'prop-types';
import { PencilLine, Target, Lightbulb, BarChart3, X } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';

export default function SampleTestCaseInfoModal({ onClose, isModalOpen, testCase }) {
  return (
    <Modal
      isOpen={isModalOpen}
      onOpenChange={onClose}
      size="xl"
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
            <PencilLine className="text-blue-600" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[#2c3e50]">{testCase.title}</h2>
            <p className="text-gray-500 text-xs">Sample test case details and parameters</p>
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
        <ModalBody className="gap-5 py-6 px-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-emerald-600" strokeWidth={2} />
              <h3 className="text-base font-bold text-slate-800">Business Problem</h3>
            </div>
            <div className="p-4 border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl">
              <p className="text-sm leading-relaxed text-slate-700">{testCase.problem}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-5 h-5 text-teal-600" strokeWidth={2} />
              <h3 className="text-base font-bold text-slate-800">Business Solution</h3>
            </div>
            <div className="p-4 border border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl">
              <p className="text-sm leading-relaxed text-slate-700">{testCase.solution}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-blue-600" strokeWidth={2} />
              <h3 className="text-base font-bold text-slate-800">Parameter Scores</h3>
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
                        ? 'bg-gradient-to-br from-emerald-100 to-green-100 border-emerald-300'
                        : isMedium
                          ? 'bg-gradient-to-br from-yellow-100 to-amber-100 border-yellow-300'
                          : 'bg-gradient-to-br from-red-100 to-rose-100 border-red-300'
                    }`}
                  >
                    <div
                      className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                        isGood ? 'text-emerald-700' : isMedium ? 'text-yellow-700' : 'text-red-700'
                      }`}
                    >
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div
                      className={`text-2xl font-bold ${
                        isGood ? 'text-emerald-600' : isMedium ? 'text-yellow-600' : 'text-red-600'
                      }`}
                    >
                      {value}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="gap-2 py-2" />
      </ModalContent>
    </Modal>
  );
}

SampleTestCaseInfoModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  isModalOpen: PropTypes.bool.isRequired,
  testCase: PropTypes.shape({
    title: PropTypes.string.isRequired,
    problem: PropTypes.string.isRequired,
    solution: PropTypes.string.isRequired,
    parameters: PropTypes.object.isRequired,
  }).isRequired,
};
