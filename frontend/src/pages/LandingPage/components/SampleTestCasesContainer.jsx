import { toast } from '@heroui/react';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { sampleTestCases } from '@/constants/sampleTestCases.js';
import { useGlobalDialog } from '@/contexts/DialogContext';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useSession } from '@/features/session/hooks/useSession';

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
            className="bg-[rgba(245,240,232,0.5)] border border-(--color-border) rounded-md p-4 cursor-pointer hover:border-(--color-accent) hover:bg-(--color-accent-light) transition-all text-left"
          >
            <div className="flex items-start gap-2">
              {/* Number badge */}
              <span className="text-xs font-mono text-(--color-text-muted) bg-(--color-accent-light) rounded-sm px-1.5 py-0.5 mr-2">
                #{index + 1}
              </span>

              <div className="flex-1">
                {/* Title */}
                <p className="text-sm font-semibold text-(--color-text-primary)">
                  {testCase.title}
                </p>

                {/* Description */}
                <p className="text-xs text-(--color-text-muted) mt-1 line-clamp-2 leading-relaxed">
                  {testCase.description || testCase.industry}
                </p>

                {/* Score chips */}
                {testCase.scores && (
                  <div className="flex gap-1 mt-2">
                    {Object.entries(testCase.scores)
                      .slice(0, 3)
                      .map(([key, value]) => (
                        <span
                          key={key}
                          className="text-xs text-(--color-text-secondary) px-2 py-0.5 font-mono"
                        >
                          {value}
                        </span>
                      ))}
                  </div>
                )}

                {/* View details link */}
                <div className="text-xs text-(--color-accent) hover:underline flex items-center gap-1 mt-2">
                  View details
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
