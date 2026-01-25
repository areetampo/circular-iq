import { extractProblemSolution } from '../../utils/helpers';

export default function ContextModal({
  onClose,
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
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-start p-6 border-b border-slate-200">
          <div className="flex-1">
            <h2 className="m-0 mb-3 text-emerald-600 text-2xl font-semibold">
              {title || 'Full Context'}
            </h2>
            {matchPercentage && (
              <div className="flex items-center gap-2.5 flex-wrap">
                <div
                  className="text-white px-3.5 py-1.5 rounded-full text-sm font-semibold"
                  style={{ background: matchColor || '#34a83a' }}
                >
                  {matchPercentage}% Similarity
                </div>
                <div
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: matchColor || '#34a83a' }}
                >
                  {matchStrength || 'Match'}
                </div>
                {sourceCaseId && (
                  <div className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-xs font-semibold">
                    📄 Source Case {sourceCaseId}
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            className="bg-none border-none text-3xl cursor-pointer text-gray-400 p-0 w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 hover:text-slate-800"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {hasSeparateSections ? (
            <>
              <div className="mb-7 last:mb-0">
                <div className="flex items-center gap-2.5 mb-3 pb-2 border-b-2 border-emerald-600">
                  <span className="text-2xl">🎯</span>
                  <h3 className="m-0 text-lg font-semibold text-slate-800">Problem Addressed</h3>
                </div>
                <p className="leading-relaxed text-slate-800 m-0 text-base">{problemPart}</p>
              </div>

              <div className="mb-7 last:mb-0">
                <div className="flex items-center gap-2.5 mb-3 pb-2 border-b-2 border-emerald-600">
                  <span className="text-2xl">💡</span>
                  <h3 className="m-0 text-lg font-semibold text-slate-800">Solution Approach</h3>
                </div>
                <p className="leading-relaxed text-slate-800 m-0 text-base">{solutionPart}</p>
              </div>
            </>
          ) : (
            <p className="leading-relaxed text-slate-800 m-0">{content}</p>
          )}
        </div>
      </div>
    </div>
  );
}
