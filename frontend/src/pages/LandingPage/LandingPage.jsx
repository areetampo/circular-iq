import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@heroui/react';
import ParameterInputContainer from '@/pages/LandingPage/components/ParameterInputContainer';
import SampleTestCasesContainer from '@/pages/LandingPage/components/SampleTestCasesContainer';
import LiveCharacterCounter from '@/pages/LandingPage/components/LiveCharacterCounter';
// Session restore is handled globally via AppSessionManager + SessionRestoreDialog
import { useSession } from '@/features/session/hooks/useSession';
import { useGlobalModal } from '@/contexts/ModalContext';
import { useGlobalDialog } from '@/contexts/DialogContext';
import { getCharacterCount } from '@/lib/validation';
import { loadEvaluationState } from '@/lib/storage';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { assessmentSchema, defaultValues } from '@/features/assessments/validation';
import { scoreAssessment } from '@/features/assessments/api/assessmentApi';
import { Card, Tooltip, Label, TextArea as Textarea, ScrollShadow } from '@heroui/react';
import { Button } from '@/components/common';
import LoaderIcon from '@/components/common/LoaderIcon';
import { cn } from '@/utils/cn';
import { Accordion } from '@heroui/react';
import {
  Sparkles,
  LayoutGrid,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Leaf,
  ClipboardPenLine,
  BookOpen,
  ClipboardList,
  SlidersHorizontal,
} from 'lucide-react';
import InfoIconButton from '@/components/common/InfoIconButton';

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    hasEvaluationState,
    restoreEvaluation,
    clearEvaluation,
    saveEvaluation,
    hasRestorableSession,
    sessionData,
    saveSession,
    clearSession,
  } = useSession();
  const { openLimitReachedDialog } = useGlobalDialog();
  const {
    openBusinessProblemInfoModal,
    openBusinessSolutionInfoModal,
    openEvaluationParametersHeadingInfoModal,
    openAssessmentMethodologyModal,
    openEvaluationCriteriaModal,
  } = useGlobalModal();

  const [showEvaluationParameters, setShowEvaluationParameters] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // session prompt handled globally in AppSessionManager
  const skipAutosaveRef = useRef(false);
  const businessProblemSectionRef = useRef(null);
  // container ref used for focusout -> flush autosave
  const formContainerRef = useRef(null);

  const methods = useForm({
    resolver: zodResolver(assessmentSchema),
    mode: 'onChange',
    defaultValues,
  });

  const {
    register,
    reset,
    handleSubmit,
    formState: { isValid },
  } = methods;

  // Use refs + onChange handlers to debounce autosave without subscribing the whole
  // component to form changes (avoids re-renders on each keystroke).
  const autosaveTimerRef = useRef(null);

  // Session restoration is handled globally; landing page listens for navigation-state restore

  // Pre-fill form with data from ResultsPage (reevaluate)
  useEffect(() => {
    if (location.state?.formData) {
      const { businessProblem, businessSolution, parameters } = location.state.formData;
      reset({
        businessProblem: businessProblem || '',
        businessSolution: businessSolution || '',
        parameters: parameters || {},
      });
      // Open the evaluation parameters panel
      setShowEvaluationParameters(true);

      // Scroll to business problem section after a short delay
      setTimeout(() => {
        businessProblemSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
        // Show toast notification after scrolling starts
        setTimeout(() => {
          toast.info('Assessment Loaded', {
            description: 'Your previous assessment has been loaded for re-evaluation.',
            timeout: 3000,
          });
        }, 300);
      }, 100);

      // Clear the location state to prevent re-filling on subsequent visits
      window.history.replaceState({}, document.title);
    }
  }, [location.state, reset]);

  // Ensure LandingPage inputs are always synced from persisted session state
  // when navigating (SPA navigation). Navigation-state (location.state.formData)
  // takes precedence and won't be overridden by the persisted session here.
  // Sync persisted session inputs into the form, but do NOT overwrite
  // when the user has local edits that are newer than the persisted state.
  // This prevents stale session data from clobbering active edits.
  const lastAppliedSessionRef = useRef(null);
  // Timestamp of the last local save (set when persistInputs saves to localStorage).
  // Used to prevent older persisted sessions from overwriting newer local edits.
  const lastSavedLocalTimestampRef = useRef(null);

  useEffect(() => {
    if (location.state?.formData) return; // navigation state has priority
    const sessionInputs = sessionData?.inputs;
    if (!sessionInputs) return;

    // If the persisted session is older than a local save we performed, ignore it.
    // This prevents a timing window where persistInputs updates localStorage but
    // the useSession hook hasn't refetched yet and an older sessionData value
    // would otherwise overwrite the user's active edits.
    try {
      const persistedTs = sessionData?.timestamp ? new Date(sessionData.timestamp) : null;
      const lastLocalSaveTs = lastSavedLocalTimestampRef.current
        ? new Date(lastSavedLocalTimestampRef.current)
        : null;
      if (persistedTs && lastLocalSaveTs && persistedTs <= lastLocalSaveTs) {
        return; // incoming persisted data is stale compared to our last local save
      }
    } catch (err) {
      // ignore parsing errors and fall back to previous logic
    }

    // Helper to compare input shapes
    const inputsEqual = (a = {}, b = {}) => {
      try {
        const aBP = (a.businessProblem || '').trim();
        const bBP = (b.businessProblem || '').trim();
        const aBS = (a.businessSolution || '').trim();
        const bBS = (b.businessSolution || '').trim();
        const aParams = a.parameters || {};
        const bParams = b.parameters || {};
        return aBP === bBP && aBS === bBS && JSON.stringify(aParams) === JSON.stringify(bParams);
      } catch (err) {
        return false;
      }
    };

    const currentForm = methods.getValues();

    // If the current form already matches session inputs, just update lastApplied
    if (inputsEqual(currentForm, sessionInputs)) {
      lastAppliedSessionRef.current = sessionInputs;
      return;
    }

    // If we've never applied session state before, apply it now (initial load)
    if (!lastAppliedSessionRef.current) {
      reset({
        businessProblem: sessionInputs.businessProblem || '',
        businessSolution: sessionInputs.businessSolution || '',
        parameters: sessionInputs.parameters || {},
      });
      setShowEvaluationParameters(true);
      skipAutosaveRef.current = true;
      lastAppliedSessionRef.current = sessionInputs;
      return;
    }

    // If the current form equals the lastApplied snapshot, it means the user
    // hasn't edited since we last synced — safe to overwrite with new sessionData.
    if (inputsEqual(currentForm, lastAppliedSessionRef.current)) {
      reset({
        businessProblem: sessionInputs.businessProblem || '',
        businessSolution: sessionInputs.businessSolution || '',
        parameters: sessionInputs.parameters || {},
      });
      setShowEvaluationParameters(true);
      skipAutosaveRef.current = true;
      lastAppliedSessionRef.current = sessionInputs;
      return;
    }

    // Otherwise: user has local edits more recent than persisted session — do nothing.
  }, [sessionData, location.state, reset, methods]);

  useEffect(() => {
    // Session restore prompt display is handled globally via AppSessionManager
  }, [hasEvaluationState, hasRestorableSession]);

  const { user } = useAuth();

  // Debounced autosave using getValues inside delayed callback.
  // IMPORTANT: session.inputs and session.results are independent entities:
  // - session.inputs: Mutable user input (editable, changes on every keystroke)
  // - session.results: Immutable snapshot (includes businessProblem/Solution/params used to calculate it)
  // Reduced debounce to make UI feel more responsive and add a synchronous
  // flush path for blur / beforeunload to eliminate perceived lag.
  const AUTOSAVE_DEBOUNCE_MS = 150;

  const persistInputs = useCallback(
    (values) => {
      // Normalized current values
      const current = {
        businessProblem: (values?.businessProblem || '').trim(),
        businessSolution: (values?.businessSolution || '').trim(),
        parameters: values?.parameters || {},
      };

      // Stored inputs (read directly from localStorage to avoid useSession timing races)
      const storedState = loadEvaluationState();
      const stored = storedState?.inputs || {
        businessProblem: '',
        businessSolution: '',
        parameters: {},
      };

      const inputsEqualLocal = (a = {}, b = {}) => {
        try {
          const aBP = (a.businessProblem || '').trim();
          const bBP = (b.businessProblem || '').trim();
          const aBS = (a.businessSolution || '').trim();
          const bBS = (b.businessSolution || '').trim();
          const aParams = a.parameters || {};
          const bParams = b.parameters || {};
          return aBP === bBP && aBS === bBS && JSON.stringify(aParams) === JSON.stringify(bParams);
        } catch (err) {
          return false;
        }
      };

      // If nothing changed vs persisted state, skip writing to storage
      if (inputsEqualLocal(current, stored)) return;

      // Persist current inputs (this intentionally writes empty strings when user cleared fields)
      const savedAt = new Date().toISOString();
      saveSession({
        inputs: {
          businessProblem: values.businessProblem || '',
          businessSolution: values.businessSolution || '',
          parameters: values.parameters || {},
        },
        timestamp: savedAt,
      });

      try {
        // mark when we last saved locally (used by the session-sync guard)
        lastSavedLocalTimestampRef.current = savedAt;
        // update lastApplied snapshot so new persisted sessions won't overwrite active edits
        const snapshot = {
          businessProblem: values.businessProblem || '',
          businessSolution: values.businessSolution || '',
          parameters: values.parameters || {},
        };
        lastAppliedSessionRef.current = snapshot;
      } catch (err) {
        console.warn('Failed to update lastAppliedSessionRef after saving session:', err);
      }
    },
    [saveSession],
  );

  const scheduleAutosave = useCallback(() => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      if (skipAutosaveRef.current) {
        skipAutosaveRef.current = false;
        return;
      }

      const values = methods.getValues();
      persistInputs(values);
    }, AUTOSAVE_DEBOUNCE_MS);
  }, [methods, persistInputs]);

  // Synchronously persist current form values (used on blur / beforeunload)
  const flushAutosave = useCallback(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    // Persist synchronously
    try {
      const values = methods.getValues();
      persistInputs(values);
    } catch (err) {
      // swallow - form may be unmounted
      console.warn('flushAutosave failed', err);
    }
  }, [methods, persistInputs]);

  // Watch for form changes and trigger autosave
  useEffect(() => {
    if (!methods?.watch) return;
    const subscription = methods.watch(() => {
      scheduleAutosave();
    });
    return () => subscription?.unsubscribe?.();
  }, [methods, scheduleAutosave]);

  // Clean up autosave timer on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, []);

  // Flush autosave on focus leave inside the landing page to avoid "invisible"
  // delays between user edit and persistence.
  useEffect(() => {
    const el = formContainerRef.current;
    if (!el) return undefined;

    const onFocusOut = (ev) => {
      // flush synchronously when user leaves an input inside the page
      flushAutosave();
    };

    el.addEventListener('focusout', onFocusOut);
    return () => el.removeEventListener('focusout', onFocusOut);
  }, [flushAutosave]);

  // Warn the user when they try to close/refresh the page with unsaved inputs.
  useEffect(() => {
    const inputsEqual = (a = {}, b = {}) => {
      const aBP = (a.businessProblem || '').trim();
      const bBP = (b.businessProblem || '').trim();
      const aBS = (a.businessSolution || '').trim();
      const bBS = (b.businessSolution || '').trim();
      const aParams = a.parameters || {};
      const bParams = b.parameters || {};
      try {
        return aBP === bBP && aBS === bBS && JSON.stringify(aParams) === JSON.stringify(bParams);
      } catch (err) {
        return false;
      }
    };

    const shouldWarn = () => {
      const values = methods.getValues();
      // Prefer direct localStorage read to avoid races with useSession refetch
      const persisted = loadEvaluationState();
      const stored = persisted?.inputs ||
        sessionData?.inputs || {
          businessProblem: '',
          businessSolution: '',
          parameters: {},
        };

      // If the current form already matches persisted inputs, DO NOT warn
      if (inputsEqual(values, stored)) return false;

      // Otherwise warn when there is a pending autosave or the values differ
      return Boolean(autosaveTimerRef.current) || !inputsEqual(values, stored);
    };

    const handler = (e) => {
      if (!shouldWarn()) return;
      // Try to persist synchronously before leaving
      flushAutosave();
      // Standard browser prompt
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handler);
    // pagehide gives us a chance to synchronously persist on SPA-style navigations
    window.addEventListener('pagehide', flushAutosave);

    return () => {
      window.removeEventListener('beforeunload', handler);
      window.removeEventListener('pagehide', flushAutosave);
    };
  }, [methods, sessionData, flushAutosave]);

  const handleFormSubmit = async (formData) => {
    // Validate minimum character requirements
    if (getCharacterCount(formData.businessProblem) < 200) {
      toast.danger('Business Problem is too short', {
        description: 'Please provide at least 200 characters for the business problem description.',
        timeout: 4000,
      });
      return;
    }

    if (getCharacterCount(formData.businessSolution) < 200) {
      toast.danger('Business Solution is too short', {
        description:
          'Please provide at least 200 characters for the business solution description.',
        timeout: 4000,
      });
      return;
    }

    // Client-side junk detection: low unique-word ratio or too many symbols
    const uniqueWordRatio = (text) => {
      const words = (text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
      if (words.length === 0) return 0;
      const uniq = new Set(words);
      return uniq.size / words.length;
    };

    const nonLetterDensity = (text) => {
      const total = text.length || 1;
      // Move the fallback into the parameter or a variable to avoid crashes
      const matches = text.match(/[^a-z0-9\s.,_-]/gi) || [];
      return matches.length / total;
    };

    const probUniq = uniqueWordRatio(formData.businessProblem);
    const solUniq = uniqueWordRatio(formData.businessSolution);
    if (probUniq < 0.3 || solUniq < 0.3) {
      const msg =
        'Your inputs look repetitive or low-information. Please provide more specific detail in both problem and solution.';
      setError(msg);
      toast.danger('Input validation', { description: msg, timeout: 4000 });
      return;
    }

    if (
      nonLetterDensity(formData.businessProblem) > 0.25 ||
      nonLetterDensity(formData.businessSolution) > 0.25
    ) {
      const msg =
        'Your inputs contain excessive non-text characters. Please provide plain-language descriptions.';
      setError(msg);
      toast.danger('Input validation', { description: msg, timeout: 4000 });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await scoreAssessment(formData);

      // Persist inputs (unchanged behavior) and save the full result snapshot
      // returned by the backend (the `result` now includes businessProblem,
      // businessSolution and parameters so the snapshot is self-contained).
      saveSession({
        inputs: {
          businessProblem: formData.businessProblem,
          businessSolution: formData.businessSolution,
          parameters: formData.parameters || {},
        },
        results: result,
      });

      toast.success('Assessment complete!', {
        description: 'Your circularity evaluation has been generated successfully.',
        timeout: 3000,
      });

      // Navigate to Results with only the `result` because it is now self-contained
      // (frontend will read problem/solution/parameters from `result` if formData is not provided)
      navigate('/results', { state: { result } });
    } catch (err) {
      // Handle anonymous limit reached
      if (err?.code === 'LIMIT_REACHED') {
        openLimitReachedDialog({
          limit: err?.limit || 5,
          message:
            err?.message ||
            `You've reached the limit of free evaluations. Create an account to continue assessing your circular economy initiatives!`,
        });
        try {
          // clearSession();
        } catch (e) {
          console.error('Failed to clear session after limit reached:', e);
        }
        return;
      }

      const errorMessage = err?.message || err?.error || 'An unexpected error occurred';
      setError(errorMessage);
      toast.danger('Evaluation failed', {
        description: errorMessage,
        timeout: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <div ref={formContainerRef} className="w-full max-w-4xl mx-auto space-y-8">
        {/* Assessment Methodology & Evaluation Criteria Buttons */}
        <motion.div
          className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.div>
            <Button onClick={openAssessmentMethodologyModal} size="lg" variant="success">
              <BookOpen className="w-5 h-5" strokeWidth={2} />
              <span>Assessment Methodology</span>
            </Button>
          </motion.div>

          <motion.div>
            <Button onClick={openEvaluationCriteriaModal} size="lg" variant="eco-soft">
              <ClipboardList className="w-5 h-5" strokeWidth={2} />
              <span>Evaluation Criteria</span>
            </Button>
          </motion.div>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="transition-all border border-blue-100 hover:shadow-lg hover:border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
            <div className="flex flex-col items-center justify-center p-4">
              <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 shadow-lg shadow-blue-200/50">
                <Sparkles className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg text-center">AI-Powered</h3>
              <p className="mt-3 text-sm text-center text-gray-600 leading-relaxed">
                Machine learning analysis grounded in circular economy principles.
              </p>
            </div>
          </Card>

          <Card className="transition-all border border-emerald-100 hover:shadow-lg hover:border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
            <div className="flex flex-col items-center justify-center p-4">
              <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 shadow-lg shadow-emerald-200/50">
                <LayoutGrid className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg text-center">Multi-Dimensional</h3>
              <p className="mt-3 text-sm text-center text-gray-600 leading-relaxed">
                Evaluates across key domains for clarity and depth.
              </p>
            </div>
          </Card>

          <Card className="transition-all border border-amber-100 hover:shadow-lg hover:border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
            <div className="flex flex-col items-center justify-center p-4">
              <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 shadow-lg shadow-amber-200/50">
                <CheckCircle2 className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg text-center">Actionable</h3>
              <p className="mt-3 text-sm text-center text-gray-600 leading-relaxed">
                Clear recommendations you can apply immediately to improve outcomes.
              </p>
            </div>
          </Card>
        </div>

        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <Card ref={businessProblemSectionRef} className="transition-shadow border shadow-md">
            <div className="pb-8 px-2 sm:px-6 pt-6">
              <h2 className="inline-flex items-center gap-3 text-2xl font-bold text-teal-700">
                Evaluate Your Circular Economy Business
                <Leaf className="w-6 h-6" strokeWidth={3} />
              </h2>
              <p className="text-gray-600 mt-2">
                Describe your business idea using the same structure as real circular economy
                projects: what problem you solve, and how your solution addresses it.
              </p>
            </div>
            <div className="space-y-6 px-0 xxs:px-2 sm:px-6 pb-6">
              {/* Problem Input */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="ml-2 space-y-1">
                    <div className="flex items-center justify-start gap-3">
                      <Label htmlFor="business-problem" className="text-base font-bold">
                        Business Problem
                      </Label>
                      <InfoIconButton onClick={openBusinessProblemInfoModal} />
                    </div>
                    <p className="text-sm text-gray-600 font-semibold">
                      What environmental or circular economy challenge does your business address?
                    </p>
                  </div>
                </div>
                <Textarea
                  id="business-problem"
                  rows={4}
                  placeholder="Example: Single-use plastic packaging creates 8 million tons of ocean waste annually, depleting marine ecosystems and poisoning food chains. Current alternatives are either cost-prohibitive or require complex infrastructure..."
                  {...register('businessProblem', {
                    onBlur: () => flushAutosave(),
                  })}
                  disabled={loading}
                  className="w-full border border-gray-300 placeholder:opacity-60 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-gray-600 dark:focus:ring-green-900/40 rounded-lg transition-all duration-200 font-semibold"
                />
                <LiveCharacterCounter fieldName="businessProblem" minLength={200} />
              </div>

              {/* Solution Input */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="ml-2 space-y-1">
                    <div className="flex items-center justify-start gap-3">
                      <Label htmlFor="business-solution" className="text-base font-bold">
                        Business Solution
                      </Label>
                      <InfoIconButton onClick={openBusinessSolutionInfoModal} />
                    </div>
                    <p className="text-sm text-gray-600 font-semibold">
                      How does your business solve this problem? Include materials, processes, and
                      circularity strategy.
                    </p>
                  </div>
                </div>
                <Textarea
                  id="business-solution"
                  rows={5}
                  placeholder="Example: Our platform uses compostable packaging from agricultural hemp waste, combined with a hub-and-spoke collection model. Customers receive pre-addressed, compostable mailers; we aggregate returns at regional hubs; certified composting facilities process 95% of materials into soil amendments sold back to agriculture..."
                  {...register('businessSolution', {
                    onBlur: () => flushAutosave(),
                  })}
                  disabled={loading}
                  className="w-full border border-gray-300 placeholder:opacity-60 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-gray-600 dark:focus:ring-green-900/40 rounded-lg transition-all duration-200 font-semibold"
                />
                <LiveCharacterCounter fieldName="businessSolution" minLength={200} />
              </div>

              {/* EvaluationParameters Parameters Section */}
              <div className="w-full rounded-2xl bg-white shadow-sm overflow-hidden">
                <Accordion className="w-full" variant="default">
                  <Accordion.Item>
                    <Accordion.Heading>
                      <Accordion.Trigger className="hover:bg-slate-50/80 group/parent flex items-center gap-3 px-5 py-3 transition-colors duration-150">
                        <SlidersHorizontal
                          className={cn(
                            'h-6 w-6 shrink-0 text-emerald-500',
                            'transition-[scale,rotate] duration-300 ease-out',
                            'group-hover/parent:scale-[1.2] group-hover/parent:-rotate-[10deg] group-hover/parent:drop-shadow-md mr-1',
                          )}
                          strokeWidth={1.75}
                        />

                        <div className="flex flex-col gap-0.5 text-left">
                          <span className="font-bold text-lg leading-6 text-slate-800">
                            Evaluation Parameters
                          </span>
                          <span className="text-sm font-normal leading-4 text-slate-400">
                            Score each dimension of circular value
                          </span>
                        </div>

                        <InfoIconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            openEvaluationParametersHeadingInfoModal();
                          }}
                          className="ml-1 shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                        />

                        <Accordion.Indicator className="text-slate-300 [&>svg]:size-4">
                          <ChevronDown />
                        </Accordion.Indicator>
                      </Accordion.Trigger>
                    </Accordion.Heading>

                    <Accordion.Panel>
                      <Accordion.Body className="p-0 bg-transparent">
                        <ParameterInputContainer loading={loading} />
                      </Accordion.Body>
                    </Accordion.Panel>
                  </Accordion.Item>
                </Accordion>
              </div>

              {error && (
                <div className="p-1 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" strokeWidth={2.5} />
                    <strong className="text-red-700">Validation Error:</strong>
                  </div>
                  <p className="text-red-600 text-sm font-semibold">{error}, please try again.</p>
                </div>
              )}

              {/* Submit Button Section */}
              <div className="w-full">
                <Tooltip delay={0} isDisabled={isValid}>
                  <Tooltip.Trigger>
                    <Button
                      size="lg"
                      onPress={handleSubmit(handleFormSubmit)}
                      isDisabled={loading || !isValid}
                      variant="teal"
                      fullWidth
                      className="h-12"
                    >
                      {loading ? (
                        <LoaderIcon isButton={true} color="#ffffff" />
                      ) : (
                        <span>Evaluate Circularity</span>
                      )}
                    </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Content showArrow placement="top">
                    <Tooltip.Arrow />
                    <p className="text-xs font-bold">
                      Please fill out all required fields (min. 200 chars each)
                    </p>
                  </Tooltip.Content>
                </Tooltip>
              </div>

              {/* Test Case Selector */}
              <div className="w-full rounded-2xl bg-white shadow-sm overflow-hidden">
                <Accordion
                  className="w-full"
                  variant="default"
                  defaultExpandedKeys={['test-cases']}
                >
                  <Accordion.Item id="test-cases">
                    <Accordion.Heading>
                      <Accordion.Trigger className="hover:bg-slate-50/80 group/tc flex items-center gap-3 px-5 py-3 transition-colors duration-150">
                        <ClipboardList
                          className={cn(
                            'h-6 w-6 shrink-0 text-teal-500',
                            'transition-[scale,rotate] duration-300 ease-out',
                            'group-hover/tc:scale-[1.2] group-hover/tc:-rotate-[10deg] group-hover/tc:drop-shadow-md mr-1',
                          )}
                          strokeWidth={1.75}
                        />

                        <div className="flex flex-col gap-0.5 text-left">
                          <span className="font-bold text-[16px] leading-6 text-slate-800">
                            Sample Test Cases
                          </span>
                          <span className="text-xs font-normal leading-4 text-slate-400 italic">
                            Auto-fill the form with curated examples for quick testing
                          </span>
                        </div>

                        <InfoIconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            openEvaluationParametersHeadingInfoModal();
                          }}
                          className="ml-1 shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                        />

                        <Accordion.Indicator className="text-slate-300 [&>svg]:size-4">
                          <ChevronDown />
                        </Accordion.Indicator>
                      </Accordion.Trigger>
                    </Accordion.Heading>

                    <Accordion.Panel>
                      <Accordion.Body className="pt-2 bg-transparent">
                        <SampleTestCasesContainer />
                      </Accordion.Body>
                    </Accordion.Panel>
                  </Accordion.Item>
                </Accordion>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </FormProvider>
  );
}
