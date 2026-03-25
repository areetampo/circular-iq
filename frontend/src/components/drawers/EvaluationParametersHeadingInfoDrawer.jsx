import { Drawer } from '@heroui/react';
import { ClipboardMinus } from 'lucide-react';

import { EVALUATION_PARAMETERS_HEADING_CONTENT } from '@/constants/drawers';
import { factorDefinitions } from '@/constants/evaluationData';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';
import { cn } from '@/utils/cn';

export default function EvaluationParametersHeadingInfoDrawer() {
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
                    <Drawer.Heading className="text-lg font-semibold">
                      {EVALUATION_PARAMETERS_HEADING_CONTENT.heading}
                    </Drawer.Heading>
                  </div>
                </div>
              </div>
            </Drawer.Header>
            <Drawer.Body>
              <div className="space-y-6">
                <p className="leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {EVALUATION_PARAMETERS_HEADING_CONTENT.description}
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(factorDefinitions).map(([key, factor]) => (
                    <div
                      key={key}
                      className={[
                        'group/card relative flex items-start gap-3.5',
                        'p-4 rounded-xl border border-transparent',
                        'border-l-4',
                        'transition-all duration-300 ease-out cursor-default select-none',
                        'hover:shadow-md hover:-translate-y-0.5',
                      ].join(' ')}
                      style={{
                        backgroundColor: 'var(--success-soft)',
                        borderLeftColor: 'var(--success)',
                      }}
                    >
                      <div
                        className="shrink-0 p-2 rounded-lg mt-0.5 transition-[transform,box-shadow] duration-300 ease-out group-hover/card:scale-110 group-hover/card:-rotate-6 group-hover/card:shadow-md"
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
                          {factor.title}
                        </span>
                        <span className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                          {factor.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <p
                  className="text-xs italic p-3 rounded-lg"
                  style={{
                    color: 'var(--muted)',
                    backgroundColor: 'var(--surface-raised)',
                  }}
                >
                  {EVALUATION_PARAMETERS_HEADING_CONTENT.tip}
                </p>
              </div>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

EvaluationParametersHeadingInfoDrawer.propTypes = {};
