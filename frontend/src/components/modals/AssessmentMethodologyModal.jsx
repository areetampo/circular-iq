import React from 'react';

export default function AssessmentMethodologyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-purple-500 to-pink-600 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <h2 className="m-0 text-white text-2xl font-bold">Assessment Methodology</h2>
          </div>
          <button
            className="bg-white/20 hover:bg-white/30 border-none text-white p-2 w-9 h-9 flex items-center justify-center rounded-lg transition-all cursor-pointer"
            onClick={onClose}
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          <p className="text-gray-600 mb-6 leading-relaxed">
            This evaluation uses a proprietary AI-powered framework combining vector similarity
            search with GPT-4o-mini reasoning against a database of 1,108 high-quality circular
            economy projects.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div className="bg-gray-50 p-5 rounded-lg border-l-4 border-blue-500">
              <h4 className="m-0 mb-3 text-slate-800 font-bold">🔍 Semantic Analysis</h4>
              <p className="m-0 text-sm text-gray-700 leading-relaxed">
                Uses OpenAI text-embedding-3-small (1536 dimensions) to find the most relevant
                projects matching your business model and problem space.
              </p>
            </div>

            <div className="bg-gray-50 p-5 rounded-lg border-l-4 border-emerald-600">
              <h4 className="m-0 mb-3 text-slate-800 font-bold">🤖 AI Reasoning</h4>
              <p className="m-0 text-sm text-gray-700 leading-relaxed">
                GPT-4o-mini analyzes your submission against 3 similar cases with strict
                evidence-based reasoning and integrity checking.
              </p>
            </div>

            <div className="bg-gray-50 p-5 rounded-lg border-l-4 border-orange-500">
              <h4 className="m-0 mb-3 text-slate-800 font-bold">📊 Multi-Dimensional Scoring</h4>
              <p className="m-0 text-sm text-gray-700 leading-relaxed">
                Evaluates across 8 weighted parameters covering material innovation, circularity
                loops, market viability, and environmental impact.
              </p>
            </div>

            <div className="bg-gray-50 p-5 rounded-lg border-l-4 border-purple-600">
              <h4 className="m-0 mb-3 text-slate-800 font-bold">✓ Integrity Validation</h4>
              <p className="m-0 text-sm text-gray-700 leading-relaxed">
                Cross-references your self-assessed scores against real-world benchmarks to identify
                overestimations and provide honest feedback.
              </p>
            </div>
          </div>

          <div className="bg-emerald-50 p-5 rounded-lg border-2 border-emerald-600 mb-6">
            <h4 className="m-0 mb-3 text-emerald-900 font-bold">📚 Data Source</h4>
            <p className="m-0 text-sm text-emerald-900 leading-relaxed">
              <strong>GreenTechGuardians AI EarthHack Dataset:</strong> A curated collection of
              1,108 high-quality circular economy solutions (filtered from 1,300) spanning waste
              reduction, resource optimization, renewable energy, sustainable materials, and
              regenerative agriculture across multiple industries and geographic regions.
            </p>
          </div>

          <div className="p-4 bg-orange-50 rounded border-l-4 border-orange-500">
            <p className="m-0 text-sm text-orange-900 leading-relaxed">
              <strong>⚠️ Disclaimer:</strong> This assessment is designed to provide constructive
              feedback for early-stage ideation. Scores reflect alignment with established circular
              economy principles and should be used as guidance, not as definitive validation of
              commercial viability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
