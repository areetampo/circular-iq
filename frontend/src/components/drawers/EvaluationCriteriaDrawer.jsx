import { Drawer } from '@heroui/react';
import { CircleDollarSign, ClipboardMinus, Link, Settings } from 'lucide-react';

import { EVALUATION_CRITERIA_CONTENT } from '@/constants/drawers';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';
import { cn } from '@/utils/cn';

export default function EvaluationCriteriaDrawer() {
  const { isDrawerOpen, onClose } = useGlobalDrawer();
  const direction = useDrawerDirection();

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
            <Drawer.Header>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-lg shrink-0',
                      'transition-[transform,box-shadow] duration-300 ease-out',
                      isDrawerOpen
                        ? 'scale-[1.12] -rotate-6 drop-shadow-md'
                        : 'hover:scale-110 hover:-rotate-6 hover:shadow-md',
                    )}
                    style={{
                      backgroundColor: 'var(--success-soft)',
                    }}
                  >
                    <ClipboardMinus className="size-5" style={{ color: 'var(--success)' }} />
                  </div>
                  <div>
                    <Drawer.Heading className="text-lg font-semibold">
                      {EVALUATION_CRITERIA_CONTENT.heading}
                    </Drawer.Heading>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      {EVALUATION_CRITERIA_CONTENT.subheading}
                    </p>
                  </div>
                </div>
              </div>
            </Drawer.Header>
            <Drawer.Body className="gap-6 mt-4">
              <div className="space-y-6">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {EVALUATION_CRITERIA_CONTENT.description}
                </p>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  {EVALUATION_CRITERIA_CONTENT.metrics.map((metric, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg text-center border`}
                      style={{
                        backgroundColor:
                          metric.color === 'blue' ? 'var(--info-soft)' : 'var(--success-soft)',
                        borderColor: metric.color === 'blue' ? 'var(--info)' : 'var(--success)',
                      }}
                    >
                      <div
                        className="text-2xl font-bold"
                        style={{
                          color: metric.color === 'blue' ? 'var(--info)' : 'var(--success)',
                        }}
                      >
                        {metric.number}
                      </div>
                      <div className="text-xs font-medium mt-1" style={{ color: 'var(--muted)' }}>
                        {metric.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Value Sections */}
                <div className="space-y-4">
                  {EVALUATION_CRITERIA_CONTENT.valueSections.map((section, idx) => {
                    const icon =
                      section.title === 'Access Value' ? (
                        <Link className="size-6" />
                      ) : section.title === 'Embedded Value' ? (
                        <CircleDollarSign className="size-6" />
                      ) : (
                        <Settings className="size-6" />
                      );
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border-l-4`}
                        style={{
                          borderLeftColor:
                            section.color === 'blue'
                              ? 'var(--info)'
                              : section.color === 'emerald'
                                ? 'var(--success)'
                                : 'var(--accent)',
                          backgroundColor:
                            section.color === 'blue'
                              ? 'var(--info-soft)'
                              : section.color === 'emerald'
                                ? 'var(--success-soft)'
                                : 'var(--accent-soft)',
                        }}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div
                            style={{
                              color:
                                section.color === 'blue'
                                  ? 'var(--info)'
                                  : section.color === 'emerald'
                                    ? 'var(--success)'
                                    : 'var(--accent)',
                            }}
                          >
                            {icon}
                          </div>
                          <div className="flex-1">
                            <h4
                              style={{
                                color:
                                  section.color === 'blue'
                                    ? 'var(--info)'
                                    : section.color === 'emerald'
                                      ? 'var(--success)'
                                      : 'var(--accent)',
                              }}
                            >
                              {section.title}
                            </h4>
                            <p className="text-xs" style={{ color: 'var(--muted)' }}>
                              {section.description}
                            </p>
                          </div>
                        </div>
                        <div className={`grid grid-cols-1 gap-2 mt-3 ${section.gridCols}`}>
                          {section.factors.map((factor, factorIdx) => (
                            <div
                              key={factorIdx}
                              style={{
                                backgroundColor: 'var(--surface)',
                                borderColor: 'var(--border)',
                              }}
                            >
                              <p
                                className="text-xs font-semibold"
                                style={{ color: 'var(--foreground)' }}
                              >
                                {factor.title}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                                {factor.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* How We Calculate Section */}
                <div
                  className="p-4 rounded-xl border"
                  style={{
                    backgroundColor: 'var(--warning-soft)',
                    borderColor: 'var(--warning)',
                  }}
                >
                  <h4 className="font-bold mb-3 text-base" style={{ color: 'var(--warning)' }}>
                    {EVALUATION_CRITERIA_CONTENT.sections.howWeCalculate}
                  </h4>
                  <div className="space-y-2">
                    {EVALUATION_CRITERIA_CONTENT.calculationSteps.map((step) => (
                      <div key={step.number} className="flex items-start gap-3">
                        <div
                          className="flex items-center justify-center shrink-0 w-6 h-6 font-bold text-white rounded-full text-sm"
                          style={{ backgroundColor: 'var(--warning)' }}
                        >
                          {step.number}
                        </div>
                        <div className="flex-1">
                          <p
                            className="text-xs font-semibold"
                            style={{ color: 'var(--foreground)' }}
                          >
                            {step.title}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

EvaluationCriteriaDrawer.propTypes = {};
