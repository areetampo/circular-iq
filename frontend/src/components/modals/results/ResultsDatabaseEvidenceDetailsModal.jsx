import React from 'react';
import PropTypes from 'prop-types';
import { extractProblemSolution } from '@/utils/content';
import { NotebookText, Target, Lightbulb, X } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';

export default function ResultsDatabaseEvidenceDetailsModal({
  onClose,
  isModalOpen,
  caseItem,
  content,
  title,
  matchPercentage,
  matchStrength,
  matchColor,
  sourceCaseId,
}) {
  // Use structured metadata if available (preferred), otherwise parse content
  const { problem: problemPart, solution: solutionPart } = extractProblemSolution(
    caseItem || content,
  );

  // Check if we have valid problem and solution
  const hasSeparateSections =
    problemPart &&
    solutionPart &&
    problemPart !== 'Problem data not clearly formatted' &&
    solutionPart !== 'Solution data not clearly formatted';

  return (
    <Modal
      isOpen={isModalOpen}
      onOpenChange={onClose}
      size="2xl"
      backdrop="opaque"
      placement="center"
      scrollBehavior="inside"
      classNames={{
        backdrop: 'bg-black/50',
        base: 'bg-white rounded-2xl shadow-xl',
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-2 border-b border-gray-200 py-4 px-6">
              <div className="flex items-center gap-2">
                <NotebookText className="w-6 h-6 text-slate-700" />
                <h2 className="text-xl font-bold text-slate-900">{title || 'Evidence Details'}</h2>
                <Button
                  isIconOnly
                  variant="light"
                  onPress={onClose}
                  aria-label="Close"
                  className="ml-auto"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Database evidence from similar circular economy projects
              </p>
            </ModalHeader>

            <ModalBody className="py-6 px-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Metadata badges */}
              {matchPercentage && (
                <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-center gap-2 text-sm py-2 px-3 rounded-md bg-gray-100 font-semibold text-gray-700">
                    <NotebookText size={16} />
                    <span>Source Case {sourceCaseId}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <div className="px-3 py-2 text-xs font-bold text-white rounded-full bg-emerald-600">
                    {matchPercentage}%&nbsp;&nbsp;Similarity
                  </div>
                  <span className="text-gray-400">•</span>
                  <div
                    className="text-xs font-bold tracking-wide uppercase"
                    style={{ color: matchColor }}
                  >
                    {matchStrength}
                  </div>
                </div>
              )}

              {/* Content sections */}
              {hasSeparateSections ? (
                <>
                  <div className="mb-8">
                    <div className="flex items-center gap-2.5 mb-4 pb-3 border-b-2 border-emerald-600">
                      <Target className="w-6 h-6 text-emerald-600" strokeWidth={2} />
                      <h3 className="m-0 text-lg font-semibold text-slate-900">
                        Problem Addressed
                      </h3>
                    </div>
                    <p className="m-0 text-base leading-7 text-slate-800">{problemPart}</p>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-center gap-2.5 mb-4 pb-3 border-b-2 border-emerald-600">
                      <Lightbulb className="w-6 h-6 text-emerald-600" strokeWidth={2} />
                      <h3 className="m-0 text-lg font-semibold text-slate-900">
                        Solution Approach
                      </h3>
                    </div>
                    <p className="m-0 text-base leading-7 text-slate-800">{problemPart}</p>
                  </div>

                  <div className="mb-7">
                    <div className="flex items-center gap-2.5 mb-3 pb-2 border-b-2 border-emerald-600">
                      <Lightbulb className="w-6 h-6 text-emerald-600" strokeWidth={2} />
                      <h3 className="m-0 text-lg font-semibold text-slate-800">
                        Solution Approach
                      </h3>
                    </div>
                    <p className="m-0 text-base leading-7 text-slate-800">{solutionPart}</p>
                  </div>
                </>
              ) : (
                <>
                  <p className="m-0 mb-6 leading-7 text-slate-800">{content}</p>
                </>
              )}
            </ModalBody>

            <ModalFooter className="py-2 px-6" />
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

ResultsDatabaseEvidenceDetailsModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  isModalOpen: PropTypes.bool.isRequired,
  caseItem: PropTypes.object,
  content: PropTypes.string,
  title: PropTypes.string,
  matchPercentage: PropTypes.number,
  matchStrength: PropTypes.string,
  matchColor: PropTypes.string,
  sourceCaseId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

ResultsDatabaseEvidenceDetailsModal.defaultProps = {
  caseItem: null,
  content: '',
  title: '',
  matchPercentage: null,
  matchStrength: '',
  matchColor: '',
  sourceCaseId: null,
};
