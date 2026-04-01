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
      <Drawer.Backdrop className="bg-black/15 backdrop-blur-sm">
        <Drawer.Content
          placement={direction}
          className="bg-(--color-bg) border-l border-(--color-border-strong) shadow-[-8px_0_24px_rgba(0,0,0,0.08)]"
        >
          <Drawer.Dialog>
            {direction === 'bottom' && <Drawer.Handle />}
            {direction === 'right' && <Drawer.CloseTrigger aria-label="Close drawer" />}
            <Drawer.Header>
              <div className="flex items-start justify-between p-6 border-b border-(--color-border) shrink-0">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-lg shrink-0',
                      'transition-[transform,box-shadow] duration-300 ease-out',
                      isDrawerOpen
                        ? 'scale-[1.12] -rotate-6 drop-shadow-md'
                        : 'hover:scale-110 hover:-rotate-6 hover:shadow-md',
                      'bg-(--color-warning-light)',
                    )}
                  >
                    <Target className="size-5 text-(--color-warning)" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-(--color-text-primary)">
                      Business Context Guide
                    </h2>
                    <p className="text-xs text-(--color-text-muted) mt-0.5">
                      Help the AI understand your circular economy model
                    </p>
                  </div>
                </div>
                <Drawer.CloseTrigger
                  className="w-8 h-8 flex items-center justify-center rounded-sm text-(--color-text-muted) hover:text-(--color-text-primary) hover:bg-(--color-accent-light) transition-colors shrink-0"
                  aria-label="Close"
                />
              </div>
            </Drawer.Header>
            <Drawer.Body className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <p className="text-sm text-(--color-text-secondary) leading-relaxed">
                  These optional fields provide{' '}
                  <strong className="font-semibold text-(--color-text-primary)">
                    context about your business
                  </strong>{' '}
                  to help the AI generate more precise benchmarks, recommendations, and insights
                  tailored to your specific situation.
                </p>

                <div className="border-l-2 border-(--color-warning) pl-3 py-1 text-sm text-(--color-text-secondary) italic leading-relaxed my-3">
                  <h4 className="mb-4 text-base font-bold text-(--color-warning)">
                    Context Fields
                  </h4>
                  <div className="space-y-3">
                    {BUSINESS_CONTEXT_HEADING_CONTENT.fields.map((field, idx) => (
                      <div
                        key={idx}
                        className="group/card relative flex items-start gap-3.5 p-3.5 rounded-lg border-l-4 border-(--color-warning) bg-(--color-bg-field) transition-colors duration-300 ease-out cursor-default select-none"
                      >
                        <div className="shrink-0 p-1.5 rounded-lg mt-0.5 bg-(--color-warning-light) transition-[transform,box-shadow] duration-300 ease-out group-hover/card:scale-110 group-hover/card:-rotate-6 group-hover/card:shadow-md">
                          <Target className="size-4 text-(--color-warning)" strokeWidth={1.75} />
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-sm font-bold leading-snug text-(--color-text-primary)">
                            {field.title}
                          </span>
                          <span className="text-xs leading-snug text-(--color-text-muted)">
                            {field.description}
                          </span>
                          <span className="text-xs italic leading-relaxed mt-1 text-(--color-warning)">
                            → {field.hint}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-l-2 border-(--color-warning) pl-3 py-1 text-xs text-(--color-warning) italic leading-relaxed my-3">
                  <Lightbulb
                    className="mt-0.5 shrink-0 text-(--color-warning)"
                    strokeWidth={2}
                    size={16}
                  />
                  <span>
                    <strong className="text-(--color-text-primary)">Privacy Note:</strong> These
                    answers are never stored beyond this session unless you explicitly save the
                    assessment.
                  </span>
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
