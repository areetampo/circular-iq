import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';
import { useGlobalModal } from '@/contexts/ModalContext';
import { useGlobalDialog } from '@/contexts/DialogContext';
import testCases from '@/data/testCases.json';
import { Card, Chip } from '@heroui/react';
import { Button } from '@/components/common';
import { toast, ScrollShadow } from '@heroui/react';
import { cn } from '@/utils/cn';
import { Scroll } from 'lucide-react';
import { useSession } from '@/features/session/hooks/useSession';

export default function SampleTestCasesContainer({ setShowEvaluationParameters = () => {} }) {
  const { setValue, trigger, getValues } = useFormContext();
  const { openSpecificTestCaseDetailsModal } = useGlobalModal();
  const { openReplaceInputsDialog } = useGlobalDialog();
  const { saveSession } = useSession();
  const [selectedCase, setSelectedCase] = useState('');

  const handleSelectCase = async (testCase) => {
    setSelectedCase(testCase.id);
    setValue('businessProblem', testCase.problem, { shouldValidate: true });
    setValue('businessSolution', testCase.solution, { shouldValidate: true });
    setValue('parameters', testCase.parameters, { shouldValidate: true });
    await trigger();

    // Persist immediately when a user explicitly selects a sample test case.
    // Rationale: selecting a sample is an explicit user action and should be
    // reliably reflected in persisted session state (avoid timing/race gaps
    // where autosave debounce could be missed).
    try {
      saveSession({
        inputs: {
          businessProblem: testCase.problem || '',
          businessSolution: testCase.solution || '',
          parameters: testCase.parameters || {},
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      /* ignore */
    }

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
      openReplaceInputsDialog({
        title: 'Replace current inputs?',
        description:
          'Loading a test case will overwrite your current business problem and solution. Do you want to continue?',
        confirmText: 'Replace',
        cancelText: 'Cancel',
        onConfirm: async () => {
          await handleSelectCase(testCase);
        },
        onCancel: () => {
          // Do nothing on cancel
        },
      });
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
    <>
      <ScrollShadow className="grid grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2 max-h-96 pb-6">
        {testCases.testCases.map((testCase, index) => (
          <Card
            key={testCase.id}
            onClick={() => requestSelectCase(testCase)}
            className={cn(
              'cursor-pointer transition-all duration-200 h-full border-2 shadow-sm hover:shadow-md data-active:scale-90',
              selectedCase === testCase.id
                ? 'border-teal-300/60 bg-teal-100/50'
                : 'border-teal-100 bg-teal-50/70 hover:bg-teal-100/40 hover:border-teal-200',
            )}
          >
            <div className="flex flex-col h-full p-0">
              <div className="flex items-start justify-between gap-2 mb-3">
                <h4 className="flex-1 text-lg font-semibold leading-tight text-slate-900">
                  {testCase.title}
                </h4>
                <Chip
                  size="sm"
                  variant="soft"
                  color="success"
                  className="text-xs font-semibold shrink-0"
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
                        'text-[9px] sm:text-xs px-2 py-1 rounded-md font-semibold border',
                        getParameterColor(value),
                      )}
                    >
                      {key.replace(/_/g, ' ')}: {value}
                    </span>
                  ))}
              </div>

              <div className="flex justify-end mt-4">
                <Button
                  onClick={(e) => {
                    openSpecificTestCaseDetailsModal(testCase);
                    e.stopPropagation();
                  }}
                  variant="eco-soft"
                  size="sm"
                >
                  View details
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </ScrollShadow>
    </>
  );
}

SampleTestCasesContainer.propTypes = {
  setShowEvaluationParameters: PropTypes.func,
};
