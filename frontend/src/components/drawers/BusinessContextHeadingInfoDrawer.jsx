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
                      'p-2 rounded-lg shrink-0',
                      'transition-[transform,box-shadow] duration-300 ease-out',
                      isDrawerOpen
                        ? 'scale-[1.12] -rotate-6 drop-shadow-md'
                        : 'hover:scale-110 hover:-rotate-6 hover:shadow-md',
                    )}
                    style={{
                      backgroundColor: 'var(--warning-soft)',
                    }}
                  >
                    <Target
                      className="size-5"
                      style={{ color: 'var(--warning)' }}
                      strokeWidth={1.75}
                    />
                  </div>
                  <div>
                    <Drawer.Heading className="text-lg font-semibold">
                      Business Context Guide
                    </Drawer.Heading>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      Help the AI understand your circular economy model
                    </p>
                  </div>
                </div>
              </div>
            </Drawer.Header>
            <Drawer.Body className="gap-6 mt-4">
              <div className="space-y-6">
                <p className="leading-relaxed" style={{ color: 'var(--foreground)' }}>
                  These optional fields provide <strong>context about your business</strong> to help
                  the AI generate more precise benchmarks, recommendations, and insights tailored to
                  your specific situation.
                </p>

                <div
                  className="p-4 border rounded-xl"
                  style={{
                    borderColor: 'var(--warning)',
                    backgroundColor: 'var(--warning-soft)',
                  }}
                >
                  <h4 className="mb-4 text-base font-bold" style={{ color: 'var(--warning)' }}>
                    Context Fields
                  </h4>
                  <div className="space-y-3">
                    {BUSINESS_CONTEXT_HEADING_CONTENT.fields.map((field, idx) => (
                      <div
                        key={idx}
                        className={[
                          'group/card relative flex items-start gap-3.5',
                          'p-3.5 rounded-lg border border-transparent',
                          'border-l-4',
                          'transition-colors duration-300 ease-out cursor-default select-none',
                        ].join(' ')}
                        style={{
                          backgroundColor: 'var(--surface)',
                          borderLeftColor: 'var(--warning)',
                        }}
                      >
                        <div
                          className="shrink-0 p-1.5 rounded-lg mt-0.5 transition-[transform,box-shadow] duration-300 ease-out group-hover/card:scale-110 group-hover/card:-rotate-6 group-hover/card:shadow-md"
                          style={{ backgroundColor: 'var(--warning-soft)' }}
                        >
                          <Target
                            className="size-4"
                            style={{ color: 'var(--warning)' }}
                            strokeWidth={1.75}
                          />
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          <span
                            className="text-sm font-bold leading-snug"
                            style={{ color: 'var(--foreground)' }}
                          >
                            {field.title}
                          </span>
                          <span className="text-xs leading-snug" style={{ color: 'var(--muted)' }}>
                            {field.description}
                          </span>
                          <span
                            className="text-xs italic leading-relaxed mt-1"
                            style={{ color: 'var(--warning)' }}
                          >
                            → {field.hint}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="p-3 border rounded-lg"
                  style={{
                    borderColor: 'var(--warning)',
                    backgroundColor: 'var(--warning-soft)',
                  }}
                >
                  <p
                    className="flex items-start gap-2 m-0 text-xs"
                    style={{ color: 'var(--warning)' }}
                  >
                    <Lightbulb
                      className="mt-0.5 shrink-0"
                      style={{ color: 'var(--warning)' }}
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
