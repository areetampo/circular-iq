import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/utils/cn';
import { extractProblemSolution } from '@/utils/content';
import { NotebookText, Target, Lightbulb, X } from 'lucide-react';
import { Chip } from '@heroui/react';
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

export default function ResultsDatabaseEvidenceDetailsDrawer({ data = {} }) {
  // if data is {} return null
  if (Object.keys(data).length === 0) return null;
  const {
    title = '',
    content = '',
    caseItem = null,
    matchPercentage = null,
    matchStrengthLabel = '',
    matchColor = '',
    sourceCaseId = null,
  } = data;

  // Use structured metadata if available (preferred), otherwise parse content
  const { problem: problemPart, solution: solutionPart } = extractProblemSolution(
    caseItem || content,
  );

  // Check if we have valid problem and solution
  const hasSeparateSections =
    problemPart &&
    solutionPart &&
    problemPart !== 'Problem data not clearly formatted' &&
    solutionPart !== 'Solution data not clearly formatted';

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
      <DrawerContent direction={direction} aria-label="Evidence Details">
        <DrawerHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2 rounded-lg bg-slate-100 shrink-0',
                  'transition-[transform,box-shadow] duration-300 ease-out',
                  isDrawerOpen
                    ? 'scale-[1.12] -rotate-6 drop-shadow-md'
                    : 'hover:scale-110 hover:-rotate-6 hover:shadow-md',
                )}
              >
                <NotebookText className="size-5 text-slate-600" />
              </div>
              <div>
                <DrawerTitle className="text-lg font-semibold">
                  {title || 'Evidence Details'}
                </DrawerTitle>
                <DrawerDescription className="text-sm text-gray-600">
                  Detailed evidence and matched case context
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
          <div className="space-y-8">
            {/* Metadata badges */}
            {matchPercentage && (
              <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-center gap-2 text-sm py-2 px-3 rounded-md bg-gray-100 font-semibold text-gray-600">
                  <NotebookText className="size-4" />
                  <span>Source Case {sourceCaseId}</span>
                </div>
                <span className="text-gray-400">•</span>
                <Chip
                  size="sm"
                  variant="secondary"
                  className="text-xs py-0.5 text-white font-bold"
                  style={{
                    backgroundColor: matchColor,
                  }}
                >
                  {matchPercentage}%&nbsp;&nbsp;Similarity
                </Chip>
                <span className="text-gray-400">•</span>
                <div
                  className="text-xs font-bold tracking-wide uppercase"
                  style={{ color: matchColor }}
                >
                  {matchStrengthLabel}
                </div>
              </div>
            )}

            {/* Content sections */}
            {hasSeparateSections ? (
              <>
                <div>
                  <div className="flex items-center gap-2.5 mb-4 pb-3 border-b-2 border-emerald-600">
                    <Target className="size-5 text-emerald-600" strokeWidth={2} />
                    <h3 className="m-0 text-lg font-semibold text-gray-900">Problem Addressed</h3>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                    <p className="m-0 text-base leading-7 text-gray-600">{problemPart}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2.5 mb-3 pb-2 border-b-2 border-emerald-600">
                    <Lightbulb className="size-5 text-emerald-600" strokeWidth={2} />
                    <h3 className="m-0 text-lg font-semibold text-gray-900">Solution Approach</h3>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                    <p className="m-0 text-base leading-7 text-gray-600">{solutionPart}</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="m-0 leading-7 text-gray-600">{content}</p>
            )}
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

ResultsDatabaseEvidenceDetailsDrawer.propTypes = {
  data: PropTypes.shape({
    title: PropTypes.string,
    content: PropTypes.string,
    caseItem: PropTypes.object,
    matchPercentage: PropTypes.number,
    matchStrengthLabel: PropTypes.string,
    matchColor: PropTypes.string,
    sourceCaseId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
};
