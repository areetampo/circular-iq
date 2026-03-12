import React from 'react';
import { cn } from '@/utils/cn';

import { factorDefinitions } from '@/constants/evaluationData';
import { ClipboardMinus, X } from 'lucide-react';
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

export default function EvaluationParametersHeadingInfoDrawer() {
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
      <DrawerContent direction={direction} aria-label="Evaluation Parameters Guide">
        <DrawerHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2 rounded-lg bg-emerald-100 shrink-0',
                  'transition-[transform,box-shadow] duration-300 ease-out',
                  isDrawerOpen
                    ? 'scale-[1.12] -rotate-6 drop-shadow-md'
                    : 'hover:scale-110 hover:-rotate-6 hover:shadow-md',
                )}
              >
                <ClipboardMinus className="size-5 text-emerald-600" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Evaluation Parameters Guide</h2>
                <p className="text-sm text-gray-600">
                  Factors used to evaluate circularity potential
                </p>
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
              These are the factors we use to evaluate circularity potential. Use the definitions to
              align your self-assessed scores with our scoring model.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(factorDefinitions).map(([key, factor]) => (
                <div
                  key={key}
                  className={[
                    'group/card relative flex items-start gap-3.5',
                    'p-4 rounded-xl border border-transparent',
                    'bg-linear-to-br from-emerald-50 to-green-50',
                    'border-l-4 border-emerald-400',
                    'transition-all duration-300 ease-out cursor-default select-none',
                    'hover:shadow-md hover:-translate-y-0.5',
                  ].join(' ')}
                >
                  <div className="shrink-0 p-2 rounded-lg bg-emerald-100 mt-0.5 transition-[transform,box-shadow] duration-300 ease-out group-hover/card:scale-110 group-hover/card:-rotate-6 group-hover/card:shadow-md">
                    <ClipboardMinus className="size-4 text-emerald-600" strokeWidth={1.75} />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-bold text-gray-800 leading-snug">
                      {factor.title}
                    </span>
                    <span className="text-xs text-gray-500 leading-relaxed">{factor.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs italic text-gray-500 p-3 bg-gray-100 rounded-lg">
              💡 <strong>Stronger detail helps the model</strong> differentiate between nearby
              scores.
            </p>
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
