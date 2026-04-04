import { Drawer } from '@heroui/react';
import { Lightbulb, Target } from 'lucide-react';

import { BUSINESS_CONTEXT_HEADING_CONTENT } from '@/constants/drawers';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';

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
            <Drawer.CloseTrigger aria-label="Close" />
            <Drawer.Header>
              <div className="flex items-center gap-3 pr-8">
                <div className="w-8 h-8 rounded-lg bg-[rgba(122,91,46,0.1)] flex items-center justify-center shrink-0">
                  <Target size={16} className="text-[#7a5c2e]" strokeWidth={1.75} />
                </div>
                <div>
                  <Drawer.Heading className="drawer__heading">
                    Business Context Guide
                  </Drawer.Heading>
                  <p className="text-[11px] text-[#6b5f56] mt-0.5 font-normal">
                    Helps AI understand your circular economy model
                  </p>
                </div>
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

                <div className="border-l-2 border-(--color-warning) pl-3 py-1 text-sm text-(--color-text-secondary) leading-relaxed my-3">
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
                          <span className="text-xs leading-relaxed mt-1 text-(--color-warning)">
                            → {field.hint}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-l-2 border-(--color-warning) pl-3 py-1 text-xs text-(--color-warning) leading-relaxed my-3">
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
