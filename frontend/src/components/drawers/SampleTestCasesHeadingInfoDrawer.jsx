import { Drawer } from '@heroui/react';
import { ClipboardPenLine, Lightbulb } from 'lucide-react';

import { SAMPLE_TEST_CASES_HEADING_CONTENT } from '@/constants/drawers';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';
import { cn } from '@/utils/cn';

export default function SampleTestCasesHeadingInfoDrawer() {
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
                      'bg-(--color-info-light)',
                    )}
                  >
                    <ClipboardPenLine className="size-5 text-(--color-info)" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-(--color-text-primary)">
                      {SAMPLE_TEST_CASES_HEADING_CONTENT.heading}
                    </h2>
                    <p className="text-xs text-(--color-text-muted) mt-0.5">
                      Learn from real circular economy examples
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
                  {SAMPLE_TEST_CASES_HEADING_CONTENT.description}
                </p>
                <ul className="ml-3 space-y-2">
                  {SAMPLE_TEST_CASES_HEADING_CONTENT.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="font-bold text-(--color-info)">→</span>
                      <span className="text-(--color-text-muted)">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2">
                  <h3 className="mb-3 text-base font-bold text-(--color-text-primary)">
                    {SAMPLE_TEST_CASES_HEADING_CONTENT.sections.howTheyWork.title}
                  </h3>
                  <div className="space-y-2">
                    {SAMPLE_TEST_CASES_HEADING_CONTENT.sections.howTheyWork.steps.map((step) => (
                      <div
                        key={step.num}
                        className="group/card relative flex items-start gap-3.5 p-3 rounded-xl border-l-4 border-(--color-info) bg-(--color-bg-field) transition-colors duration-300 ease-out cursor-default select-none"
                      >
                        <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold bg-(--color-info-light) text-(--color-info)">
                          {step.num}
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-sm font-bold leading-snug text-(--color-text-primary)">
                            {step.title}
                          </span>
                          <span className="text-xs leading-relaxed text-(--color-text-muted)">
                            {step.desc}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-l-2 border-(--color-info) pl-3 py-1 text-xs text-(--color-info) italic leading-relaxed my-3">
                  <Lightbulb
                    className="mt-0.5 shrink-0 text-(--color-info)"
                    strokeWidth={2}
                    size={16}
                  />
                  <span>
                    <strong className="text-(--color-text-primary)">Tip:</strong>{' '}
                    {SAMPLE_TEST_CASES_HEADING_CONTENT.sections.tip}
                  </span>
                </div>
              </div>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

SampleTestCasesHeadingInfoDrawer.propTypes = {};
