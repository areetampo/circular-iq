import { Drawer } from '@heroui/react';
import { ClipboardMinus } from 'lucide-react';

import { BUSINESS_SOLUTION_CONTENT } from '@/constants/drawers';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';

export default function BusinessSolutionInfoDrawer() {
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
              <div className="flex items-start justify-between p-6 border-b border-(--color-border)">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-[rgba(74,124,89,0.12)] flex items-center justify-center text-(--color-accent) mt-0.5">
                    <ClipboardMinus size={16} strokeWidth={1.75} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-(--color-text-primary)">
                      {BUSINESS_SOLUTION_CONTENT.title}
                    </h2>
                    <p className="text-xs text-(--color-text-muted) mt-0.5">
                      {BUSINESS_SOLUTION_CONTENT.subtitle}
                    </p>
                  </div>
                </div>
                <Drawer.CloseTrigger
                  className="shrink-0 w-8 h-8 rounded-sm text-(--color-text-muted) hover:text-(--color-text-primary) hover:bg-(--color-accent-light) transition-colors"
                  aria-label="Close"
                />
              </div>
            </Drawer.Header>
            <Drawer.Body className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <p className="text-sm text-(--color-text-secondary) leading-relaxed">
                  Describe{' '}
                  <strong className="font-semibold text-(--color-text-primary)">
                    how your business solves the problem
                  </strong>{' '}
                  with technical details about materials, processes, partnerships, and outcomes.
                </p>

                <div className="border-l-2 border-(--color-accent) pl-3 py-1 text-sm text-(--color-text-secondary) italic leading-relaxed my-3">
                  <h4 className="mb-3 text-base font-bold text-(--color-accent)">
                    Critical Components
                  </h4>
                  <div className="space-y-2">
                    {BUSINESS_SOLUTION_CONTENT.components.map((item, idx) => (
                      <div
                        key={idx}
                        className="group/card relative flex items-start gap-3.5 p-4 rounded-xl border-l-4 border-(--color-accent) bg-(--color-accent-light) transition-colors duration-300 ease-out cursor-default select-none"
                      >
                        <div className="shrink-0 p-2 rounded-lg mt-0.5 bg-(--color-accent-light) transition-[transform,box-shadow] duration-300 ease-out group-hover/card:scale-110 group-hover/card:-rotate-6 group-hover/card:shadow-md">
                          <ClipboardMinus
                            className="size-4 text-(--color-accent)"
                            strokeWidth={1.75}
                          />
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-sm font-bold leading-snug text-(--color-text-primary)">
                            {item.title}
                          </span>
                          <span className="text-xs leading-relaxed text-(--color-text-muted)">
                            {item.description}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-l-2 border-(--color-accent) pl-3 py-1 text-sm text-(--color-text-secondary) italic leading-relaxed my-3">
                  <h4 className="mb-3 text-base font-bold text-(--color-accent)">
                    Common Pitfalls
                  </h4>
                  <ul className="space-y-1">
                    {BUSINESS_SOLUTION_CONTENT.pitfalls.map((pitfall) => (
                      <li key={pitfall} className="flex items-start gap-2 text-sm">
                        <span className="font-bold text-(--color-accent)">×</span>
                        <span className="text-(--color-text-muted)">{pitfall}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-l-2 border-(--color-accent) pl-3 py-1 text-sm text-(--color-text-secondary) italic leading-relaxed my-3">
                  <h4 className="mb-3 text-base font-bold text-(--color-accent)">Pro Tips</h4>
                  <ul className="space-y-1">
                    {BUSINESS_SOLUTION_CONTENT.proTips.map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-sm">
                        <span className="font-bold text-(--color-accent)">✓</span>
                        <span className="text-(--color-text-muted)">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="mb-2 text-base font-bold text-(--color-accent)">
                    Example Statement
                  </h4>
                  <p className="p-3 italic text-sm leading-relaxed rounded-lg border-l-4 border-(--color-accent) bg-(--color-accent-light) text-(--color-text-secondary)">
                    {BUSINESS_SOLUTION_CONTENT.example}
                  </p>
                </div>

                <p className="text-xs italic p-3 rounded-lg bg-(--color-bg-field) text-(--color-text-muted)">
                  ‼ ️{' '}
                  <strong className="text-(--color-text-primary)">
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

BusinessSolutionInfoDrawer.propTypes = {};

BusinessSolutionInfoDrawer.propTypes = {};
