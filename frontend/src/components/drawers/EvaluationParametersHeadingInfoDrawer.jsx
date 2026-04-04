import { Drawer } from '@heroui/react';
import { ClipboardMinus } from 'lucide-react';

import { EVALUATION_PARAMETERS_HEADING_CONTENT } from '@/constants/drawers';
import { factorDefinitions } from '@/constants/evaluationData';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';

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
            {direction === 'bottom' ? (
              <Drawer.Handle />
            ) : (
              <Drawer.CloseTrigger aria-label="Close" />
            )}
            <Drawer.Header>
              <div className="flex items-center gap-3 pr-8">
                <div className="w-8 h-8 rounded-lg bg-[rgba(45,90,61,0.1)] flex items-center justify-center shrink-0">
                  <ClipboardMinus size={16} className="text-[#2d5a3d]" strokeWidth={1.75} />
                </div>
                <div>
                  <Drawer.Heading className="drawer__heading">
                    {EVALUATION_PARAMETERS_HEADING_CONTENT.heading}
                  </Drawer.Heading>
                  <p className="text-[0.7rem] text-[#6b5f56] mt-0.5 font-normal">
                    Understanding evaluation framework
                  </p>
                </div>
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

                <p className="text-xs p-3 rounded-lg bg-(--color-bg-field) text-(--color-text-muted)">
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
