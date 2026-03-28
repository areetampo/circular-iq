import { Card, Drawer, Separator } from '@heroui/react';
import {
  BarChart3,
  Briefcase,
  Check,
  Globe,
  Layers,
  Lightbulb,
  Package,
  PencilLine,
  Target,
  TrendingUp,
} from 'lucide-react';
import PropTypes from 'prop-types';

import {
  TEST_CASE_DETAIL_CONTENT,
  getContextFieldIcon,
  getContextFieldLabel,
  getContextValueLabel,
} from '@/constants/drawers';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';
import { cn } from '@/utils/cn';

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
            {direction === 'bottom' && <Drawer.Handle />}
            {direction === 'right' && <Drawer.CloseTrigger aria-label="Close drawer" />}
            <Drawer.Header className="pb-0">
              <div className="w-full flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'p-3 rounded-xl shrink-0',
                      'transition-[transform,box-shadow] duration-300 ease-out',
                      isDrawerOpen
                        ? 'scale-110 -rotate-6 drop-shadow-lg'
                        : 'hover:scale-110 hover:-rotate-6 hover:shadow-md',
                    )}
                    style={{
                      backgroundColor: 'var(--info-soft)',
                    }}
                  >
                    <PencilLine
                      className="size-6"
                      style={{ color: 'var(--info)' }}
                      strokeWidth={2}
                    />
                  </div>
                  <div className="flex-1">
                    <Drawer.Heading
                      className="text-2xl font-bold mb-1"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {title}
                    </Drawer.Heading>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      {TEST_CASE_DETAIL_CONTENT.subheading}
                    </p>
                  </div>
                </div>
              </div>
            </Drawer.Header>
            <Separator className="mt-4" />
            <Drawer.Body className="gap-0 mt-0 max-h-[calc(100vh-120px)] overflow-y-auto">
              <div className="space-y-6 py-4">
                {/* Business Problem Section */}
                <Card
                  className="border-2 shadow-sm rounded-xl transition-colors duration-200"
                  style={{
                    borderColor: 'var(--success)',
                    background:
                      'linear-gradient(to bottom right, var(--success-soft), var(--surface))',
                  }}
                >
                  <Card.Header className="flex items-center gap-3 pb-3">
                    <div
                      className="p-2.5 rounded-lg"
                      style={{ backgroundColor: 'var(--success-soft)' }}
                    >
                      <Target
                        className="size-5"
                        style={{ color: 'var(--success)' }}
                        strokeWidth={2.5}
                      />
                    </div>
                    <div>
                      <Card.Title
                        className="font-bold text-base"
                        style={{ color: 'var(--foreground)' }}
                      >
                        {TEST_CASE_DETAIL_CONTENT.sections.businessProblem.title}
                      </Card.Title>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        {TEST_CASE_DETAIL_CONTENT.sections.businessProblem.subtitle}
                      </p>
                    </div>
                  </Card.Header>
                  <Card.Content className="pt-0">
                    <p
                      className="text-sm leading-relaxed p-3 rounded-lg"
                      style={{
                        color: 'var(--foreground)',
                        backgroundColor: 'var(--surface)',
                      }}
                    >
                      {problem}
                    </p>
                  </Card.Content>
                </Card>

                {/* Business Solution Section */}
                <Card
                  className="border-2 shadow-sm rounded-xl transition-colors duration-200"
                  style={{
                    borderColor: 'var(--success)',
                    background:
                      'linear-gradient(to bottom right, var(--success-soft), var(--surface))',
                  }}
                >
                  <Card.Header className="flex items-center gap-3 pb-3">
                    <div
                      className="p-2.5 rounded-lg"
                      style={{ backgroundColor: 'var(--success-soft)' }}
                    >
                      <Lightbulb
                        className="size-5"
                        style={{ color: 'var(--success)' }}
                        strokeWidth={2.5}
                      />
                    </div>
                    <div>
                      <Card.Title
                        className="font-bold text-base"
                        style={{ color: 'var(--foreground)' }}
                      >
                        {TEST_CASE_DETAIL_CONTENT.sections.businessSolution.title}
                      </Card.Title>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        {TEST_CASE_DETAIL_CONTENT.sections.businessSolution.subtitle}
                      </p>
                    </div>
                  </Card.Header>
                  <Card.Content className="pt-0">
                    <p
                      className="text-sm leading-relaxed p-3 rounded-lg"
                      style={{
                        color: 'var(--foreground)',
                        backgroundColor: 'var(--surface)',
                      }}
                    >
                      {solution}
                    </p>
                  </Card.Content>
                </Card>

                {/* Business Context Section */}
                {filteredBusinessContext.length > 0 && (
                  <Card
                    className="border-2 shadow-sm rounded-xl transition-colors duration-200"
                    style={{
                      borderColor: 'var(--warning)',
                      background:
                        'linear-gradient(to bottom right, var(--warning-soft), var(--surface))',
                    }}
                  >
                    <Card.Header className="flex items-center gap-3 pb-3">
                      <div
                        className="p-2.5 rounded-lg"
                        style={{ backgroundColor: 'var(--warning-soft)' }}
                      >
                        <Briefcase
                          className="size-5"
                          style={{ color: 'var(--warning)' }}
                          strokeWidth={2.5}
                        />
                      </div>
                      <div>
                        <Card.Title
                          className="font-bold text-base"
                          style={{ color: 'var(--foreground)' }}
                        >
                          {TEST_CASE_DETAIL_CONTENT.sections.businessContext.title}
                        </Card.Title>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                          {filteredBusinessContext.length} field
                          {filteredBusinessContext.length !== 1 ? 's' : ''} specified
                        </p>
                      </div>
                    </Card.Header>
                    <Card.Content className="pt-0">
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {filteredBusinessContext.map(([key, value]) => {
                          const label = getContextFieldLabel(key);
                          const displayValue = getContextValueLabel(key, value);
                          const iconName = getContextFieldIcon(key);
                          const icon =
                            iconName === 'Package' ? (
                              <Package className="size-4" />
                            ) : iconName === 'TrendingUp' ? (
                              <TrendingUp className="size-4" />
                            ) : iconName === 'Globe' ? (
                              <Globe className="size-4" />
                            ) : iconName === 'Layers' ? (
                              <Layers className="size-4" />
                            ) : iconName === 'Briefcase' ? (
                              <Briefcase className="size-4" />
                            ) : null;

                          return (
                            <div
                              key={key}
                              className="p-3 rounded-lg transition-colors duration-200 hover:border-[var(--warning)]"
                              style={{
                                backgroundColor: 'var(--surface)',
                                borderColor: 'var(--warning)',
                              }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                  {icon && (
                                    <div
                                      className="p-1.5 rounded-md shrink-0 mt-0.5 flex items-center justify-center"
                                      style={{ backgroundColor: 'var(--warning-soft)' }}
                                    >
                                      {icon}
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p
                                      className="text-xs font-bold uppercase tracking-wide"
                                      style={{ color: 'var(--warning)' }}
                                    >
                                      {label}
                                    </p>
                                    <p
                                      className="text-sm font-semibold mt-1.5 wrap-break-word"
                                      style={{ color: 'var(--foreground)' }}
                                    >
                                      {displayValue}
                                    </p>
                                  </div>
                                </div>
                                <div
                                  className="p-1 rounded-full shrink-0 mt-1"
                                  style={{ backgroundColor: 'var(--success-soft)' }}
                                >
                                  <Check
                                    className="size-3.5"
                                    style={{ color: 'var(--success)' }}
                                    strokeWidth={3}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card.Content>
                  </Card>
                )}

                {/* Evaluation Parameters / Scores Section */}
                <Card
                  className="border-2 shadow-sm rounded-xl transition-colors duration-200"
                  style={{
                    borderColor: 'var(--info)',
                    background:
                      'linear-gradient(to bottom right, var(--info-soft), var(--surface))',
                  }}
                >
                  <Card.Header className="flex items-center gap-3 pb-3">
                    <div
                      className="p-2.5 rounded-lg"
                      style={{ backgroundColor: 'var(--info-soft)' }}
                    >
                      <BarChart3
                        className="size-5"
                        style={{ color: 'var(--info)' }}
                        strokeWidth={2.5}
                      />
                    </div>
                    <div>
                      <Card.Title
                        className="font-bold text-base"
                        style={{ color: 'var(--foreground)' }}
                      >
                        {TEST_CASE_DETAIL_CONTENT.sections.evaluationParameters.title}
                      </Card.Title>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        {TEST_CASE_DETAIL_CONTENT.sections.evaluationParameters.subtitle}
                      </p>
                    </div>
                  </Card.Header>
                  <Card.Content className="pt-0">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      {Object.entries(evaluationParameters).map(([key, value]) => {
                        const isGood = value >= 75;
                        const isMedium = value >= 50;
                        const bgColor = isGood
                          ? 'var(--success-soft)'
                          : isMedium
                            ? 'var(--warning-soft)'
                            : 'var(--danger-soft)';
                        const borderColor = isGood
                          ? 'var(--success)'
                          : isMedium
                            ? 'var(--warning)'
                            : 'var(--danger)';
                        const textColor = isGood
                          ? 'var(--success)'
                          : isMedium
                            ? 'var(--warning)'
                            : 'var(--danger)';
                        const valueColor = isGood
                          ? 'var(--success)'
                          : isMedium
                            ? 'var(--warning)'
                            : 'var(--danger)';
                        const badgeColor = isGood
                          ? 'var(--success-soft)'
                          : isMedium
                            ? 'var(--warning-soft)'
                            : 'var(--danger-soft)';

                        return (
                          <div
                            key={key}
                            className="relative p-3 rounded-lg border-2 transition-colors duration-200"
                            style={{
                              backgroundColor: bgColor,
                              borderColor: borderColor,
                            }}
                          >
                            <div
                              className="text-xs font-bold uppercase tracking-wider mb-2"
                              style={{ color: textColor }}
                            >
                              {key.replace(/_/g, ' ')}
                            </div>
                            <div className="flex items-end gap-2">
                              <div className="text-2xl font-bold" style={{ color: valueColor }}>
                                {value}
                              </div>
                              <div
                                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: badgeColor,
                                  color: textColor,
                                }}
                              >
                                {isGood ? 'High' : isMedium ? 'Med' : 'Low'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card.Content>
                </Card>
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
