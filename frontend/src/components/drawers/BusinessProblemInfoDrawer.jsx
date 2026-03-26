import { Drawer } from '@heroui/react';
import { ClipboardMinus } from 'lucide-react';

import { BUSINESS_PROBLEM_CONTENT } from '@/constants/drawers';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';
import { cn } from '@/utils/cn';

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
                    <Drawer.Heading
                      className="text-lg font-semibold"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {BUSINESS_PROBLEM_CONTENT.title}
                    </Drawer.Heading>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      {BUSINESS_PROBLEM_CONTENT.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            </Drawer.Header>
            <Drawer.Body className="gap-6 mt-4">
              <div className="space-y-6">
                <p className="leading-relaxed" style={{ color: 'var(--foreground)' }}>
                  Describe the <strong>environmental or circular economy challenge</strong> your
                  business addresses.
                </p>

                <div
                  className="p-4 rounded-xl border-l-4"
                  style={{
                    backgroundColor: 'var(--success-soft)',
                    borderColor: 'var(--success)',
                    border: '1px solid var(--success)',
                  }}
                >
                  <h4 className="mb-3 text-base font-bold" style={{ color: 'var(--success)' }}>
                    Essential Elements
                  </h4>
                  <div className="space-y-2">
                    {BUSINESS_PROBLEM_CONTENT.elements.map((item, idx) => (
                      <div
                        key={idx}
                        className={[
                          'group/card relative flex items-start gap-3.5',
                          'p-4 rounded-xl border-l-4',
                          'transition-all duration-300 ease-out cursor-default select-none',
                          'hover:shadow-md hover:-translate-y-0.5',
                        ].join(' ')}
                        style={{
                          backgroundColor: 'var(--surface-raised)',
                          borderColor: 'var(--success)',
                          border: '1px solid var(--success)',
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
                  className="p-4 rounded-xl border-l-4"
                  style={{
                    backgroundColor: 'var(--info-soft)',
                    borderColor: 'var(--info)',
                    border: '1px solid var(--info)',
                  }}
                >
                  <h4 className="mb-3 text-base font-bold" style={{ color: 'var(--info)' }}>
                    Writing Tips
                  </h4>
                  <ul className="space-y-1">
                    {BUSINESS_PROBLEM_CONTENT.writingTips.map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-sm">
                        <span className="font-bold" style={{ color: 'var(--info)' }}>
                          •
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
                    className="p-3 text-sm italic leading-relaxed rounded-lg border-l-4"
                    style={{
                      color: 'var(--muted)',
                      backgroundColor: 'var(--accent-soft)',
                      borderColor: 'var(--accent)',
                      border: '1px solid var(--accent)',
                    }}
                  >
                    {BUSINESS_PROBLEM_CONTENT.example}
                  </p>
                </div>

                <p
                  className="p-3 text-xs italic rounded-lg"
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

BusinessProblemInfoDrawer.propTypes = {};
