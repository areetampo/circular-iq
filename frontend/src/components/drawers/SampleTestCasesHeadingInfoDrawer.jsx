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
                      backgroundColor: 'var(--info-soft)',
                    }}
                  >
                    <ClipboardPenLine className="size-5" style={{ color: 'var(--info)' }} />
                  </div>
                  <div>
                    <Drawer.Heading className="text-lg font-semibold">
                      {SAMPLE_TEST_CASES_HEADING_CONTENT.heading}
                    </Drawer.Heading>
                  </div>
                </div>
              </div>
            </Drawer.Header>
            <Drawer.Body>
              <div className="space-y-6">
                <p className="leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {SAMPLE_TEST_CASES_HEADING_CONTENT.description}
                </p>
                <ul className="ml-3 space-y-2">
                  {SAMPLE_TEST_CASES_HEADING_CONTENT.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="font-bold" style={{ color: 'var(--info)' }}>
                        →
                      </span>
                      <span style={{ color: 'var(--muted)' }}>{benefit}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2">
                  <h3 className="mb-3 text-base font-bold" style={{ color: 'var(--foreground)' }}>
                    {SAMPLE_TEST_CASES_HEADING_CONTENT.sections.howTheyWork.title}
                  </h3>
                  <div className="space-y-2">
                    {SAMPLE_TEST_CASES_HEADING_CONTENT.sections.howTheyWork.steps.map((step) => (
                      <div
                        key={step.num}
                        className={[
                          'group/card relative flex items-start gap-3.5',
                          'p-3 rounded-xl border border-transparent',
                          'border-l-4',
                          'transition-colors duration-300 ease-out cursor-default select-none',
                        ].join(' ')}
                        style={{
                          backgroundColor: 'var(--surface-raised)',
                          borderLeftColor: 'var(--info)',
                        }}
                      >
                        <div
                          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold"
                          style={{
                            backgroundColor: 'var(--info-soft)',
                            color: 'var(--info)',
                          }}
                        >
                          {step.num}
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span
                            className="text-sm font-bold leading-snug"
                            style={{ color: 'var(--foreground)' }}
                          >
                            {step.title}
                          </span>
                          <span
                            className="text-xs leading-relaxed"
                            style={{ color: 'var(--muted)' }}
                          >
                            {step.desc}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="p-3 border rounded-lg"
                  style={{
                    backgroundColor: 'var(--info-soft)',
                    borderColor: 'var(--info)',
                  }}
                >
                  <p
                    className="flex items-start gap-2 m-0 text-xs"
                    style={{ color: 'var(--info)' }}
                  >
                    <Lightbulb
                      className="mt-0.5 shrink-0"
                      style={{ color: 'var(--info)' }}
                      strokeWidth={2}
                      size={16}
                    />
                    <span>
                      <strong>Tip:</strong> {SAMPLE_TEST_CASES_HEADING_CONTENT.sections.tip}
                    </span>
                  </p>
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
