import React from 'react';
import PropTypes from 'prop-types';
import { ClipboardMinus, X } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';

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
  return (
    <Modal
      isOpen={isModalOpen}
      onOpenChange={onClose}
      size="2xl"
      scrollBehavior="inside"
      backdrop="opaque"
      placement="center"
      hideCloseButton={true}
      classNames={{
        backdrop: 'bg-black/50',
        base: 'bg-white rounded-2xl shadow-xl',
      }}
    >
      <ModalContent className="outline-none focus:outline-none focus-visible:outline-none ring-0">
        <ModalHeader className="flex items-center gap-3 py-5">
          <div className="p-2 bg-teal-100 rounded-lg">
            <ClipboardMinus className="text-teal-600" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[#2c3e50]">Business Solution Guide</h2>
            <p className="text-gray-500 text-xs">How your business solves the problem</p>
          </div>
          <Button
            isIconOnly
            variant="light"
            onPress={onClose}
            aria-label="Close"
            className="ml-auto hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </Button>
        </ModalHeader>
        <ModalBody className="gap-5 py-6 px-6">
          <p className="leading-relaxed text-gray-700">
            Describe <strong>how your business solves the problem</strong> with technical details
            about materials, processes, partnerships, and outcomes.
          </p>

          <div className="p-4 bg-gradient-to-br from-teal-50 to-green-50 rounded-xl border border-teal-200">
            <h4 className="mb-3 text-base font-bold text-teal-700">Critical Components</h4>
            <ul className="space-y-2">
              {SOLUTION_COMPONENTS.map(({ title, description }) => (
                <li key={title} className="border-l-3 border-teal-400 pl-3 text-sm">
                  <strong className="text-teal-900">{title}</strong>
                  <p className="text-gray-700 text-xs mt-0.5">{description}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200">
            <h4 className="mb-3 text-base font-bold text-orange-700">Common Pitfalls</h4>
            <ul className="space-y-1">
              {SOLUTION_PITFALLS.map((pitfall) => (
                <li key={pitfall} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-orange-500 font-bold">×</span>
                  <span>{pitfall}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
            <h4 className="mb-3 text-base font-bold text-emerald-700">Pro Tips</h4>
            <ul className="space-y-1">
              {SOLUTION_PRO_TIPS.map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-2 text-base font-bold text-indigo-700">Example Statement</h4>
            <p className="p-3 italic text-sm leading-relaxed text-gray-700 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border border-l-4 border-indigo-200 border-l-indigo-500">
              {SOLUTION_EXAMPLE}
            </p>
          </div>

          <p className="text-xs italic text-gray-500 p-3 bg-gray-100 rounded-lg">
            ⚠️ <strong>Minimum 200 characters required</strong>
          </p>
        </ModalBody>
        <ModalFooter className="gap-2 py-2" />
      </ModalContent>
    </Modal>
  );
}

BusinessSolutionInfoModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  isModalOpen: PropTypes.bool.isRequired,
};
