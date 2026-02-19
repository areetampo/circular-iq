import React from 'react';
import { cn } from '@/utils/cn';
import { ClipboardMinus, X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';

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

export default function BusinessSolutionInfoDrawer() {
  const { isDrawerOpen, onClose } = useGlobalDrawer();
  const direction = useDrawerDirection();

  return (
    <Drawer
      open={isDrawerOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      direction={direction}
    >
      <DrawerContent direction={direction} aria-label="Business Solution Guide">
        <DrawerHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2 rounded-lg bg-teal-100 shrink-0',
                  'transition-[transform,box-shadow] duration-300 ease-out',
                  isDrawerOpen
                    ? 'scale-[1.12] -rotate-6 drop-shadow-md'
                    : 'hover:scale-110 hover:-rotate-6 hover:shadow-md',
                )}
              >
                <ClipboardMinus className="size-5 text-teal-600" strokeWidth={1.75} />
              </div>
              <div>
                <DrawerTitle className="text-lg font-semibold">Business Solution Guide</DrawerTitle>
                <DrawerDescription className="text-sm text-gray-600">
                  How your business solves the problem
                </DrawerDescription>
              </div>
            </div>

            {direction === 'right' && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </DrawerHeader>
        <DrawerBody className="gap-6">
          <div className="space-y-6">
            <p className="leading-relaxed text-gray-700">
              Describe <strong>how your business solves the problem</strong> with technical details
              about materials, processes, partnerships, and outcomes.
            </p>

            <div className="p-4 bg-teal-50 rounded-xl border border-teal-200">
              <h4 className="mb-3 text-base font-bold text-teal-700">Critical Components</h4>
              <div className="space-y-2">
                {SOLUTION_COMPONENTS.map((item, idx) => (
                  <div
                    key={idx}
                    className={[
                      'group/card relative flex items-start gap-3.5',
                      'p-4 rounded-xl border border-transparent',
                      'bg-linear-to-br from-teal-50 to-emerald-50',
                      'border-l-4 border-teal-200',
                      'transition-all duration-300 ease-out cursor-default select-none',
                      'hover:shadow-md hover:-translate-y-0.5',
                    ].join(' ')}
                  >
                    <div
                      className="shrink-0 p-2 rounded-lg bg-teal-100 mt-0.5
                                    transition-[transform,box-shadow] duration-300 ease-out
                                    group-hover/card:scale-110 group-hover/card:-rotate-6 group-hover/card:shadow-md"
                    >
                      <ClipboardMinus className="size-4 text-teal-600" strokeWidth={1.75} />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-bold text-gray-800 leading-snug">
                        {item.title}
                      </span>
                      <span className="text-xs text-gray-500 leading-relaxed">
                        {item.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
              <h4 className="mb-3 text-base font-bold text-orange-700">Common Pitfalls</h4>
              <ul className="space-y-1">
                {SOLUTION_PITFALLS.map((pitfall) => (
                  <li key={pitfall} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-orange-500 font-bold">×</span>
                    <span>{pitfall}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <h4 className="mb-3 text-base font-bold text-emerald-700">Pro Tips</h4>
              <ul className="space-y-1">
                {SOLUTION_PRO_TIPS.map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-2 text-base font-bold text-indigo-700">Example Statement</h4>
              <p className="p-3 italic text-sm leading-relaxed text-gray-600 rounded-lg bg-indigo-50 border border-l-4 border-indigo-300 border-l-indigo-500">
                {SOLUTION_EXAMPLE}
              </p>
            </div>

            <p className="text-xs italic text-gray-500 p-3 bg-gray-100 rounded-lg">
              ⚠️ <strong>Minimum 200 characters required</strong>
            </p>
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
