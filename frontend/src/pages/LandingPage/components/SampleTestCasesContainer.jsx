import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';
import useLandingModals from '@/pages/LandingPage/hooks/useLandingModals';
import testCases from '@/data/testCases.json';
import { Card, CardContent } from '@/components/ui/card';
import { Button as UIButton } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Button as HeroButton,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/react';
import { toast } from 'sonner';
import { ChevronDown, AlertCircle, ClipboardPenLine, PencilLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LandingModalManager from '@/components/modals/landing/LandingModalManager';
import InfoIconButton from '@/components/common/InfoIconButton';
import { cn } from '@/lib/utils';

export default function SampleTestCasesContainer({ setShowEvaluationParameters = () => {} }) {
  const { setValue, trigger, getValues } = useFormContext();
  const { modal, isModalOpen, onClose, openTestCaseHeading, openTestCase } = useLandingModals();
  const [selectedCase, setSelectedCase] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const {
    isOpen: isConfirmOpen,
    onOpen: onConfirmOpen,
    onOpenChange: onConfirmOpenChange,
  } = useDisclosure();
  const [pendingCase, setPendingCase] = useState(null);

  const handleSelectCase = async (testCase) => {
    setSelectedCase(testCase.id);
    setValue('businessProblem', testCase.problem, { shouldValidate: true });
    setValue('businessSolution', testCase.solution, { shouldValidate: true });
    setValue('parameters', testCase.parameters, { shouldValidate: true });
    await trigger();

    toast.success('Test case loaded!', {
      description: `"${testCase.title}" has been loaded into the form.`,
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
      onConfirmOpen();
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
    <div className="mt-8 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-4 pl-2">
          <ClipboardPenLine className="text-teal-600" size={24} />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">Sample Test Cases</h2>
              <InfoIconButton onClick={openTestCaseHeading} />
            </div>
            <p className="text-sm text-slate-600">
              Use curated examples to explore how the evaluator scores
            </p>
          </div>
        </div>
      </div>

      <motion.div>
        <UIButton
          type="button"
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-auto px-4 py-3 transition-all duration-300 border-2 border-emerald-200 rounded-xl bg-gradient-to-r from-emerald-50/60 via-teal-50/50 to-cyan-50/60 hover:from-emerald-100/30 hover:via-teal-100/30 hover:to-cyan-100/30 hover:border-emerald-300"
        >
          <div className="flex items-center justify-between w-full">
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900">Load a test case</p>
              <p className="text-xs text-slate-500 mt-0.5">Auto-fill the form for quick testing</p>
            </div>
            <ChevronDown
              className={cn(
                'w-5 h-5 text-emerald-600 transition-transform duration-300 flex-shrink-0',
                isOpen && 'rotate-180',
              )}
            />
          </div>
        </UIButton>
      </motion.div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-5 space-y-4 border-2 rounded-xl border-primary-500/50 bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/20">
              <div className="grid grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2 max-h-96">
                {testCases.testCases.map((testCase, index) => (
                  <Card
                    key={testCase.id}
                    onClick={() => requestSelectCase(testCase)}
                    className={cn(
                      'cursor-pointer transition-colors duration-200 h-full border-2 shadow-sm',
                      selectedCase === testCase.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-emerald-200 bg-white hover:bg-emerald-50 ',
                    )}
                  >
                    <CardContent className="flex flex-col h-full p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h4 className="flex-1 text-sm font-semibold leading-tight text-slate-900">
                          {testCase.title}
                        </h4>
                        <Badge
                          variant="secondary"
                          className="flex-shrink-0 px-2 py-1 text-xs font-semibold border bg-emerald-500/10 text-emerald-700 border-emerald-200"
                        >
                          #{index + 1}
                        </Badge>
                      </div>

                      <p className="flex-grow mb-3 text-xs leading-relaxed text-slate-600 line-clamp-2">
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

                      <UIButton
                        onClick={(e) => {
                          e.stopPropagation();
                          openTestCase(testCase);
                        }}
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 mt-3 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        View details
                      </UIButton>
                    </CardContent>
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

      <Modal
        isOpen={isConfirmOpen}
        onOpenChange={onConfirmOpenChange}
        isDismissable={false}
        isKeyboardDismissDisabled
        hideCloseButton
        placement="center"
        backdrop="opaque"
        classNames={{
          backdrop: 'bg-black/50',
          base: 'bg-white rounded-2xl shadow-xl',
        }}
      >
        <ModalContent className="max-w-md">
          {(onClose) => (
            <>
              <div className="flex justify-center pt-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100">
                  <AlertCircle className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <ModalHeader className="flex flex-col items-center gap-0 pt-2 text-center">
                <h2 className="text-base font-semibold text-slate-900">Replace current inputs?</h2>
              </ModalHeader>
              <ModalBody className="text-center">
                <p className="text-sm text-slate-600">
                  Loading a test case will overwrite your current business problem and solution. Do
                  you want to continue?
                </p>
              </ModalBody>
              <ModalFooter className="justify-center gap-3 pb-4">
                <HeroButton
                  variant="bordered"
                  onPress={() => {
                    setPendingCase(null);
                    onClose();
                  }}
                >
                  Cancel
                </HeroButton>
                <HeroButton
                  color="success"
                  onPress={() => {
                    if (pendingCase) handleSelectCase(pendingCase);
                    setPendingCase(null);
                    onClose();
                  }}
                >
                  Replace
                </HeroButton>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <LandingModalManager modal={modal} isModalOpen={isModalOpen} onClose={onClose} />
    </div>
  );
}

SampleTestCasesContainer.propTypes = {
  setShowEvaluationParameters: PropTypes.func,
};
