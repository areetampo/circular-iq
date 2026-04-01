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
      <Drawer.Backdrop className="bg-black/15 backdrop-blur-sm">
        <Drawer.Content
          placement={direction}
          className="bg-(--color-bg) border-l border-(--color-border-strong) shadow-[-8px_0_24px_rgba(0,0,0,0.08)]"
        >
          <Drawer.Dialog>
            {direction === 'bottom' && <Drawer.Handle />}
            {direction === 'right' && <Drawer.CloseTrigger aria-label="Close drawer" />}
            <Drawer.Header>
              <div className="flex items-start justify-between p-6 border-b border-(--color-border) shrink-0">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-lg shrink-0',
                      'transition-[transform,box-shadow] duration-300 ease-out',
                      isDrawerOpen
                        ? 'scale-[1.12] -rotate-6 drop-shadow-md'
                        : 'hover:scale-110 hover:-rotate-6 hover:shadow-md',
                      'bg-(--color-success-light)',
                    )}
                  >
                    <ClipboardMinus className="size-5 text-(--color-success)" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-(--color-text-primary)">
                      {EVALUATION_PARAMETERS_HEADING_CONTENT.heading}
                    </h2>
                    <p className="text-xs text-(--color-text-muted) mt-0.5">
                      Understanding the evaluation framework
                    </p>
                  </div>
                </div>
                <Drawer.CloseTrigger
                  className="w-8 h-8 flex items-center justify-center rounded-sm text-(--color-text-muted) hover:text-(--color-text-primary) hover:bg-(--color-accent-light) transition-colors shrink-0"
                  aria-label="Close"
                />
              </div>
            </Drawer.Header>
            <Drawer.Body className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <p className="text-sm text-(--color-text-secondary) leading-relaxed">
                  {EVALUATION_PARAMETERS_HEADING_CONTENT.description}
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(factorDefinitions).map(([key, factor]) => (
                    <div
                      key={key}
                      className="group/card relative flex items-start gap-3.5 p-4 rounded-xl border-l-4 border-(--color-success) bg-(--color-success-light) transition-colors duration-300 ease-out cursor-default select-none"
                    >
                      <div className="shrink-0 p-2 rounded-lg mt-0.5 bg-(--color-success-light) transition-[transform,box-shadow] duration-300 ease-out group-hover/card:scale-110 group-hover/card:-rotate-6 group-hover/card:shadow-md">
                        <ClipboardMinus
                          className="size-4 text-(--color-success)"
                          strokeWidth={1.75}
                        />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-bold leading-snug text-(--color-text-primary)">
                          {factor.title}
                        </span>
                        <span className="text-xs leading-relaxed text-(--color-text-muted)">
                          {factor.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs italic p-3 rounded-lg bg-(--color-bg-field) text-(--color-text-muted)">
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
