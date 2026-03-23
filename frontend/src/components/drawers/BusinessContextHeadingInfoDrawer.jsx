import { Drawer } from '@heroui/react';
import { Lightbulb, Target } from 'lucide-react';

import { BUSINESS_CONTEXT_HEADING_CONTENT } from '@/constants/drawers';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';
import { cn } from '@/utils/cn';

export default function BusinessContextHeadingInfoDrawer() {
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
            {direction === 'right' && <Drawer.CloseTrigger aria-label="Close drawer" />}
            <Drawer.Header>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-lg bg-amber-100 shrink-0',
                      'transition-[transform,box-shadow] duration-300 ease-out',
                      isDrawerOpen
                        ? 'scale-[1.12] -rotate-6 drop-shadow-md'
                        : 'hover:scale-110 hover:-rotate-6 hover:shadow-md',
                    )}
                  >
                    <Target className="size-5 text-amber-600" strokeWidth={1.75} />
                  </div>
                  <div>
                    <Drawer.Heading className="text-lg font-semibold">
                      Business Context Guide
                    </Drawer.Heading>
                    <p className="text-sm text-gray-600">
                      Help the AI understand your circular economy model
                    </p>
                  </div>
                </div>
              </div>
            </Drawer.Header>
            <Drawer.Body className="gap-6 mt-4">
              <div className="space-y-6">
                <p className="leading-relaxed text-gray-700">
                  These optional fields provide <strong>context about your business</strong> to help
                  the AI generate more precise benchmarks, recommendations, and insights tailored to
                  your specific situation.
                </p>

                <div className="p-4 border border-amber-200 bg-amber-50 rounded-xl">
                  <h4 className="mb-4 text-base font-bold text-amber-700">Context Fields</h4>
                  <div className="space-y-3">
                    {BUSINESS_CONTEXT_HEADING_CONTENT.fields.map((field, idx) => (
                      <div
                        key={idx}
                        className={[
                          'group/card relative flex items-start gap-3.5',
                          'p-3.5 rounded-lg border border-transparent',
                          'bg-linear-to-br from-white to-amber-50',
                          'border-l-4 border-amber-300',
                          'transition-all duration-300 ease-out cursor-default select-none',
                          'hover:shadow-md hover:-translate-y-0.5',
                        ].join(' ')}
                      >
                        <div className="shrink-0 p-1.5 rounded-lg bg-amber-100 mt-0.5 transition-[transform,box-shadow] duration-300 ease-out group-hover/card:scale-110 group-hover/card:-rotate-6 group-hover/card:shadow-md">
                          <Target className="size-4 text-amber-600" strokeWidth={1.75} />
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-sm font-bold text-gray-800 leading-snug">
                            {field.title}
                          </span>
                          <span className="text-xs text-gray-600 leading-relaxed">
                            {field.description}
                          </span>
                          <span className="text-xs italic text-amber-700 leading-relaxed mt-1">
                            → {field.hint}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 border border-amber-200 rounded-lg bg-amber-50">
                  <p className="flex items-start gap-2 m-0 text-xs text-amber-900">
                    <Lightbulb
                      className="mt-0.5 text-amber-600 shrink-0"
                      strokeWidth={2}
                      size={16}
                    />
                    <span>
                      <strong>Privacy Note:</strong> These answers are never stored beyond this
                      session unless you explicitly save the assessment.
                    </span>
                  </p>
                </div>
              </div>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

BusinessContextHeadingInfoDrawer.propTypes = {};
