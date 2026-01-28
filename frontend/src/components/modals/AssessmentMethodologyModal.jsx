import React from 'react';
import PropTypes from 'prop-types';

const METHODOLOGY_ITEMS = [
  {
    icon: '🔍',
    title: 'Semantic Analysis',
    description:
      'Uses OpenAI text-embedding-3-small (1536 dimensions) to find the most relevant projects matching your business model and problem space.',
    borderColor: 'border-blue-500',
  },
  {
    icon: '🤖',
    title: 'AI Reasoning',
    description:
      'GPT-4o-mini analyzes your submission against 3 similar cases with strict evidence-based reasoning and integrity checking.',
    borderColor: 'border-emerald-600',
  },
  {
    icon: '📊',
    title: 'Multi-Dimensional Scoring',
    description:
      'Evaluates across 8 weighted parameters covering material innovation, circularity loops, market viability, and environmental impact.',
    borderColor: 'border-orange-500',
  },
  {
    icon: '✓',
    title: 'Integrity Validation',
    description:
      'Cross-references your self-assessed scores against real-world benchmarks to identify overestimations and provide honest feedback.',
    borderColor: 'border-purple-600',
  },
];

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
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-gradient-to-r from-purple-500 to-pink-600">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/20">
              <span className="text-2xl">📊</span>
            </div>
            <h2 className="m-0 text-2xl font-bold text-white">Assessment Methodology</h2>
          </div>
          <button
            className="flex items-center justify-center p-2 text-white transition-all border-none rounded-lg cursor-pointer bg-white/20 hover:bg-white/30 w-9 h-9"
            onClick={onClose}
          >
            <span className="mb-0.5 text-3xl font-extrabold leading-none">×</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          <p className="mb-6 leading-relaxed text-gray-600">
            This evaluation uses a proprietary AI-powered framework combining vector similarity
            search with GPT-4o-mini reasoning against a database of 1,108 high-quality circular
            economy projects.
          </p>

          <div className="grid grid-cols-1 gap-5 mb-6 md:grid-cols-2">
            {METHODOLOGY_ITEMS.map((item, idx) => (
              <div key={idx} className={`p-5 border-l-4 ${item.borderColor} rounded-lg bg-gray-50`}>
                <h4 className="m-0 mb-3 font-bold text-slate-800">
                  {item.icon} {item.title}
                </h4>
                <p className="m-0 text-sm leading-relaxed text-gray-700">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="p-5 mb-6 border-2 rounded-lg bg-emerald-50 border-emerald-600">
            <h4 className="m-0 mb-3 font-bold text-emerald-900">📚 Data Source</h4>
            <p className="m-0 text-sm leading-relaxed text-emerald-900">
              <strong>GreenTechGuardians AI EarthHack Dataset:</strong> A curated collection of
              1,108 high-quality circular economy solutions (filtered from 1,300) spanning waste
              reduction, resource optimization, renewable energy, sustainable materials, and
              regenerative agriculture across multiple industries and geographic regions.
            </p>
          </div>

          <div className="p-4 mb-4 border-l-4 border-orange-500 rounded bg-orange-50">
            <p className="m-0 text-sm leading-relaxed text-orange-900">
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

AssessmentMethodologyModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
