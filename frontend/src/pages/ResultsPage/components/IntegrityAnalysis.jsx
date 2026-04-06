import { Accordion } from '@heroui/react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import PropTypes from 'prop-types';

import { Chip } from '@/components/common';
import { SectionHeading } from '@/components/common/SectionHeading';

export function IntegrityAnalysis({ strengths, gaps }) {
  if (!(gaps.length > 0 || strengths.length > 0)) return null;

  const getSeverityColors = (severity) => {
    return (
      {
        high: 'var(--danger-soft)',
        medium: 'var(--warning-soft)',
        low: 'var(--info-soft)',
      }[severity] || 'var(--info-soft)'
    );
  };

  return (
    <div className="border-2 border-[rgba(180,160,130,0.25)] rounded-3xl bg-transparent">
      <div className="p-2 sm:p-4">
        <SectionHeading variant="small" className="mb-1">
          Integrity Analysis
        </SectionHeading>
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
          We compare your self-assessed scores against real-world projects in our database to
          identify potential overestimations or underestimations.
        </p>

        <Accordion type="single" collapsible className="space-y-3">
          {/* Strengths */}
          {strengths.length > 0 && (
            <Accordion.Item
              value="strengths"
              className="rounded-lg overflow-hidden"
              style={{
                backgroundColor: 'var(--success-soft)',
                borderColor: 'var(--success)',
              }}
            >
              <Accordion.Trigger className="px-4 py-3 hover:bg-success-soft transition-colors">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
                  <span
                    className="text-base font-semibold"
                    style={{
                      color: 'var(--foreground)',
                    }}
                  >
                    Strengths Validated
                  </span>
                  <Chip variant="status" color="success" size="sm" className="ml-2 font-bold">
                    {strengths.length}
                  </Chip>
                </div>
              </Accordion.Trigger>
              <Accordion.Body className="px-4 pb-4">
                <div className="space-y-2">
                  {strengths.map((strength, i) => (
                    <div
                      key={i}
                      className="flex gap-2 p-3 rounded-lg border"
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: 'var(--success)',
                      }}
                    >
                      <CheckCircle2
                        className="shrink-0 mt-0.5"
                        size={16}
                        style={{ color: 'var(--success)' }}
                      />
                      <div className="flex-1">
                        <p
                          className="text-sm"
                          style={{
                            color: 'var(--foreground)',
                          }}
                        >
                          {strength.issue || strength}
                        </p>
                        {strength.evidence_source_id && (
                          <Chip variant="case" className="mt-1 text-xs">
                            Validated by Case #{strength.evidence_source_id}
                          </Chip>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Accordion.Body>
            </Accordion.Item>
          )}

          {/* Areas for Improvement */}
          {gaps.length > 0 && (
            <Accordion.Item
              value="gaps"
              className="rounded-lg overflow-hidden"
              style={{
                backgroundColor: 'var(--warning-soft)',
                borderColor: 'var(--warning)',
              }}
            >
              <Accordion.Trigger className="px-4 py-3 hover:bg-warning-soft transition-colors">
                <div className="flex items-center gap-2">
                  <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
                  <span
                    className="text-base font-semibold"
                    style={{
                      color: 'var(--foreground)',
                    }}
                  >
                    Areas for Improvement
                  </span>
                  <Chip variant="status" color="warning" size="sm" className="ml-2 font-bold">
                    {gaps.length}
                  </Chip>
                </div>
              </Accordion.Trigger>
              <Accordion.Body className="px-4 pb-4">
                <div className="space-y-2">
                  {gaps.map((gap, i) => {
                    const severity = gap.severity || 'medium';

                    return (
                      <div
                        key={i}
                        className={`flex gap-2 p-3 rounded-lg border bg-surface`}
                        style={{
                          backgroundColor: 'var(--surface)',
                          borderColor: getSeverityColors(severity),
                        }}
                      >
                        <AlertCircle
                          className="shrink-0 mt-0.5"
                          size={16}
                          style={{ color: 'var(--warning)' }}
                        />
                        <div className="flex-1">
                          <p
                            className="text-sm"
                            style={{
                              color: 'var(--foreground)',
                            }}
                          >
                            {(gap.issue || gap).replace(/_/g, ' ')}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Chip
                              variant="severity"
                              color={severity}
                              size="sm"
                              className="font-bold text-xs"
                            >
                              {severity.charAt(0).toUpperCase() + severity.slice(1)} severity
                            </Chip>
                            {gap.evidence_source_id && (
                              <Chip variant="case" className="text-xs">
                                Case #{gap.evidence_source_id}
                              </Chip>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Accordion.Body>
            </Accordion.Item>
          )}
        </Accordion>
      </div>
    </div>
  );
}

IntegrityAnalysis.propTypes = {
  strengths: PropTypes.array,
  gaps: PropTypes.array,
};

export default IntegrityAnalysis;
