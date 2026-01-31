import React from 'react';
import PropTypes from 'prop-types';
import { extractProblemSolution } from '@/utils/content';
import { NotebookText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';

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
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogClose className="absolute top-4 right-4">✖️</DialogClose>
      <DialogContent className="w-full max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200">
          <DialogTitle className="text-2xl font-bold text-[#2c3e50] flex items-center gap-2">
            <NotebookText /> {title || 'Evidence Details'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Database evidence from similar circular economy projects
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6 overflow-y-auto max-h-[calc(90vh-120px)]">
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
      </DialogContent>
    </Dialog>
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
