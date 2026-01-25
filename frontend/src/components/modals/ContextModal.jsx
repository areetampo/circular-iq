import { extractProblemSolution } from '../../utils/helpers';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader className="border-b border-slate-200">
          <div>
            <DialogTitle className="text-emerald-600 text-2xl font-bold">
              {title || 'Full Context'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Detailed context about the similar case including problem and solution
            </DialogDescription>
            {matchPercentage && (
              <div className="flex items-center gap-2.5 flex-wrap mt-3">
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
        </DialogHeader>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto">
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
      </DialogContent>
    </Dialog>
  );
}
