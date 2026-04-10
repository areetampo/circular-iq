import { Drawer } from '@heroui/react';
import { Lightbulb, MoveRight, Target } from 'lucide-react';

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
      <Drawer.Backdrop>
        <Drawer.Content placement={direction}>
          <Drawer.Dialog>
            {direction === 'bottom' ? (
              <Drawer.Handle />
            ) : (
              <Drawer.CloseTrigger aria-label="Close" />
            )}
            <Drawer.Header>
              <div className="flex items-center gap-3 pr-8">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(122,91,46,0.1)]">
                  <Target size={16} className="text-[#7a5c2e]" strokeWidth={1.75} />
                </div>
                <div>
                  <Drawer.Heading>Business Context Guide</Drawer.Heading>
                  <p className="mt-0.5 text-[0.7rem] font-normal text-[#6b5f56]">
                    Helps AI understand your circular economy model
                  </p>
                </div>
              </div>
            </Drawer.Header>
            <Drawer.Body className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <p className="text-sm/relaxed text-(--color-text-secondary)">
                  These optional fields provide{' '}
                  <strong className="font-medium text-(--color-text-primary)">
                    context about your business
                  </strong>{' '}
                  to help the AI generate more precise benchmarks, recommendations, and insights
                  tailored to your specific situation.
                </p>

                <div className="rounded-xl bg-(--color-bg-card) text-sm/relaxed text-(--color-text-secondary)">
                  <h4 className="mb-4 text-base font-medium text-(--color-warning)">
                    Context Fields
                  </h4>
                  <div className="space-y-6 pl-2">
                    {BUSINESS_CONTEXT_HEADING_CONTENT.fields.map((field, idx) => (
                      <div
                        key={idx}
                        className="group/card relative flex min-w-0 cursor-default flex-col items-start gap-1 rounded-lg bg-(--color-warning-light) transition-colors duration-300 ease-out select-none"
                      >
                        <span className="text-sm/snug font-medium text-(--color-text-primary)">
                          {field.title}
                        </span>
                        <span className="text-xs/snug text-(--color-text-muted)">
                          {field.description}
                        </span>
                        <span className="mt-1 text-xs/relaxed text-(--color-warning)">
                          <MoveRight className="mr-1 inline" size={14} strokeWidth={2} />{' '}
                          {field.hint}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="my-3 flex items-center gap-2 rounded-xl bg-(--color-warning-light) text-xs/relaxed text-(--color-warning)">
                  <Lightbulb
                    className="shrink-0 text-(--color-warning)"
                    strokeWidth={2}
                    size={24}
                  />
                  <span>
                    <strong className="font-medium text-(--color-text-primary)">
                      Privacy Note:
                    </strong>
                    <br />
                    These answers are never stored beyond this session unless you explicitly save
                    the assessment.
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
