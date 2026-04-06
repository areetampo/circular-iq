import { ScrollShadow, toast } from '@heroui/react';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Button } from '@/components/common';
import { sampleTestCases } from '@/constants/sampleTestCases.js';
import { useGlobalDialog } from '@/contexts/DialogContext';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useSession } from '@/features/session/hooks/useSession';
import { cn } from '@/utils/cn';

// Helper function to get score styling with elegant colors
const getScoreStyle = (score) => {
  if (score >= 75)
    return {
      bg: 'oklch(0.97 0.012 145 / 0.22)',
      color: 'var(--color-success)',
      border: 'var(--color-success)',
    };
  if (score >= 55)
    return {
      bg: 'oklch(0.97 0.012 68 / 0.18)',
      color: 'var(--color-accent)',
      border: 'var(--color-accent)',
    };
  if (score >= 35)
    return {
      bg: 'oklch(0.97 0.012 60 / 0.18)',
      color: 'var(--color-warning)',
      border: 'var(--color-warning)',
    };
  return {
    bg: 'oklch(0.97 0.008 20 / 0.15)',
    color: 'var(--color-error)',
    border: 'var(--color-error)',
  };
};

// Helper function to validate and normalize business model type values
const normalizeBusinessModelType = (value) => {
  if (!value) return null;
  const normalized = String(value).toLowerCase().trim();
  const validOptions = [
    'recycling',
    'product-as-a-service',
    'take-back',
    'remanufacturing',
    'sharing-platform',
    'repair-service',
    'other',
  ];
  return validOptions.includes(normalized) ? normalized : null;
};

// Helper function to validate and normalize operational stage values
const normalizeOperationalStage = (value) => {
  if (!value) return null;
  const normalized = String(value).toLowerCase().trim();
  const validOptions = ['idea', 'prototype', 'pilot', 'scaling', 'mature'];
  return validOptions.includes(normalized) ? normalized : null;
};

// Helper function to validate and normalize geography values
const normalizeGeography = (value) => {
  if (!value) return null;
  const normalized = String(value).toLowerCase().trim();
  const validOptions = ['local', 'national', 'regional', 'global'];
  return validOptions.includes(normalized) ? normalized : null;
};

// Helper function to validate and normalize volume values
const normalizeVolume = (value) => {
  if (!value) return null;
  const normalized = String(value).toLowerCase().trim();
  const validOptions = [
    'under-1-tonne',
    '1-10-tonnes',
    '10-100-tonnes',
    'over-100-tonnes',
    'digital-intangible',
  ];
  return validOptions.includes(normalized) ? normalized : null;
};

// Helper function to validate and normalize material complexity values
const normalizeMaterialComplexity = (value) => {
  if (!value) return null;
  const normalized = String(value).toLowerCase().trim();
  const validOptions = [
    'single-material',
    'multi-material',
    'hazardous-components',
    'electronics',
    'biological',
  ];
  return validOptions.includes(normalized) ? normalized : null;
};

// Helper function to map test case business context to form field names.
// Now that testCases.json uses consistent snake_case field names, this simply
// validates and passes through the values. The normalize functions ensure enum
// values are valid according to the form schema.
const mapTestCaseContextToFormFields = (testCaseContext) => {
  if (!testCaseContext || typeof testCaseContext !== 'object') {
    return {
      business_model_type: null,
      operational_stage: null,
      target_geography: null,
      annual_volume_estimate: null,
      material_complexity: null,
      has_existing_partnerships: null,
    };
  }

  return {
    business_model_type: normalizeBusinessModelType(testCaseContext.business_model_type),
    operational_stage: normalizeOperationalStage(testCaseContext.operational_stage),
    target_geography: normalizeGeography(testCaseContext.target_geography),
    annual_volume_estimate: normalizeVolume(testCaseContext.annual_volume_estimate),
    material_complexity: normalizeMaterialComplexity(testCaseContext.material_complexity),
    has_existing_partnerships: testCaseContext.has_existing_partnerships ?? null,
  };
};

