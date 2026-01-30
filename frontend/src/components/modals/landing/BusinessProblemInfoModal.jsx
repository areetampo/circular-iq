import React from 'react';
import PropTypes from 'prop-types';
import { ClipboardMinus } from 'lucide-react';
import ModalHeading from '../core/ModalHeading';
import { LANDING_MODALS } from '../core/modalTypes';

const PROBLEM_ELEMENTS = [
  {
    title: 'Environmental Impact',
    description:
      'Specific waste, pollution, or resource depletion issue (e.g., "8M tons of plastic waste entering oceans annually").',
  },
  {
    title: 'Quantified Scale',
    description:
      'Use real numbers, percentages, or measurements to show magnitude (tons, percent of market, number of people affected).',
  },
  {
    title: 'Current Gaps',
    description:
      'Why existing solutions fail (cost barriers, infrastructure limits, behavior challenges, regulation issues).',
  },
  {
    title: 'Stakeholders Affected',
    description:
      'Who experiences this problem and how (consumers, businesses, communities, ecosystems).',
  },
  {
    title: 'Geographic Context',
    description: 'Where this problem is most acute (local, regional, national, global).',
  },
  {
    title: 'Urgency Indicators',
    description:
      'Why this needs solving now (regulatory pressure, market demand, environmental tipping points).',
  },
];

const PROBLEM_WRITING_TIPS = [
  'Start with a compelling statistic or fact.',
  'Use specific numbers instead of vague terms.',
  'Connect the problem to economic or social costs.',
  'Reference industry standards or regulations when relevant.',
  'Cite sources if available (e.g., EPA, industry studies).',
];

const PROBLEM_EXAMPLE =
  'Single-use plastic packaging creates 8 million tons of ocean waste annually, disrupting marine ecosystems and food chains. Current alternatives are cost-prohibitive (> $2/unit) or require industrial composting infrastructure that 75% of municipalities lack. This leaves a gap between demand for sustainable packaging and practical implementation at scale.';

export default function BusinessProblemInfoModal({ onClose, isModalOpen }) {
  if (!isModalOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[85vh] bg-white shadow-2xl rounded-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeading
          title="Business Problem Statement Guide"
          onClose={onClose}
          icon={<ClipboardMinus />}
          type={LANDING_MODALS.BUSINESS_PROBLEM_INFO}
        />

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-5">
            <p className="leading-relaxed">
              Describe the <strong>environmental or circular economy challenge</strong> your
              business addresses. Provide a clear, quantified problem statement that shows the scope
              and impact.
            </p>

            <div className="p-4 bg-gray-100 rounded">
              <h4 className="m-0 mb-3 text-lg font-bold text-emerald-600">
                Essential Elements to Include:
              </h4>
              <ul className="pl-6 m-0 space-y-2 leading-relaxed">
                {PROBLEM_ELEMENTS.map(({ title, description }) => (
                  <li key={title}>
                    <strong>{title}:</strong> {description}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded bg-blue-50">
              <h4 className="m-0 mb-3 text-lg font-bold text-blue-600">Writing Tips:</h4>
              <ul className="pl-6 m-0 space-y-2 leading-relaxed">
                {PROBLEM_WRITING_TIPS.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="m-0 text-lg font-bold text-blue-500">Example Problem Statement:</h4>
              <p className="p-3 italic leading-relaxed text-gray-700 rounded bg-blue-50">
                {PROBLEM_EXAMPLE}
              </p>
            </div>

            <p className="mt-2 italic text-gray-500">
              <strong>Minimum 200 characters required</strong> for accurate matching and analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

BusinessProblemInfoModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  isModalOpen: PropTypes.bool.isRequired,
};
