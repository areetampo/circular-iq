import { Drawer } from '@heroui/react';
import { ClipboardPenLine, Lightbulb } from 'lucide-react';

import { SAMPLE_TEST_CASES_HEADING_CONTENT } from '@/constants/drawers';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';

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
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(74,85,104,0.1)]">
                  <ClipboardPenLine size={16} className="text-[#4a5568]" strokeWidth={1.75} />
                </div>
                <div>
                  <Drawer.Heading className="drawer__heading">
                    {SAMPLE_TEST_CASES_HEADING_CONTENT.heading}
                  </Drawer.Heading>
                  <p className="mt-0.5 text-[0.7rem] font-normal text-[#6b5f56]">
                    Learn from real circular economy examples
                  </p>
                </div>
              </div>
            </Drawer.Header>
            <Drawer.Body className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <p className="text-sm/relaxed text-(--color-text-secondary)">
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
                        className="group/card relative flex cursor-default items-start gap-3.5 rounded-xl border-l-4 border-(--color-info) bg-(--color-bg-field) p-3 transition-colors duration-300 ease-out select-none"
                      >
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--color-info-light) font-bold text-(--color-info)">
                          {step.num}
                        </div>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-sm/snug font-bold text-(--color-text-primary)">
                            {step.title}
                          </span>
                          <span className="text-xs/relaxed text-(--color-text-muted)">
                            {step.desc}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="my-3 border-l-2 border-(--color-info) py-1 pl-3 text-xs/relaxed text-(--color-info)">
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
