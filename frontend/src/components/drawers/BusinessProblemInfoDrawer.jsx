import { Drawer } from '@heroui/react';
import { ClipboardMinus } from 'lucide-react';

import { BUSINESS_PROBLEM_CONTENT } from '@/constants/drawers';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';
import { cn } from '@/utils/cn';

export default function BusinessProblemInfoDrawer() {
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
              </div>
            </Drawer.Header>
            <Drawer.Body className="gap-6 mt-4">
              <div className="space-y-6">
                <p className="leading-relaxed text-gray-700">
                  Describe the <strong>environmental or circular economy challenge</strong> your
                  business addresses.
                </p>

                <div className="p-4 border border-emerald-200 bg-emerald-50 rounded-xl">
                  <h4 className="mb-3 text-base font-bold text-emerald-700">Essential Elements</h4>
                  <div className="space-y-2">
                    {BUSINESS_PROBLEM_CONTENT.elements.map((item, idx) => (
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
                    {BUSINESS_PROBLEM_CONTENT.writingTips.map((tip) => (
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
                    {BUSINESS_PROBLEM_CONTENT.example}
                  </p>
                </div>

                <p className="p-3 text-xs italic text-gray-500 bg-gray-100 rounded-lg">
                  ‼ ️ <strong>Minimum 200 characters required</strong>
                </p>
              </div>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

BusinessProblemInfoDrawer.propTypes = {};
