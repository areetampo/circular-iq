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
                <div className="w-8 h-8 rounded-lg bg-[rgba(180,160,130,0.12)] flex items-center justify-center shrink-0">
                  <ClipboardMinus size={16} className="text-[#7a5c2e]" strokeWidth={1.75} />
                </div>
                <div>
                  <Drawer.Heading className="drawer__heading">
                    {BUSINESS_SOLUTION_CONTENT.title}
                  </Drawer.Heading>
                  <p className="text-[0.7rem] text-[#6b5f56] mt-0.5 font-normal">
                    {BUSINESS_SOLUTION_CONTENT.subtitle}
                  </p>
                </div>
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

                <div className="border-l-2 border-(--color-accent) pl-3 py-1 text-sm text-(--color-text-secondary) leading-relaxed my-3">
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

                <div className="border-l-2 border-(--color-accent) pl-3 py-1 text-sm text-(--color-text-secondary) leading-relaxed my-3">
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

                <div className="border-l-2 border-(--color-accent) pl-3 py-1 text-sm text-(--color-text-secondary) leading-relaxed my-3">
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
                  <p className="p-3 text-sm leading-relaxed rounded-lg border-l-4 border-(--color-accent) bg-(--color-accent-light) text-(--color-text-secondary)">
                    {BUSINESS_SOLUTION_CONTENT.example}
                  </p>
                </div>

                <p className="text-xs p-3 rounded-lg bg-(--color-bg-field) text-(--color-text-muted)">
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
