import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useGlobalDialog } from '@/contexts/DialogContext';
import testCases from '@/data/testCases.json';
import { ScrollShadow, toast } from '@heroui/react';
import { Button } from '@/components/common';
import { cn } from '@/utils/cn';
import { useSession } from '@/features/session/hooks/useSession';
import { CheckCircle2, BookOpen } from 'lucide-react';

export default function SampleTestCasesContainer({
  setShowEvaluationParameters = () => {},
  openEvalParams = () => {},
}) {
  const { setValue, trigger, getValues } = useFormContext();
  const { openSpecificTestCaseDetailsDrawer } = useGlobalDrawer();
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
    openEvalParams();
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
        onCancel: () => {},
      });
      return;
    }
    handleSelectCase(testCase);
  };

  const getScoreStyle = (value) => {
    if (value >= 75) return 'text-emerald-600 bg-emerald-50 ring-1 ring-emerald-200';
    if (value >= 50) return 'text-amber-600 bg-amber-50 ring-1 ring-amber-200';
    return 'text-red-500 bg-red-50 ring-1 ring-red-200';
  };

  return (
    <ScrollShadow className="grid grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2 max-h-96 pb-6">
      {testCases.testCases.map((testCase, index) => {
        const isSelected = selectedCase === testCase.id;

        return (
          <div
            key={testCase.id}
            onClick={() => requestSelectCase(testCase)}
            className={cn(
              'group relative flex flex-col gap-3 rounded-xl p-4 cursor-pointer',
              'border transition-all duration-200',
              isSelected
                ? // Selected: soft emerald tint — feels "loaded/active" not just "hovered"
                  'border-emerald-300 bg-emerald-50/40 shadow-sm'
                : // Default → hover: slate border lifts to a warm teal-green
                  'border-slate-200/80 bg-white hover:border-teal-300 hover:bg-teal-50/20 hover:shadow-sm',
            )}
          >
            {/* Header: index pill + title + check */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded-full shrink-0',
                    isSelected ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500',
                  )}
                >
                  #{index + 1}
                </span>
                <h4 className="text-sm font-semibold leading-snug text-slate-800 truncate">
                  {testCase.title}
                </h4>
              </div>
              {isSelected && (
                <CheckCircle2
                  className="text-emerald-500 shrink-0 mt-0.5"
                  strokeWidth={2}
                  size={16}
                />
              )}
            </div>

            {/* Problem excerpt */}
            <p className="text-xs leading-relaxed text-slate-400 line-clamp-2 grow">
              {testCase.problem.substring(0, 110)}…
            </p>

            {/* Score pills */}
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(testCase.parameters)
                .slice(0, 3)
                .map(([key, value]) => (
                  <span
                    key={key}
                    className={cn(
                      'text-[10px] font-medium px-2 py-0.5 rounded-md',
                      getScoreStyle(value),
                    )}
                  >
                    {key.replace(/_/g, ' ')}: {value}
                  </span>
                ))}
            </div>

            {/* View details — no divider, just the button flush to bottom */}
            <div className="flex justify-end">
              <Button
                onClick={(e) => {
                  openSpecificTestCaseDetailsDrawer(testCase);
                  e.stopPropagation();
                }}
                variant="eco-soft"
                size="sm"
                className="flex items-center gap-2 text-xs"
              >
                View details
                <BookOpen />
              </Button>
            </div>
          </div>
        );
      })}
    </ScrollShadow>
  );
}

SampleTestCasesContainer.propTypes = {
  setShowEvaluationParameters: PropTypes.func,
  openEvalParams: PropTypes.func,
};
