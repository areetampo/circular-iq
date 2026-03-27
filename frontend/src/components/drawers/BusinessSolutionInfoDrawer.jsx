import { Drawer } from '@heroui/react';
import { ClipboardMinus } from 'lucide-react';

import { BUSINESS_SOLUTION_CONTENT } from '@/constants/drawers';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';
import { cn } from '@/utils/cn';

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
            {direction === 'bottom' && <Drawer.Handle />}
            {direction === 'right' && <Drawer.CloseTrigger aria-label="Close drawer" />}
            <Drawer.Header>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn('p-2 rounded-lg shrink-0')}
                    style={{
                      backgroundColor: 'var(--success-soft)',
                    }}
                  >
                    <ClipboardMinus
                      className="size-5"
                      style={{ color: 'var(--success)' }}
                      strokeWidth={1.75}
                    />
                  </div>
                  <div>
                    <Drawer.Heading className="text-lg font-semibold">
                      {BUSINESS_SOLUTION_CONTENT.title}
                    </Drawer.Heading>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      {BUSINESS_SOLUTION_CONTENT.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            </Drawer.Header>
            <Drawer.Body className="gap-6 mt-4">
              <div className="space-y-6">
                <p className="leading-relaxed" style={{ color: 'var(--foreground)' }}>
                  Describe <strong>how your business solves the problem</strong> with technical
                  details about materials, processes, partnerships, and outcomes.
                </p>

                <div
                  className="p-4 rounded-xl border"
                  style={{
                    backgroundColor: 'var(--success-soft)',
                    borderColor: 'var(--success)',
                  }}
                >
                  <h4 className="mb-3 text-base font-bold" style={{ color: 'var(--success)' }}>
                    Critical Components
                  </h4>
                  <div className="space-y-2">
                    {BUSINESS_SOLUTION_CONTENT.components.map((item, idx) => (
                      <div
                        key={idx}
                        className={[
                          'group/card relative flex items-start gap-3.5',
                          'p-4 rounded-xl border border-transparent',
                          'border-l-4',
                          'transition-colors duration-300 ease-out cursor-default select-none',
                        ].join(' ')}
                        style={{
                          backgroundColor: 'var(--success-soft)',
                          borderLeftColor: 'var(--success)',
                        }}
                      >
                        <div
                          className="shrink-0 p-2 rounded-lg mt-0.5
                                    transition-[transform,box-shadow] duration-300 ease-out
                                    group-hover/card:scale-110 group-hover/card:-rotate-6 group-hover/card:shadow-md"
                          style={{ backgroundColor: 'var(--success-soft)' }}
                        >
                          <ClipboardMinus
                            className="size-4"
                            style={{ color: 'var(--success)' }}
                            strokeWidth={1.75}
                          />
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span
                            className="text-sm font-bold leading-snug"
                            style={{ color: 'var(--foreground)' }}
                          >
                            {item.title}
                          </span>
                          <span
                            className="text-xs leading-relaxed"
                            style={{ color: 'var(--muted)' }}
                          >
                            {item.description}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="p-4 rounded-xl border"
                  style={{
                    backgroundColor: 'var(--warning-soft)',
                    borderColor: 'var(--warning)',
                  }}
                >
                  <h4 className="mb-3 text-base font-bold" style={{ color: 'var(--warning)' }}>
                    Common Pitfalls
                  </h4>
                  <ul className="space-y-1">
                    {BUSINESS_SOLUTION_CONTENT.pitfalls.map((pitfall) => (
                      <li key={pitfall} className="flex items-start gap-2 text-sm">
                        <span className="font-bold" style={{ color: 'var(--warning)' }}>
                          ×
                        </span>
                        <span style={{ color: 'var(--muted)' }}>{pitfall}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  className="p-4 rounded-xl border"
                  style={{
                    backgroundColor: 'var(--success-soft)',
                    borderColor: 'var(--success)',
                  }}
                >
                  <h4 className="mb-3 text-base font-bold" style={{ color: 'var(--success)' }}>
                    Pro Tips
                  </h4>
                  <ul className="space-y-1">
                    {BUSINESS_SOLUTION_CONTENT.proTips.map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-sm">
                        <span className="font-bold" style={{ color: 'var(--success)' }}>
                          ✓
                        </span>
                        <span style={{ color: 'var(--muted)' }}>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="mb-2 text-base font-bold" style={{ color: 'var(--accent)' }}>
                    Example Statement
                  </h4>
                  <p
                    className="p-3 italic text-sm leading-relaxed rounded-lg border-l-4"
                    style={{
                      color: 'var(--muted)',
                      backgroundColor: 'var(--accent-soft)',
                      borderLeftColor: 'var(--accent)',
                    }}
                  >
                    {BUSINESS_SOLUTION_CONTENT.example}
                  </p>
                </div>

                <p
                  className="text-xs italic p-3 rounded-lg"
                  style={{
                    color: 'var(--muted)',
                    backgroundColor: 'var(--surface-raised)',
                  }}
                >
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

BusinessSolutionInfoDrawer.propTypes = {};

BusinessSolutionInfoDrawer.propTypes = {};
