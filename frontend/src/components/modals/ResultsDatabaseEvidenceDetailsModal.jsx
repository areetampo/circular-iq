import PropTypes from 'prop-types';
import { extractProblemSolution } from '@/utils/content';
import { NotebookText, Target, Lightbulb } from 'lucide-react';
import { Modal, Chip } from '@heroui/react';
import { Button } from '@/components/common';
import { useGlobalModal } from '@/contexts/ModalContext';

export default function ResultsDatabaseEvidenceDetailsModal({ data = {} }) {
  //if data is {} return null
  if (Object.keys(data).length === 0) return null;
  const {
    title = '',
    content = '',
    caseItem = null,
    matchPercentage = null,
    matchStrengthLabel = '',
    matchColor = '',
    sourceCaseId = null,
  } = data;

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

  const { isModalOpen, onClose } = useGlobalModal();

  return (
    <Modal.Backdrop
      isOpen={isModalOpen}
      onOpenChange={onClose}
      variant="opaque"
      isDismissable={true}
    >
      <Modal.Container placement="center" scroll="inside" size="2xl">
        <Modal.Dialog aria-label="Evidence Details" aria-labelledby="evidence-details-modal-title">
          <Modal.Header className="pt-0 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <NotebookText className="size-5 text-slate-600" />
              </div>
              <div>
                <h2 id="evidence-details-modal-title" className="text-lg font-semibold">
                  {title || 'Evidence Details'}
                </h2>
              </div>
            </div>
          </Modal.Header>

          <Modal.Body className="gap-6 px-2">
            <div className="space-y-8">
              {/* Metadata badges */}
              {matchPercentage && (
                <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-center gap-2 text-sm py-2 px-3 rounded-md bg-gray-100 font-semibold text-gray-600">
                    <NotebookText className="size-4" />
                    <span>Source Case {sourceCaseId}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <Chip
                    size="sm"
                    variant="secondary"
                    className="text-xs py-0.5 text-white font-bold"
                    style={{
                      backgroundColor: matchColor,
                    }}
                  >
                    {matchPercentage}%&nbsp;&nbsp;Similarity
                  </Chip>
                  <span className="text-gray-400">•</span>
                  <div
                    className="text-xs font-bold tracking-wide uppercase"
                    style={{ color: matchColor }}
                  >
                    {matchStrengthLabel}
                  </div>
                </div>
              )}

              {/* Content sections */}
              {hasSeparateSections ? (
                <>
                  <div>
                    <div className="flex items-center gap-2.5 mb-4 pb-3 border-b-2 border-emerald-600">
                      <Target className="size-5 text-emerald-600" strokeWidth={2} />
                      <h3 className="m-0 text-lg font-semibold text-gray-900">Problem Addressed</h3>
                    </div>
                    <p className="m-0 text-base leading-7 text-gray-600">{problemPart}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5 mb-3 pb-2 border-b-2 border-emerald-600">
                      <Lightbulb className="size-5 text-emerald-600" strokeWidth={2} />
                      <h3 className="m-0 text-lg font-semibold text-gray-900">Solution Approach</h3>
                    </div>
                    <p className="m-0 text-base leading-7 text-gray-600">{solutionPart}</p>
                  </div>
                </>
              ) : (
                <p className="m-0 leading-7 text-gray-600">{content}</p>
              )}
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

ResultsDatabaseEvidenceDetailsModal.propTypes = {
  isModalOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.shape({
    title: PropTypes.string,
    content: PropTypes.string,
    caseItem: PropTypes.object,
    matchPercentage: PropTypes.number,
    matchStrengthLabel: PropTypes.string,
    matchColor: PropTypes.string,
    sourceCaseId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
};
