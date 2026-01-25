import React, { Suspense, lazy } from 'react';
import PropTypes from 'prop-types';

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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
            <h2 className="m-0 text-white text-2xl font-bold">Market Analysis</h2>
          </div>
          <button
            className="bg-white/20 hover:bg-white/30 border-none text-white p-2 w-9 h-9 flex items-center justify-center rounded-lg transition-all cursor-pointer"
            onClick={onClose}
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
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

MarketAnalysisModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentAssessmentScore: PropTypes.number,
  currentIndustry: PropTypes.string,
};
