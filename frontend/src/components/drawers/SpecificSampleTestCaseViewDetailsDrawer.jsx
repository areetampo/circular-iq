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
      <Drawer.Backdrop className="bg-black/15 backdrop-blur-sm">
        <Drawer.Content
          placement={direction}
          className="bg-(--color-bg) border-l border-(--color-border-strong) shadow-[-8px_0_24px_rgba(0,0,0,0.08)]"
        >
          <Drawer.Dialog>
            {direction === 'bottom' && <Drawer.Handle />}
            {direction === 'right' && <Drawer.CloseTrigger aria-label="Close drawer" />}
            <Drawer.Header>
              <div className="flex items-start justify-between p-6 border-b border-(--color-border) shrink-0">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-(--color-accent-light) rounded-sm flex items-center justify-center text-(--color-accent) shrink-0 mt-0.5">
                    <PencilLine size={16} strokeWidth={1.75} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-(--color-text-primary)">{title}</h2>
                    <p className="text-xs text-(--color-text-muted) mt-0.5">
                      {TEST_CASE_DETAIL_CONTENT.subheading}
                    </p>
                  </div>
                </div>
                <Drawer.CloseTrigger
                  className="w-8 h-8 flex items-center justify-center rounded-sm text-(--color-text-muted) hover:text-(--color-text-primary) hover:bg-(--color-accent-light) transition-colors shrink-0"
                  aria-label="Close"
                />
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
