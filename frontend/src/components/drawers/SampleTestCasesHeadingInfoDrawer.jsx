import React from 'react';
import { cn } from '@/utils/cn';

import { ClipboardPenLine, Lightbulb, X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';

export default function SampleTestCasesHeadingInfoDrawer() {
  const { isDrawerOpen, onClose } = useGlobalDrawer();
  const direction = useDrawerDirection();

  return (
    <Drawer
      open={isDrawerOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      direction={direction}
    >
      <DrawerContent direction={direction} aria-label="Sample Test Cases">
        <DrawerHeader>
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
                <DrawerTitle className="text-lg font-semibold">Sample Test Cases</DrawerTitle>
                <DrawerDescription className="text-sm text-gray-600">
                  Pre-filled business model examples
                </DrawerDescription>
              </div>
            </div>

            {direction === 'right' && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </DrawerHeader>
        <DrawerBody className="gap-6">
          <div className="space-y-6">
            <p className="leading-relaxed text-gray-600">
              <strong>Test Cases</strong> are pre-filled form submissions representing real circular
              economy business models. They help you:
            </p>
            <ul className="ml-3 space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <span className="font-bold text-blue-500">→</span>
                <span>See what good problem/solution descriptions look like</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <span className="font-bold text-blue-500">→</span>
                <span>Understand parameter scoring in real-world contexts</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <span className="font-bold text-blue-500">→</span>
                <span>Quickly test the evaluation framework</span>
              </li>
            </ul>

            <div className="pt-2">
              <h3 className="mb-3 text-base font-bold text-gray-900">How They Work</h3>
              <div className="space-y-2">
                {[
                  { num: 1, title: 'Select', desc: 'Pick any test case from the dropdown' },
                  { num: 2, title: 'Auto-fill', desc: 'Your form populates automatically' },
                  { num: 3, title: 'Submit', desc: 'Click "Get Evaluation" to see scores' },
                  { num: 4, title: 'Learn', desc: 'Review the evaluation against known results' },
                ].map((step) => (
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
                <Lightbulb className="mt-0.5 text-blue-600 shrink-0" strokeWidth={2} size={16} />
                <span>
                  <strong>Tip:</strong> Great for learning before submitting your own idea.
                </span>
              </p>
            </div>
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
