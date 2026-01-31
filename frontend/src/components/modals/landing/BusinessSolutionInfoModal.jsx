import React from 'react';
import PropTypes from 'prop-types';
import { ClipboardMinus } from 'lucide-react';
import ModalHeading from '@/components/modals/core/ModalHeading';
import { LANDING_MODALS } from '@/components/modals/core/modalTypes';

const SOLUTION_COMPONENTS = [
  {
    title: 'Materials and Inputs',
    description:
      'Exact materials used with specifications (post-consumer PET, agricultural hemp fiber, recycled aluminum).',
  },
  {
    title: 'Process and Technology',
    description:
      'Step-by-step transformation process and standards met (e.g., mechanical sorting, washing, pelletizing at 230C).',
  },
  {
    title: 'Business Model and Logistics',
    description:
      'How you collect, process, and distribute (hub-and-spoke, delivery-as-a-service, reverse logistics network).',
  },
  {
    title: 'Circularity Loop',
    description:
      'How materials return to use (composted material sold to farms, returning to feedstock for your product).',
  },
  {
    title: 'Key Performance Metrics',
    description:
      'Quantified results (recovery rate, unit cost, composting time, carbon footprint vs virgin materials).',
  },
  {
    title: 'Partnerships and Infrastructure',
    description:
      'Key collaborators (waste management partners, processing facilities, certification bodies, distribution channels).',
  },
  {
    title: 'Scalability Path',
    description:
      'How the solution grows (pilot to regional to national; target units per month by year 2).',
  },
  {
    title: 'Economic Viability',
    description: 'Revenue model, cost structure, and comparison to conventional alternatives.',
  },
];

const SOLUTION_PITFALLS = [
  'Avoid vague descriptions; provide specific materials and processes.',
  'Avoid missing technical details; include equipment, temperatures, and cycle times.',
  'Avoid absent metrics; include recovery rates, costs, and carbon impact.',
  'Avoid unclear loop closure; explain how materials re-enter the system.',
];

const SOLUTION_PRO_TIPS = [
  'Use industry-standard terminology and note certifications.',
  'Include both environmental and economic metrics.',
  'Mention regulatory compliance (FDA, EPA, ISO, etc.).',
  'Compare to conventional alternatives (cost, performance, impact).',
  'Show real-world validation (pilots, customers, third-party testing).',
];

const SOLUTION_EXAMPLE =
  'We convert agricultural hemp waste into compostable mailers and run a hub-and-spoke collection model. Customers use prepaid mailers; 15 regional hubs aggregate returns; certified composters process 95% of materials within 90 days into soil amendments. Those amendments are sold back to hemp farms, creating a closed loop. Cost: $0.85 per unit at scale; home-compostable in 180 days.';

export default function BusinessSolutionInfoModal({ onClose, isModalOpen }) {
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
          title="Business Solution Statement Guide"
          onClose={onClose}
          icon={<ClipboardMinus />}
          type={LANDING_MODALS.BUSINESS_SOLUTION_INFO}
        />

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-5">
            <p className="leading-relaxed">
              Describe <strong>how your business solves the problem</strong> with a detailed,
              technical explanation of your circular economy approach. Be specific about materials,
              processes, partnerships, and measurable outcomes.
            </p>

            <div className="p-4 bg-gray-100 rounded">
              <h4 className="m-0 mb-3 text-lg font-bold text-emerald-600">
                Critical Components to Address:
              </h4>
              <ul className="pl-6 m-0 space-y-2 leading-relaxed">
                {SOLUTION_COMPONENTS.map(({ title, description }) => (
                  <li key={title}>
                    <strong>{title}:</strong> {description}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 border border-orange-200 rounded bg-orange-50">
              <h4 className="m-0 mb-3 text-lg font-bold text-orange-600">
                Common Pitfalls to Avoid:
              </h4>
              <ul className="pl-6 m-0 space-y-2 leading-relaxed">
                {SOLUTION_PITFALLS.map((pitfall) => (
                  <li key={pitfall}>{pitfall}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 border rounded bg-emerald-50 border-emerald-200">
              <h4 className="m-0 mb-3 text-lg font-bold text-emerald-700">
                Pro Tips for Strong Solutions:
              </h4>
              <ul className="pl-6 m-0 space-y-2 leading-relaxed">
                {SOLUTION_PRO_TIPS.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="m-0 text-lg font-bold text-blue-500">Example Solution Statement:</h4>
              <p className="p-3 italic leading-relaxed text-gray-700 rounded bg-blue-50">
                {SOLUTION_EXAMPLE}
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

BusinessSolutionInfoModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  isModalOpen: PropTypes.bool.isRequired,
};
