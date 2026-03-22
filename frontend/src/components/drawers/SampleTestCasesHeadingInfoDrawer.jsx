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
            {direction === 'right' && <Drawer.CloseTrigger />}
            <Drawer.Header>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-lg bg-blue-100 shrink-0',
                      'transition-[transform,box-shadow] duration-300 ease-out',
                      isDrawerOpen
                        ? 'scale-[1.12] -rotate-6 drop-shadow-md'
                        : 'hover:scale-110 hover:-rotate-6 hover:shadow-md',
                    )}
                  >
                    <ClipboardPenLine className="size-5 text-blue-600" />
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
                <p className="leading-relaxed text-gray-600">
                  {SAMPLE_TEST_CASES_HEADING_CONTENT.description}
                </p>
                <ul className="ml-3 space-y-2">
                  {SAMPLE_TEST_CASES_HEADING_CONTENT.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="font-bold text-blue-500">→</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2">
                  <h3 className="mb-3 text-base font-bold text-gray-900">
                    {SAMPLE_TEST_CASES_HEADING_CONTENT.sections.howTheyWork.title}
                  </h3>
                  <div className="space-y-2">
                    {SAMPLE_TEST_CASES_HEADING_CONTENT.sections.howTheyWork.steps.map((step) => (
                      <div
                        key={step.num}
                        className={[
                          'group/card relative flex items-start gap-3.5',
                          'p-3 rounded-xl border border-transparent',
                          'bg-linear-to-br from-slate-50 to-slate-50',
                          'border-l-4 border-blue-100',
                          'transition-all duration-300 ease-out cursor-default select-none',
                          'hover:shadow-md hover:-translate-y-0.5',
                        ].join(' ')}
                      >
                        <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                          {step.num}
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-sm font-bold text-gray-800 leading-snug">
                            {step.title}
                          </span>
                          <span className="text-xs text-gray-500 leading-relaxed">{step.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                  <p className="flex items-start gap-2 m-0 text-xs text-blue-900">
                    <Lightbulb
                      className="mt-0.5 text-blue-600 shrink-0"
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
