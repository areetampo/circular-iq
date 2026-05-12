import { Drawer } from '@heroui/react';
import { PencilLine } from 'lucide-react';
import PropTypes from 'prop-types';

import {
  TEST_CASE_DETAIL_CONTENT,
  getContextFieldIcon,
  getContextFieldLabel,
  getContextValueLabel,
} from '@/constants/drawers';
import { parameterGroups, parameterLabels } from '@/constants/evaluationData';
import { GROUP_STYLE_CONFIG } from '@/constants/groupStyleConfig';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks';
import { cn } from '@/utils/cn';

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
                <div className="mt-6 pt-6 first:mt-0 first:border-0 first:pt-0">
                  <h3 className="mb-3 font-mono text-xs font-semibold tracking-widest uppercase">
                    {TEST_CASE_DETAIL_CONTENT.sections.businessProblem.title}
                  </h3>
                  <p className="mb-4 font-mono text-sm/relaxed text-(--color-text-secondary)">
                    {problem}
                  </p>
                </div>

                {/* Business Solution Section */}
                <div className="mt-6">
                  <h3 className="mb-3 font-mono text-xs font-semibold tracking-widest uppercase">
                    {TEST_CASE_DETAIL_CONTENT.sections.businessSolution.title}
                  </h3>
                  <p className="mb-4 font-mono text-sm/relaxed text-(--color-text-secondary)">
                    {solution}
                  </p>
                </div>

                {/* Evaluation Parameters Section */}
                {evaluationParameters && Object.keys(evaluationParameters).length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-mono text-xs font-semibold tracking-widest uppercase">
                      {TEST_CASE_DETAIL_CONTENT.sections.evaluationParameters.title}
                    </h3>
                    <p className="mb-4 text-xs text-(--color-text-muted)">
                      {TEST_CASE_DETAIL_CONTENT.sections.evaluationParameters.subtitle}
                    </p>
                    <div className="space-y-4">
                      {Object.entries(parameterGroups).map(([groupName, paramKeys]) => {
                        const groupConfig = GROUP_STYLE_CONFIG[groupName];
                        const Icon = groupConfig?.Icon;
                        const styling = groupConfig
                          ? {
                              bg: groupConfig.paramBg,
                              textColor: groupConfig.paramTextColor,
                              border: groupConfig.paramBorder,
                            }
                          : {};

                        return (
                          <div
                            key={groupName}
                            className={cn('space-y-3 rounded-xl p-4')}
                            style={{
                              backgroundColor: `color-mix(in srgb, var${styling.textColor.replace('text-', '')}, transparent 95%)`,
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {Icon && (
                                <Icon size={20} strokeWidth={2} className={groupConfig.iconColor} />
                              )}
                              <div className="flex-1">
                                <h4 className="font-mono text-sm font-medium text-(--color-text-primary) uppercase">
                                  {groupName}
                                </h4>
                                <p className="text-xs text-(--color-text-muted)">
                                  {groupConfig?.subtitle}
                                </p>
                              </div>
                            </div>
                            <div className={cn('grid grid-cols-1 gap-1', 'pl-7')}>
                              {paramKeys.map((paramKey) => {
                                const value = evaluationParameters[paramKey];
                                if (value === undefined || value === null) return null;

                                const paramInfo = parameterLabels[paramKey];

                                return (
                                  <div
                                    key={paramKey}
                                    className="flex w-fit items-center gap-3 rounded-full"
                                  >
                                    <div className="rounded-full">
                                      <p className="text-sm font-medium text-(--color-text-primary) uppercase">
                                        {paramInfo?.label ||
                                          paramKey
                                            .replace(/_/g, ' ')
                                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                                      </p>
                                    </div>
                                    <div
                                      className={cn('font-mono text-base font-semibold')}
                                      style={{
                                        color: `color-mix(in srgb, var${styling.textColor.replace('text-', '')}, transparent 20%)`,
                                      }}
                                    >
                                      {value}/100
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Business Context Section */}
                {filteredBusinessContext.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-3 font-mono text-xs font-semibold tracking-widest uppercase">
                      Business Context
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {filteredBusinessContext.map(([key, value]) => {
                        const Icon = getContextFieldIcon(key);
                        return (
                          <div key={key} className="flex items-start gap-3">
                            <Icon
                              className="mt-0.5 size-4.5 shrink-0 text-(--color-accent)"
                              strokeWidth={2}
                            />
                            <div className="flex-1">
                              <p className="mb-1 font-mono text-sm font-medium tracking-wide text-(--color-warning)/85 uppercase">
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

                {/* Load this test case button - removed */}
                {/* the toast that follows makes the drawer flicker */}
                {/* <div className="flex justify-center mt-6">
                  <Button size="lg" onPress={() => requestSelectCase(testCase)}>
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
