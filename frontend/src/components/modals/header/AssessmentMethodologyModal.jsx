import React from 'react';
import PropTypes from 'prop-types';
import {
  Search,
  Bot,
  ChartColumn,
  CircleCheck,
  BookCopy,
  TriangleAlert,
  ChartSpline,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';

const METHODOLOGY_ITEMS = [
  {
    icon: <Search size={20} />,
    title: 'Semantic Analysis',
    description:
      'Uses OpenAI text-embedding-3-small (1536 dimensions) to find the most relevant projects matching your business model and problem space.',
    borderColor: 'border-blue-500',
  },
  {
    icon: <Bot size={20} />,
    title: 'AI Reasoning',
    description:
      'GPT-4o-mini analyzes your submission against 3 similar cases with strict evidence-based reasoning and integrity checking.',
    borderColor: 'border-emerald-600',
  },
  {
    icon: <ChartColumn size={20} />,
    title: 'Multi-Dimensional Scoring',
    description:
      'Evaluates across 8 weighted parameters covering material innovation, circularity loops, market viability, and environmental impact.',
    borderColor: 'border-orange-500',
  },
  {
    icon: <CircleCheck size={20} />,
    title: 'Integrity Validation',
    description:
      'Cross-references your self-assessed scores against real-world benchmarks to identify overestimations and provide honest feedback.',
    borderColor: 'border-purple-600',
  },
];

export default function AssessmentMethodologyModal({ isModalOpen, onClose }) {
  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogClose
        className="absolute top-4 right-4"
        aria-label="Close assessment methodology modal"
      >
        <X className="w-5 h-5 text-gray-500 hover:text-gray-700" strokeWidth={2} />
      </DialogClose>
      <DialogContent className="w-full max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200">
          <DialogTitle className="text-2xl font-bold text-[#2c3e50] flex items-center gap-2">
            <ChartSpline /> Assessment Methodology
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Our AI-powered evaluation framework
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <p className="mb-6 leading-relaxed text-gray-600">
            This evaluation uses a proprietary AI-powered framework combining vector similarity
            search with GPT-4o-mini reasoning against a database of 1,108 high-quality circular
            economy projects.
          </p>

          <div className="grid grid-cols-1 gap-5 mb-6 md:grid-cols-2">
            {METHODOLOGY_ITEMS.map((item, idx) => (
              <div key={idx} className={`p-5 border-l-4 ${item.borderColor} rounded-lg bg-gray-50`}>
                <h4 className="flex items-center gap-2 m-0 mb-3 font-bold text-slate-800">
                  {item.icon} {item.title}
                </h4>
                <p className="m-0 text-sm leading-relaxed text-gray-700">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="p-5 mb-6 border-2 rounded-lg bg-emerald-50 border-emerald-600">
            <h4 className="flex items-center gap-3 m-0 mb-3 font-bold justify-left text-emerald-900">
              <BookCopy size={20} /> Data Source
            </h4>
            <p className="m-0 text-sm leading-relaxed text-emerald-900">
              <strong>GreenTechGuardians AI EarthHack Dataset:</strong> A curated collection of
              1,108 high-quality circular economy solutions (filtered from 1,300) spanning waste
              reduction, resource optimization, renewable energy, sustainable materials, and
              regenerative agriculture across multiple industries and geographic regions.
            </p>
          </div>

          <div className="p-4 mb-4 border-l-4 border-orange-500 rounded bg-orange-50">
            <p className="m-0 text-sm leading-relaxed text-orange-900">
              <strong className="flex items-center gap-2">
                <TriangleAlert size={16} /> Disclaimer:
              </strong>
              &nbsp; This assessment is designed to provide constructive feedback for early-stage
              ideation. Scores reflect alignment with established circular economy principles and
              should be used as guidance, not as definitive validation of commercial viability.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

AssessmentMethodologyModal.propTypes = {
  isModalOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
