import { Drawer } from '@heroui/react';
import {
  BookCopy,
  Bot,
  ChartColumn,
  ChartSpline,
  CircleCheck,
  Search,
  TriangleAlert,
} from 'lucide-react';
import React from 'react';

import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';
import { cn } from '@/utils/cn';

const METHODOLOGY_ITEMS = [
  {
    icon: <Search />,
    title: 'Semantic Analysis',
    description:
      'Uses OpenAI text-embedding-3-small (1536 dimensions) to find the most relevant projects matching your business model and problem space.',
    accentBorder: 'border-blue-400',
    gradientFrom: 'from-blue-50',
    gradientTo: 'to-cyan-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    icon: <Bot />,
    title: 'AI Reasoning',
    description:
      'GPT-4o-mini analyzes your submission against 3 similar cases with strict evidence-based reasoning and integrity checking.',
    accentBorder: 'border-emerald-400',
    gradientFrom: 'from-emerald-50',
    gradientTo: 'to-green-50',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    icon: <ChartColumn />,
    title: 'Multi-Dimensional Scoring',
    description:
      'Evaluates across 8 weighted parameters covering material innovation, circularity loops, market viability, and environmental impact.',
    accentBorder: 'border-orange-400',
    gradientFrom: 'from-orange-50',
    gradientTo: 'to-amber-50',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    icon: <CircleCheck />,
    title: 'Integrity Validation',
    description:
      'Cross-references your self-assessed scores against real-world benchmarks to identify overestimations and provide honest feedback.',
    accentBorder: 'border-purple-400',
    gradientFrom: 'from-purple-50',
    gradientTo: 'to-pink-50',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
];

export default function AssessmentMethodologyDrawer() {
  const { isDrawerOpen, onClose } = useGlobalDrawer();
  const direction = useDrawerDirection();

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Drawer.Backdrop>
        <Drawer.Content placement={direction}>
          <Drawer.Dialog>
            {direction === 'bottom' && <Drawer.Handle />}
            {direction === 'right' && <Drawer.CloseTrigger />}
            {/* ── HEADER ─────────────────────────────────────────────── */}
            <Drawer.Header>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-xl bg-indigo-50 shrink-0',
                      'transition-[transform,box-shadow] duration-300 ease-out',
                      isDrawerOpen
                        ? 'scale-[1.12] -rotate-6 drop-shadow-md'
                        : 'hover:scale-110 hover:-rotate-6 hover:shadow-md',
                    )}
                  >
                    <ChartSpline className="size-5 text-indigo-600" strokeWidth={1.75} />
                  </div>
                  <div>
                    <Drawer.Heading className="text-base font-semibold text-gray-900">
                      Assessment Methodology
                    </Drawer.Heading>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Our AI-powered evaluation framework
                    </p>
                  </div>
                </div>
              </div>
            </Drawer.Header>

            {/* ── BODY ───────────────────────────────────────────────── */}
            <Drawer.Body className="space-y-5">
              {/* Intro */}
              <p className="text-sm text-gray-600 leading-relaxed">
                This evaluation uses a proprietary AI-powered framework combining vector similarity
                search with GPT-4o-mini reasoning against a database of{' '}
                <strong className="text-gray-800">
                  6,000+ high-quality circular economy projects
                </strong>
                .
              </p>

              {/* Methodology cards */}
              <div className="space-y-2.5">
                {METHODOLOGY_ITEMS.map((item, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'group/card relative flex items-start gap-3.5',
                      'p-4 rounded-xl border border-transparent',
                      'bg-linear-to-br',
                      item.gradientFrom,
                      item.gradientTo,
                      'border-l-4',
                      item.accentBorder,
                      // Hover lift
                      'transition-all duration-300 ease-out cursor-default',
                      'hover:shadow-md hover:border-opacity-100',
                      'hover:-translate-y-0.5',
                    )}
                  >
                    {/* Animated icon */}
                    <div
                      className={cn(
                        'shrink-0 p-2 rounded-lg mt-0.5',
                        item.iconBg,
                        'transition-[transform,box-shadow] duration-300 ease-out',
                        'group-hover/card:scale-110 group-hover/card:-rotate-6 group-hover/card:shadow-md',
                      )}
                    >
                      {React.cloneElement(item.icon, {
                        className: cn('size-4', item.iconColor),
                        strokeWidth: 1.75,
                      })}
                    </div>

                    {/* Text */}
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

              {/* Data source card */}
              <div
                className="group/card flex items-start gap-3.5 p-4 rounded-xl
                          bg-linear-to-br from-teal-50 to-emerald-50
                          border border-teal-200
                          transition-all duration-300 hover:shadow-md hover:-translate-y-0.5
                          cursor-default select-none"
              >
                <div
                  className="shrink-0 p-2 rounded-lg bg-teal-100 mt-0.5
                            transition-[transform,box-shadow] duration-300
                            group-hover/card:scale-110 group-hover/card:-rotate-6 group-hover/card:shadow-md"
                >
                  <BookCopy className="size-4 text-teal-600" strokeWidth={1.75} />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm font-bold text-teal-800 leading-snug">Data Source</span>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    <strong>GreenTechGuardians AI EarthHack Dataset:</strong> A curated collection
                    of <strong>4,000+ high-quality</strong> circular economy solutions (filtered
                    from 1,300) spanning waste reduction, resource optimization, renewable energy,
                    sustainable materials, and regenerative agriculture across multiple industries
                    and geographic regions.
                  </p>
                </div>
              </div>

              {/* Disclaimer */}
              <div
                className="flex items-start gap-3 p-4 rounded-xl
                          bg-amber-50 border-l-4 border-amber-400"
              >
                <TriangleAlert
                  className="size-4 text-amber-500 shrink-0 mt-0.5"
                  strokeWidth={1.75}
                />
                <p className="text-xs text-gray-600 leading-relaxed">
                  <strong className="text-gray-700">Disclaimer: </strong>
                  This assessment is designed to provide{' '}
                  <strong>constructive feedback for early-stage ideation</strong>. Scores reflect
                  alignment with established circular economy principles and should be used as
                  guidance, not as definitive validation of commercial viability.
                </p>
              </div>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

AssessmentMethodologyDrawer.propTypes = {};
