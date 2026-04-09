import { Drawer } from '@heroui/react';
import { ClipboardMinus } from 'lucide-react';

import { BUSINESS_PROBLEM_CONTENT } from '@/constants/drawers';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';

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
            {direction === 'bottom' ? (
              <Drawer.Handle />
            ) : (
              <Drawer.CloseTrigger aria-label="Close" />
            )}
            <Drawer.Header>
              <div className="flex items-center gap-3 pr-8">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(180,160,130,0.12)]">
                  <ClipboardMinus size={16} className="text-[#7a5c2e]" strokeWidth={1.75} />
                </div>
                <div>
                  <Drawer.Heading className="drawer__heading font-mono">
                    {BUSINESS_PROBLEM_CONTENT.title}
                  </Drawer.Heading>
                  <p className="mt-0.5 font-mono text-[0.7rem] font-normal text-[#6b5f56]">
                    {BUSINESS_PROBLEM_CONTENT.subtitle}
                  </p>
                </div>
              </div>
            </Drawer.Header>
            <Drawer.Body className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <p className="font-mono text-sm/relaxed text-(--color-text-secondary)">
                  Describe the{' '}
                  <strong className="font-medium text-(--color-text-primary)">
                    environmental or circular economy challenge
                  </strong>{' '}
                  your business addresses.
                </p>

                <div className="my-3 rounded-xl bg-(--color-bg-card) p-4 text-sm/relaxed text-(--color-text-secondary)">
                  <h4 className="mb-3 text-base font-medium text-(--color-accent)">
                    Essential Elements
                  </h4>
                  <div className="space-y-2">
                    {BUSINESS_PROBLEM_CONTENT.elements.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 py-2">
                        <ClipboardMinus
                          className="mt-0.5 size-4 shrink-0 text-(--color-accent)"
                          strokeWidth={1.75}
                        />
                        <div className="flex-1">
                          <span className="text-sm/snug font-medium text-(--color-text-primary)">
                            {item.title}
                          </span>
                          <span className="mt-0.5 block text-xs/relaxed text-(--color-text-secondary)">
                            {item.description}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="my-3 rounded-xl bg-(--color-bg-card) p-4 text-sm/relaxed text-(--color-text-secondary)">
                  <h4 className="mb-3 text-base font-medium text-(--color-accent)">Writing Tips</h4>
                  <ul className="space-y-1">
                    {BUSINESS_PROBLEM_CONTENT.writingTips.map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-sm">
                        <span className="font-medium text-(--color-accent)">•</span>
                        <span className="text-(--color-text-muted)">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="mb-2 text-base font-medium text-(--color-accent)">
                    Example Statement
                  </h4>
                  <p className="rounded-xl bg-(--color-accent-light) p-3 text-sm/relaxed text-(--color-text-secondary)">
                    {BUSINESS_PROBLEM_CONTENT.example}
                  </p>
                </div>

                <p className="rounded-lg bg-(--color-bg-field) p-3 text-xs text-(--color-text-muted)">
                  ‼ ️{' '}
                  <strong className="font-medium text-(--color-text-primary)">
                    Minimum 200 characters required
                  </strong>
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
