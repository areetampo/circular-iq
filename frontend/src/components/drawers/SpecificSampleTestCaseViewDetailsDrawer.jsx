import { Drawer } from '@heroui/react';
import { PencilLine } from 'lucide-react';
import PropTypes from 'prop-types';

import {
  TEST_CASE_DETAIL_CONTENT,
  getContextFieldIcon,
  getContextFieldLabel,
  getContextValueLabel,
} from '@/constants/drawers';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';

// Helper function to format business context labels and values

export default function SpecificSampleTestCaseViewDetailsDrawer({ testCase }) {
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
                <div className="w-8 h-8 rounded-lg bg-[rgba(74,85,104,0.1)] flex items-center justify-center shrink-0">
                  <PencilLine size={16} className="text-[#4a5568]" strokeWidth={1.75} />
                </div>
                <div>
                  <Drawer.Heading className="drawer__heading">{title}</Drawer.Heading>
                  <p className="text-[0.7rem] text-[#6b5f56] mt-0.5 font-normal">
                    {TEST_CASE_DETAIL_CONTENT.subheading}
                  </p>
                </div>
              </div>
            </Drawer.Header>
            <Drawer.Body className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Business Problem Section */}
                <div className="border-t border-(--color-border) pt-6 mt-6 first:border-0 first:pt-0 first:mt-0">
                  <h3 className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-3">
                    {TEST_CASE_DETAIL_CONTENT.sections.businessProblem.title}
                  </h3>
                  <p className="text-sm text-(--color-text-secondary) leading-relaxed mb-4">
                    {problem}
                  </p>
                </div>

                {/* Business Solution Section */}
                <div className="border-t border-(--color-border) pt-6 mt-6">
                  <h3 className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-3">
                    {TEST_CASE_DETAIL_CONTENT.sections.businessSolution.title}
                  </h3>
                  <p className="text-sm text-(--color-text-secondary) leading-relaxed mb-4">
                    {solution}
                  </p>
                </div>

                {/* Business Context Section */}
                {filteredBusinessContext.length > 0 && (
                  <div className="border-t border-(--color-border) pt-6 mt-6">
                    <h3 className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-3">
                      Business Context
                    </h3>
                    <div className="space-y-3">
                      {filteredBusinessContext.map(([key, value]) => {
                        const Icon = getContextFieldIcon(key);
                        return (
                          <div key={key} className="flex items-start gap-3 py-2">
                            <Icon className="w-4 h-4 text-(--color-accent) mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold uppercase tracking-wide text-(--color-text-muted) mb-1">
                                {getContextFieldLabel(key)}
                              </p>
                              <p className="text-sm text-(--color-text-primary)">
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
                <div className="border-t border-(--color-border) pt-6 mt-6">
                  <button className="variant-primary w-full py-2.5 text-sm font-medium rounded-sm bg-(--color-accent) text-white hover:opacity-90 transition-colors">
                    Load this test case
                  </button>
                </div>
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
