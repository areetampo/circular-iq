import React from 'react';
import PropTypes from 'prop-types';
import { extractProblemSolution } from '@/utils/helpers';
import { NotebookText } from 'lucide-react';
import ModalHeading from '@/components/modals/core/ModalHeading';
import { RESULTS_MODALS } from '@/components/modals/core/modalTypes';

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
  if (!isModalOpen) return null;

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
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[80vh] bg-white shadow-2xl rounded-2xl animate-in zoom-in-95 duration-200 overflow-y-auto hide-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          /* Hide scrollbar for webkit browsers (Chrome, Safari, Edge) */
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }

          /* Hide scrollbar for Firefox */
          .hide-scrollbar {
            scrollbar-width: none;
          }

          /* Hide scrollbar for IE/Edge */
          .hide-scrollbar {
            -ms-overflow-style: none;
          }
        `}</style>

        <ModalHeading
          title={title || 'Evidence Details'}
          icon={NotebookText}
          onClose={onClose}
          type={RESULTS_MODALS.DATABASE_EVIDENCE_DETAILS}
        />

        {/* Body */}
        <div className="p-6">
          {/* Metadata badges */}
          {matchPercentage && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="flex items-center justify-center gap-2 text-sm py-1 px-2 mt-0.5 text-gray-700 rounded-sm bg-[#f3f4f6] font-semibold">
                <NotebookText size={16} />
                <span className="pt-[0.5px]">Source Case {sourceCaseId}</span>
              </div>
              <span>&middot;</span>
              <div className="px-3 py-2 text-xs font-bold text-white rounded-full bg-emerald-600">
                {matchPercentage}%&nbsp;&nbsp;Similarity
              </div>
              <span>&middot;</span>
              <div
                className="pt-0.5 text-xs font-bold tracking-wide uppercase text-nowrap"
                style={{ color: matchColor }}
              >
                {matchStrength}
              </div>
            </div>
          )}

          {/* Content sections */}
          {hasSeparateSections ? (
            <>
              <div className="mb-7">
                <div className="flex items-center gap-2.5 mb-3 pb-2 border-b-2 border-[#34a83a]">
                  <span className="text-2xl">🎯</span>
                  <h3 className="m-0 text-lg font-semibold text-slate-800">Problem Addressed</h3>
                </div>
                <p className="m-0 text-base leading-7 text-slate-800">{problemPart}</p>
              </div>

              <div className="mb-7">
                <div className="flex items-center gap-2.5 mb-3 pb-2 border-b-2 border-[#34a83a]">
                  <span className="text-2xl">💡</span>
                  <h3 className="m-0 text-lg font-semibold text-slate-800">Solution Approach</h3>
                </div>
                <p className="m-0 text-base leading-7 text-slate-800">{solutionPart}</p>
              </div>
            </>
          ) : (
            <>
              <p className="m-0 mb-6 leading-7 text-slate-800">{content}</p>
            </>
          )}

          {/* Close button - appears right after solution text */}
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-semibold text-white transition-colors border-none rounded-lg cursor-pointer bg-emerald-600 hover:bg-emerald-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
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
