import { Drawer } from '@heroui/react';
import { ClipboardMinus } from 'lucide-react';

import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';
import { cn } from '@/utils/cn';

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

export default function BusinessProblemInfoDrawer() {
  const { isDrawerOpen, onClose } = useGlobalDrawer();
  const direction = useDrawerDirection();

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      placement={direction === 'right' ? 'right' : 'left'}
    >
      <Drawer.Backdrop>
        <Drawer.Content>
          <Drawer.Dialog>
            <Drawer.Header>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-lg bg-emerald-100 shrink-0',
                      'transition-[transform,box-shadow] duration-300 ease-out',
                      isDrawerOpen
                        ? 'scale-[1.12] -rotate-6 drop-shadow-md'
                        : 'hover:scale-110 hover:-rotate-6 hover:shadow-md',
                    )}
                  >
                    <ClipboardMinus className="size-5 text-emerald-600" strokeWidth={1.75} />
                  </div>
                  <div>
                    <Drawer.Heading className="text-lg font-semibold">
                      Business Problem Guide
                    </Drawer.Heading>
                    <p className="text-sm text-gray-600">
                      Environmental or circular economy challenge
                    </p>
                  </div>
                </div>

                {direction === 'right' && <Drawer.CloseTrigger />}
              </div>
            </Drawer.Header>
            <Drawer.Body className="gap-6">
              <div className="space-y-6">
                <p className="leading-relaxed text-gray-700">
                  Describe the <strong>environmental or circular economy challenge</strong> your
                  business addresses.
                </p>

                <div className="p-4 border border-emerald-200 bg-emerald-50 rounded-xl">
                  <h4 className="mb-3 text-base font-bold text-emerald-700">Essential Elements</h4>
                  <div className="space-y-2">
                    {PROBLEM_ELEMENTS.map((item, idx) => (
                      <div
                        key={idx}
                        className={[
                          'group/card relative flex items-start gap-3.5',
                          'p-4 rounded-xl border border-transparent',
                          'bg-linear-to-br from-emerald-50 to-teal-50',
                          'border-l-4 border-emerald-400',
                          'transition-all duration-300 ease-out cursor-default select-none',
                          'hover:shadow-md hover:-translate-y-0.5',
                        ].join(' ')}
                      >
                        <div
                          className="shrink-0 p-2 rounded-lg bg-emerald-100 mt-0.5
                                    transition-[transform,box-shadow] duration-300 ease-out
                                    group-hover/card:scale-110 group-hover/card:-rotate-6 group-hover/card:shadow-md"
                        >
                          <ClipboardMinus className="size-4 text-emerald-600" strokeWidth={1.75} />
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

                <div className="p-4 border border-blue-200 bg-blue-50 rounded-xl">
                  <h4 className="mb-3 text-base font-bold text-blue-700">Writing Tips</h4>
                  <ul className="space-y-1">
                    {PROBLEM_WRITING_TIPS.map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="font-bold text-blue-500">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="mb-2 text-base font-bold text-indigo-700">Example Statement</h4>
                  <p className="p-3 text-sm italic leading-relaxed text-gray-600 border border-l-4 border-indigo-300 border-l-indigo-500 rounded-lg bg-indigo-50">
                    {PROBLEM_EXAMPLE}
                  </p>
                </div>

                <p className="p-3 text-xs italic text-gray-500 bg-gray-100 rounded-lg">
                  ⚠️️️ <strong>Minimum 200 characters required</strong>
                </p>
              </div>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
