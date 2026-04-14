import { Drawer } from '@heroui/react';
import { PencilLine } from 'lucide-react';
import PropTypes from 'prop-types';

import {
  TEST_CASE_DETAIL_CONTENT,
  getContextFieldIcon,
  getContextFieldLabel,
  getContextValueLabel,
} from '@/constants/drawers';
import { parameterLabels } from '@/constants/evaluationData';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';

// Helper function to format business context labels and values

export default function SpecificSampleTestCaseViewDetailsDrawer({ testCase, requestSelectCase }) {
  if (!testCase) return null;

  const { title, problem, solution, evaluationParameters, businessContext } = testCase;

  const { isDrawerOpen, onClose } = useGlobalDrawer();
  const direction = useDrawerDirection();

  // Filter out empty business context values
  const filteredBusinessContext = businessContext
    ? Object.entries(businessContext).filter(
        ([, value]) => value !== null && value !== undefined && value !== '' && value !== false,
      )
    : [];

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Drawer.Backdrop>
        <Drawer.Content placement={direction}>
          <Drawer.Dialog>
            {direction === 'bottom' ? (
              <Drawer.Handle />
            ) : (
              <Drawer.CloseTrigger aria-label="Close" />
            )}
            <Drawer.Header>
              <div className="flex items-center gap-3 pr-8">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-(--color-drawer-icon-slate-bg)">
                  <PencilLine
                    size={16}
                    className="text-(--color-drawer-icon-slate-text)"
                    strokeWidth={1.75}
                  />
                </div>
                <div>
                  <Drawer.Heading className="drawer__heading font-mono">{title}</Drawer.Heading>
                  <p className="mt-0.5 font-mono text-[0.7rem] font-normal text-(--color-text-secondary)">
                    {TEST_CASE_DETAIL_CONTENT.subheading}
                  </p>
                </div>
              </div>
            </Drawer.Header>
            <Drawer.Body className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Business Problem Section */}
                <div className="mt-6 border-t border-border pt-6 first:mt-0 first:border-0 first:pt-0">
                  <h3 className="mb-3 font-mono text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
                    {TEST_CASE_DETAIL_CONTENT.sections.businessProblem.title}
                  </h3>
                  <p className="mb-4 font-mono text-sm/relaxed text-(--color-text-secondary)">
                    {problem}
                  </p>
                </div>

                {/* Business Solution Section */}
                <div className="mt-6 border-t border-border pt-6">
                  <h3 className="mb-3 font-mono text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
                    {TEST_CASE_DETAIL_CONTENT.sections.businessSolution.title}
                  </h3>
                  <p className="mb-4 font-mono text-sm/relaxed text-(--color-text-secondary)">
                    {solution}
                  </p>
                </div>

                {/* Evaluation Parameters Section */}
                {evaluationParameters && Object.keys(evaluationParameters).length > 0 && (
                  <div className="mt-6 border-t border-border pt-6">
                    <h3 className="mb-3 font-mono text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
                      {TEST_CASE_DETAIL_CONTENT.sections.evaluationParameters.title}
                    </h3>
                    <p className="mb-4 font-mono text-xs text-(--color-text-muted)">
                      {TEST_CASE_DETAIL_CONTENT.sections.evaluationParameters.subtitle}
                    </p>
                    <div className="space-y-3">
                      {Object.entries(evaluationParameters).map(([key, value]) => {
                        const paramInfo = parameterLabels[key];
                        return (
                          <div key={key} className="flex items-center justify-between py-2">
                            <div className="flex-1">
                              <p className="mb-1 font-mono text-xs font-semibold tracking-wide text-(--color-text-muted) uppercase">
                                {paramInfo?.label ||
                                  key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                              </p>
                              <p className="font-mono text-xs text-(--color-text-secondary)">
                                {paramInfo?.category || 'Uncategorized'}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="font-mono text-sm font-medium text-(--color-text-primary)">
                                {value}
                              </span>
                              <span className="ml-1 font-mono text-xs text-(--color-text-muted)">
                                /100
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Business Context Section */}
                {filteredBusinessContext.length > 0 && (
                  <div className="mt-6 border-t border-border pt-6">
                    <h3 className="mb-3 font-mono text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
                      Business Context
                    </h3>
                    <div className="space-y-3">
                      {filteredBusinessContext.map(([key, value]) => {
                        const Icon = getContextFieldIcon(key);
                        return (
                          <div key={key} className="flex items-start gap-3 py-2">
                            <Icon className="mt-0.5 size-4 shrink-0 text-(--color-accent)" />
                            <div className="flex-1">
                              <p className="mb-1 font-mono text-xs font-semibold tracking-wide text-(--color-text-muted) uppercase">
                                {getContextFieldLabel(key)}
                              </p>
                              <p className="font-mono text-sm text-(--color-text-primary)">
                                {getContextValueLabel(key, value)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Load this test case button */}
                {/* <div className="flex justify-center mt-6">
                  <Button size="lg" onClick={() => requestSelectCase(testCase)}>
                    Load this test case
                  </Button>
                </div> */}
              </div>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

SpecificSampleTestCaseViewDetailsDrawer.propTypes = {
  testCase: PropTypes.shape({
    title: PropTypes.string.isRequired,
    problem: PropTypes.string.isRequired,
    solution: PropTypes.string.isRequired,
    evaluationParameters: PropTypes.object.isRequired,
    businessContext: PropTypes.object.isRequired,
  }).isRequired,
};
