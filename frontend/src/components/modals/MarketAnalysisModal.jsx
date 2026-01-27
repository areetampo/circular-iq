import React, { Suspense, lazy } from 'react';
import PropTypes from 'prop-types';
import Loader from '../feedback/Loader';

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
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/20">
              <span className="text-2xl">📈</span>
            </div>
            <h2 className="m-0 text-2xl font-bold text-white">Market Analysis</h2>
          </div>
          <button
            className="flex items-center justify-center p-2 text-white transition-all border-none rounded-lg cursor-pointer bg-white/20 hover:bg-white/30 w-9 h-9"
            onClick={onClose}
          >
            <span className="text-3xl font-extrabold leading-none">×</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Suspense
            fallback={
              <Loader
                heading="Loading Market Analysis..."
                message="Fetching market data and insights."
              />
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
