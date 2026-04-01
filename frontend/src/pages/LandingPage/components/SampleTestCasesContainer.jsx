import { toast } from '@heroui/react';
import { CheckCircle2, Eye } from 'lucide-react';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Button } from '@/components/common';
import { sampleTestCases } from '@/constants/sampleTestCases.js';
import { useGlobalDialog } from '@/contexts/DialogContext';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useSession } from '@/features/session/hooks/useSession';
import { cn } from '@/utils/cn';

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
    openEvalParams();
    openBusinessContext();
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {sampleTestCases.map((testCase, index) => {
        const isSelected = selectedCase === testCase.id;

        return (
          <button
            key={testCase.id}
            onClick={() => requestSelectCase(testCase)}
            aria-label={`Select sample test case: ${testCase.title}`}
            aria-pressed={isSelected}
            className={cn(
              'group relative flex flex-col gap-3 rounded-lg p-4 cursor-pointer border transition-colors duration-150',
              isSelected
                ? 'border-(--color-accent) bg-(--color-accent-light)'
                : 'border-(--color-border) bg-transparent hover:border-(--color-border-strong) hover:bg-[rgba(245,240,232,0.5)]',
            )}
          >
            <div className="flex items-start gap-2">
              {/* Number badge */}
              <span
                className={cn(
                  'text-xs font-mono px-1.5 py-0.5 rounded-md shrink-0',
                  isSelected
                    ? 'bg-(--color-accent) text-white'
                    : 'bg-(--color-accent-light) text-(--color-text-muted)',
                )}
              >
                #{index + 1}
              </span>

              <div className="flex-1">
                {/* Title */}
                <h4 className="text-sm font-semibold text-(--color-text-primary) truncate">
                  {testCase.title}
                </h4>

                {/* Problem excerpt */}
                <p className="text-xs text-(--color-text-muted) line-clamp-2 leading-relaxed grow">
                  {testCase.problem || testCase.description || testCase.industry}
                </p>

                {/* Score chips */}
                {testCase.scores && (
                  <div className="flex gap-1 mt-2">
                    {Object.entries(testCase.scores)
                      .slice(0, 3)
                      .map(([key, value]) => (
                        <span
                          key={key}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-(--color-accent-light) text-(--color-text-secondary) border border-(--color-border)"
                        >
                          {key.replace(/_/g, ' ')}: {value}
                        </span>
                      ))}
                  </div>
                )}

                {/* View details button */}
                <div className="flex items-center justify-between mt-3">
                  <Button
                    variant="eco-soft"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openSpecificSampleTestCaseViewDetailsDrawer(testCase);
                    }}
                  >
                    <Eye size={14} className="mr-1" />
                    View Details
                  </Button>

                  {isSelected && (
                    <CheckCircle2 className="text-(--color-accent) shrink-0" size={16} />
                  )}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

SampleTestCasesContainer.propTypes = {
  setShowEvaluationParameters: PropTypes.func,
  openEvalParams: PropTypes.func,
  openBusinessContext: PropTypes.func,
};
