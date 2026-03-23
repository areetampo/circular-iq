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
                      'p-3 rounded-xl bg-blue-100 shrink-0',
                      'transition-[transform,box-shadow] duration-300 ease-out',
                      isDrawerOpen
                        ? 'scale-110 -rotate-6 drop-shadow-lg'
                        : 'hover:scale-110 hover:-rotate-6 hover:shadow-md',
                    )}
                  >
                    <PencilLine className="size-6 text-blue-600" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <Drawer.Heading className="text-2xl font-bold text-gray-900 mb-1">
                      {title}
                    </Drawer.Heading>
                    <p className="text-sm text-slate-500">{TEST_CASE_DETAIL_CONTENT.subheading}</p>
                  </div>
                </div>
              </div>
            </Drawer.Header>
            <Separator className="mt-4" />
            <Drawer.Body className="gap-0 mt-0 max-h-[calc(100vh-120px)] overflow-y-auto">
              <div className="space-y-6 py-4">
                {/* Business Problem Section */}
                <Card className="border-2 border-emerald-200 shadow-sm rounded-xl bg-linear-to-br from-emerald-50/60 to-white hover:shadow-md transition-shadow duration-200">
                  <Card.Header className="flex items-center gap-3 pb-3">
                    <div className="p-2.5 rounded-lg bg-emerald-100/80">
                      <Target className="size-5 text-emerald-700" strokeWidth={2.5} />
                    </div>
                    <div>
                      <Card.Title className="font-bold text-base text-gray-900">
                        {TEST_CASE_DETAIL_CONTENT.sections.businessProblem.title}
                      </Card.Title>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {TEST_CASE_DETAIL_CONTENT.sections.businessProblem.subtitle}
                      </p>
                    </div>
                  </Card.Header>
                  <Card.Content className="pt-0">
                    <p className="text-sm leading-relaxed text-gray-700 bg-white/50 p-3 rounded-lg">
                      {problem}
                    </p>
                  </Card.Content>
                </Card>

                {/* Business Solution Section */}
                <Card className="border-2 border-teal-200 shadow-sm rounded-xl bg-linear-to-br from-teal-50/60 to-white hover:shadow-md transition-shadow duration-200">
                  <Card.Header className="flex items-center gap-3 pb-3">
                    <div className="p-2.5 rounded-lg bg-teal-100/80">
                      <Lightbulb className="size-5 text-teal-700" strokeWidth={2.5} />
                    </div>
                    <div>
                      <Card.Title className="font-bold text-base text-gray-900">
                        {TEST_CASE_DETAIL_CONTENT.sections.businessSolution.title}
                      </Card.Title>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {TEST_CASE_DETAIL_CONTENT.sections.businessSolution.subtitle}
                      </p>
                    </div>
                  </Card.Header>
                  <Card.Content className="pt-0">
                    <p className="text-sm leading-relaxed text-gray-700 bg-white/50 p-3 rounded-lg">
                      {solution}
                    </p>
                  </Card.Content>
                </Card>

                {/* Business Context Section */}
                {filteredBusinessContext.length > 0 && (
                  <Card className="border-2 border-amber-200 shadow-sm rounded-xl bg-linear-to-br from-amber-50/60 to-white hover:shadow-md transition-shadow duration-200">
                    <Card.Header className="flex items-center gap-3 pb-3">
                      <div className="p-2.5 rounded-lg bg-amber-100/80">
                        <Briefcase className="size-5 text-amber-700" strokeWidth={2.5} />
                      </div>
                      <div>
                        <Card.Title className="font-bold text-base text-gray-900">
                          {TEST_CASE_DETAIL_CONTENT.sections.businessContext.title}
                        </Card.Title>
                        <p className="text-xs text-slate-500 mt-0.5">
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
                              className="p-3 rounded-lg bg-white border border-amber-100 hover:border-amber-200 hover:shadow-sm transition-all duration-200"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                  {icon && (
                                    <div className="p-1.5 rounded-md bg-amber-100/80 shrink-0 mt-0.5 flex items-center justify-center">
                                      {icon}
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                                      {label}
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900 mt-1.5 wrap-break-word">
                                      {displayValue}
                                    </p>
                                  </div>
                                </div>
                                <div className="p-1 rounded-full bg-emerald-100 shrink-0 mt-1">
                                  <Check className="size-3.5 text-emerald-600" strokeWidth={3} />
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
                <Card className="border-2 border-blue-200 shadow-sm rounded-xl bg-linear-to-br from-blue-50/60 to-white hover:shadow-md transition-shadow duration-200">
                  <Card.Header className="flex items-center gap-3 pb-3">
                    <div className="p-2.5 rounded-lg bg-blue-100/80">
                      <BarChart3 className="size-5 text-blue-700" strokeWidth={2.5} />
                    </div>
                    <div>
                      <Card.Title className="font-bold text-base text-gray-900">
                        {TEST_CASE_DETAIL_CONTENT.sections.evaluationParameters.title}
                      </Card.Title>
                      <p className="text-xs text-slate-500 mt-0.5">
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
                          ? 'bg-emerald-50'
                          : isMedium
                            ? 'bg-amber-50'
                            : 'bg-red-50';
                        const borderColor = isGood
                          ? 'border-emerald-200'
                          : isMedium
                            ? 'border-amber-200'
                            : 'border-red-200';
                        const textColor = isGood
                          ? 'text-emerald-700'
                          : isMedium
                            ? 'text-amber-700'
                            : 'text-red-700';
                        const valueColor = isGood
                          ? 'text-emerald-600'
                          : isMedium
                            ? 'text-amber-600'
                            : 'text-red-600';
                        const badgeColor = isGood
                          ? 'bg-emerald-100'
                          : isMedium
                            ? 'bg-amber-100'
                            : 'bg-red-100';

                        return (
                          <div
                            key={key}
                            className={`relative p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${bgColor} ${borderColor}`}
                          >
                            <div
                              className={`text-xs font-bold uppercase tracking-wider mb-2 ${textColor}`}
                            >
                              {key.replace(/_/g, ' ')}
                            </div>
                            <div className="flex items-end gap-2">
                              <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
                              <div
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor} ${textColor}`}
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
