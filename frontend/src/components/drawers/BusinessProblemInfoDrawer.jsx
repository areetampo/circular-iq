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
                <div className="w-8 h-8 rounded-lg bg-[rgba(180,160,130,0.12)] flex items-center justify-center shrink-0">
                  <ClipboardMinus size={16} className="text-[#7a5c2e]" strokeWidth={1.75} />
                </div>
                <div>
                  <Drawer.Heading className="drawer__heading">
                    {BUSINESS_PROBLEM_CONTENT.title}
                  </Drawer.Heading>
                  <p className="text-[11px] text-[#6b5f56] mt-0.5 font-normal">
                    {BUSINESS_PROBLEM_CONTENT.subtitle}
                  </p>
                </div>
              </div>
            </Drawer.Header>
            <Drawer.Body className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <p className="text-sm text-(--color-text-secondary) leading-relaxed">
                  Describe the{' '}
                  <strong className="font-semibold text-(--color-text-primary)">
                    environmental or circular economy challenge
                  </strong>{' '}
                  your business addresses.
                </p>

                <div className="border-l-2 border-(--color-accent) pl-3 py-1 text-sm text-(--color-text-secondary) leading-relaxed my-3">
                  <h4 className="mb-3 text-base font-bold text-(--color-accent)">
                    Essential Elements
                  </h4>
                  <div className="space-y-2">
                    {BUSINESS_PROBLEM_CONTENT.elements.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 py-2 border-b border-(--color-border) last:border-0"
                      >
                        <ClipboardMinus
                          className="w-4 h-4 text-(--color-accent) mt-0.5 shrink-0"
                          strokeWidth={1.75}
                        />
                        <div className="flex-1">
                          <span className="text-sm font-semibold text-(--color-text-primary) leading-snug">
                            {item.title}
                          </span>
                          <span className="text-xs text-(--color-text-secondary) leading-relaxed block mt-0.5">
                            {item.description}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-l-2 border-(--color-accent) pl-3 py-1 text-sm text-(--color-text-secondary) leading-relaxed my-3">
                  <h4 className="mb-3 text-base font-bold text-(--color-accent)">Writing Tips</h4>
                  <ul className="space-y-1">
                    {BUSINESS_PROBLEM_CONTENT.writingTips.map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-sm">
                        <span className="font-bold text-(--color-accent)">•</span>
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
                    {BUSINESS_PROBLEM_CONTENT.example}
                  </p>
                </div>

                <p className="p-3 text-xs rounded-lg bg-(--color-bg-field) text-(--color-text-muted)">
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

BusinessProblemInfoDrawer.propTypes = {};