export default function SampleTestCasesContainer({
  setShowEvaluationParameters = () => {},
  openEvalParams = () => {},
  openBusinessContext = () => {},
}) {
  const { setValue, trigger, getValues, reset } = useFormContext();
  const { openSpecificSampleTestCaseViewDetailsDrawer } = useGlobalDrawer();
  const { openReplaceInputsDialog } = useGlobalDialog();
  const { saveSession } = useSession();
  const [selectedCase, setSelectedCase] = useState('');

  const handleSelectCase = async (testCase) => {
    setSelectedCase(testCase.id);

    // Map business context from test case
    const mappedContext = testCase.businessContext
      ? mapTestCaseContextToFormFields(testCase.businessContext)
      : getValues('businessContext');

    // Get current form state and update only the needed fields
    const currentValues = getValues();

    // Use reset() to atomically update all form values at once.
    // This is more reliable than multiple setValue calls because it updates
    // the form state in a single batch operation, eliminating race conditions
    // where validation might run against partially-updated state.
    reset(
      {
        // Preserve other fields that might be set
        ...currentValues,
        // Override with new test case values
        businessProblem: testCase.problem,
        businessSolution: testCase.solution,
        evaluationParameters: testCase.evaluationParameters,
        businessContext: mappedContext,
      },
      {
        keepDirty: true,
        keepTouched: true,
        keepValues: false, // We're explicitly setting new values
      },
    );

    // Validation will be triggered by reset() with keepDirty/keepTouched
    // but we ensure it completes before proceeding
    await Promise.resolve();

    // Persist immediately when a user explicitly selects a sample test case.
    try {
      saveSession({
        inputs: {
          businessProblem: testCase.problem || '',
          businessSolution: testCase.solution || '',
          evaluationParameters: testCase.evaluationParameters || {},
          businessContext: testCase.businessContext || getValues('businessContext') || {},
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

    // Add a small delay to ensure form reset completes before opening accordions
    setTimeout(() => {
      // Open all 5 accordions above Sample Test Cases
      openEvalParams();
      openBusinessContext();
    }, 100);
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

  const handleViewDetails = (e, testCase) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    openSpecificSampleTestCaseViewDetailsDrawer(testCase, requestSelectCase);
  };

  return (
    <ScrollShadow className="grid grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2 max-h-96 pb-6">
      {sampleTestCases.map((testCase, index) => {
        const isSelected = selectedCase === testCase.id;

        return (
          <div
            key={testCase.id}
            onClick={() => requestSelectCase(testCase)}
            className={cn(
              'group relative flex flex-col gap-3 rounded-xl p-3 cursor-pointer',
              'border-[1.5px] transition-all duration-200',
              isSelected
                ? 'border-(--color-accent) shadow-sm bg-accent-100/10'
                : 'border-(--color-border-strong) bg-(--color-bg-card)' +
                    ' hover:border-(--color-accent) hover:shadow-sm',
            )}
          >
            {/* Header: index pill + title + check */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded shrink-0 bg-(--color-accent-soft) text-(--color-accent)',
                  )}
                >
                  #{index + 1}
                </span>
                <h4 className="text-sm font-medium font-mono leading-snug truncate text-black/65">
                  {testCase.title}
                </h4>
              </div>
              {isSelected && (
                <CheckCircle2
                  size={18}
                  className="shrink-0 mt-0.5"
                  style={{ color: 'var(--color-accent)' }}
                  strokeWidth={2}
                />
              )}
            </div>

            {/* Problem excerpt */}
            <p
              className="text-xs leading-relaxed line-clamp-2 grow"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {testCase.problem.substring(0, 110)}…
            </p>

            {/* Score pills */}
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(testCase.evaluationParameters || {})
                .slice(0, 3)
                .map(([key, value]) => {
                  const style = getScoreStyle(value);
                  return (
                    <span
                      key={key}
                      className="text-[10px] font-medium px-2 py-0.5 rounded border"
                      style={{
                        backgroundColor: style.bg,
                        color: style.color,
                        borderColor: `oklch(from ${style.border} l c h / 0.4)`,
                      }}
                    >
                      {key.replace(/_/g, ' ')}: {value}
                    </span>
                  );
                })}
            </div>

            {/* "View details" button — make it a subtle text link, not a button */}
            <div className="flex justify-end">
              <Button size="sm" variant="ghost" onPress={(e) => handleViewDetails(e, testCase)}>
                View details
                <BookOpen size={11} />
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
  openBusinessContext: PropTypes.func,
};
