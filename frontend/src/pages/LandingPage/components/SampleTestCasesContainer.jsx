import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';
import useLandingModals from '@/pages/LandingPage/hooks/useLandingModals';
import testCases from '@/data/testCases.json';
import { Card, Button, Chip } from '@heroui/react';
import { toast } from '@heroui/react';
import { ChevronRight, PencilLine, ClipboardPenLine } from 'lucide-react';
import InfoIconButton from '@/components/common/InfoIconButton';
import { motion, AnimatePresence } from 'framer-motion';
import LandingModalManager from '@/components/modals/landing/LandingModalManager';
import { ReplaceInputsDialog } from '@/components/dialogs';
import { cn } from '@/utils/cn';

export default function SampleTestCasesContainer({ setShowEvaluationParameters = () => {} }) {
  const { setValue, trigger, getValues } = useFormContext();
  const { modal, isModalOpen, onClose, openTestCasesHeadingInfoModal, openTestCaseDetailsModal } =
    useLandingModals();
  const [selectedCase, setSelectedCase] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingCase, setPendingCase] = useState(null);

  const handleSelectCase = async (testCase) => {
    setSelectedCase(testCase.id);
    setValue('businessProblem', testCase.problem, { shouldValidate: true });
    setValue('businessSolution', testCase.solution, { shouldValidate: true });
    setValue('parameters', testCase.parameters, { shouldValidate: true });
    await trigger();

    toast.success('Test case loaded!', {
      description: `"${testCase.title}" has been loaded into the form.`,
      timeout: 4000,
    });
    setShowEvaluationParameters(true);
  };

  const hasUserInput = () => {
    const businessProblem = (getValues('businessProblem') || '').trim();
    const businessSolution = (getValues('businessSolution') || '').trim();
    return businessProblem.length > 0 || businessSolution.length > 0;
  };

  const requestSelectCase = (testCase) => {
    if (hasUserInput()) {
      setPendingCase(testCase);
      setIsConfirmOpen(true);
      return;
    }
    handleSelectCase(testCase);
  };

  const getParameterColor = (value) => {
    if (value >= 75) return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    if (value >= 50) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  return (
    <div className="mt-6 relative">
      <ClipboardPenLine className="text-teal-600 absolute top-5 left-3" size={24} />
      <motion.div
        className="w-full h-auto px-4 py-3 transition-all duration-300 border-2 border-emerald-200 rounded-xl bg-linear-to-r from-emerald-50/60 via-teal-50/50 to-cyan-50/60 hover:from-emerald-100/30 hover:via-teal-100/30 hover:to-cyan-100/30 hover:border-emerald-300 overflow-hidden"
        role="button"
        tabIndex={0}
      >
        {/* Heading */}
        <div
          className="flex items-center justify-between w-full gap-3 pl-7 hover:cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-sm xs:text-base font-semibold text-slate-900">
                  Sample Test Cases
                </h2>
                <InfoIconButton
                  onClick={(e) => {
                    openTestCasesHeadingInfoModal();
                    e.stopPropagation();
                  }}
                />
              </div>
              <p className="text-xs text-slate-600 text-wrap text-left">
                <i>
                  Use curated examples to explore how the evaluator scores, auto-fill the form for
                  quick testing.
                </i>
              </p>
            </div>
          </div>
          <ChevronRight
            className={cn(
              'w-5 h-5 text-emerald-600 transition-transform duration-300 shrink-0',
              isOpen && 'rotate-90',
            )}
            size={34}
          />
        </div>

        {/* Expandable Content */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4">
                <div className="grid grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2 max-h-96">
                  {testCases.testCases.map((testCase, index) => (
                    <Card
                      key={testCase.id}
                      onClick={() => requestSelectCase(testCase)}
                      className={cn(
                        'cursor-pointer transition-colors duration-200 h-full border-2 shadow-sm',
                        selectedCase === testCase.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-emerald-200 bg-white hover:bg-emerald-50 hover:border-emerald-300',
                      )}
                    >
                      <div className="flex flex-col h-full p-0">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h4 className="flex-1 text-sm font-semibold leading-tight text-slate-900">
                            {testCase.title}
                          </h4>
                          <Chip
                            size="sm"
                            variant="flat"
                            className="text-xs font-semibold shrink-0 bg-emerald-500/10 text-emerald-700 px-2"
                          >
                            #{index + 1}
                          </Chip>
                        </div>

                        <p className="mb-3 text-xs leading-relaxed grow text-slate-600 line-clamp-2">
                          {testCase.problem.substring(0, 100)}...
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(testCase.parameters)
                            .slice(0, 3)
                            .map(([key, value]) => (
                              <span
                                key={key}
                                className={cn(
                                  'text-[9px] px-2 py-1 rounded-md font-semibold border',
                                  getParameterColor(value),
                                )}
                              >
                                {key.replace(/_/g, ' ')}: {value}
                              </span>
                            ))}
                        </div>

                        <div className="flex justify-end">
                          <Button
                            onClick={(e) => {
                              openTestCaseDetailsModal(testCase);
                              e.stopPropagation();
                            }}
                            variant="bordered"
                            size="sm"
                            className="h-8 px-3 mt-3 text-xs transition-transform border-2 border-emerald-400 text-emerald-700 hover:bg-emerald-100 max-w-fit hover:cursor-pointer"
                          >
                            View details
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="flex items-center gap-3 p-4 border rounded-lg border-emerald-200/50 bg-emerald-50/40">
                  <PencilLine size={30} />
                  <p className="m-0 text-xs leading-relaxed text-emerald-900">
                    <span className="font-semibold">Pro tip:</span> These examples showcase best
                    practices in circular economy design. Use them to understand how the evaluator
                    scores different dimensions.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <ReplaceInputsDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Replace current inputs?"
        description="Loading a test case will overwrite your current business problem and solution. Do you want to continue?"
        confirmText="Replace"
        onConfirm={async () => {
          if (pendingCase) {
            await handleSelectCase(pendingCase);
          }
          setPendingCase(null);
        }}
        onCancel={() => {
          setPendingCase(null);
        }}
      />

      <LandingModalManager modal={modal} isModalOpen={isModalOpen} onClose={onClose} />
    </div>
  );
}

SampleTestCasesContainer.propTypes = {
  setShowEvaluationParameters: PropTypes.func,
};
