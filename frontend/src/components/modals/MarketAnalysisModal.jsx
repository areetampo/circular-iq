import React, { Suspense, lazy } from 'react';

const MarketAnalysisView = lazy(() => import('../../views/MarketAnalysisView'));

export default function MarketAnalysisModal({
  isOpen,
  onClose,
  currentAssessmentScore,
  currentIndustry,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[2000] p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 bg-white border-none text-2xl cursor-pointer text-gray-400 p-1 w-10 h-10 flex items-center justify-center rounded z-10 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>

        {/* Content */}
        <div className="overflow-y-auto flex-1 pt-10">
          <Suspense
            fallback={
              <div className="p-12 text-center">
                <p className="text-gray-500">Loading market analysis...</p>
              </div>
            }
          >
            <MarketAnalysisView
              currentAssessmentScore={currentAssessmentScore}
              currentIndustry={currentIndustry}
              onBack={onClose}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
