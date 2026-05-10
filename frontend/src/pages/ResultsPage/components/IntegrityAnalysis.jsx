import { Accordion } from '@heroui/react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import PropTypes from 'prop-types';

import { Chip, SectionHeading } from '@/components/common';

export default function IntegrityAnalysis({ strengths, gaps }) {
  if (!(gaps.length > 0 || strengths.length > 0)) return null;

  return (
    <div className="rounded-3xl border-2 border-(--color-border-ui) bg-transparent">
      <div className="p-2 sm:p-4">
        <SectionHeading variant="small" className="mb-1">
          Integrity Analysis
        </SectionHeading>
        <p className="mb-4 text-sm text-(--color-text-muted)">
          We compare your self-assessed scores against real-world projects in our database to
          identify potential overestimations or underestimations.
        </p>

        <Accordion type="single" collapsible className="space-y-3">
          {/* Strengths */}
          {strengths.length > 0 && (
            <Accordion.Item
              value="strengths"
              className="overflow-hidden rounded-lg border-(--color-success) bg-success-soft"
            >
              <Accordion.Trigger className="px-4 py-3 transition-colors hover:bg-success-soft">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-(--color-success)" />
                  <span className="text-base font-medium text-(--color-text-primary)">
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
                      className="flex gap-2 rounded-lg border border-(--color-success) bg-surface p-3"
                    >
                      <CheckCircle2 className="mt-0.5 shrink-0 text-(--color-success)" size={16} />
                      <div className="flex-1">
                        <p className="text-sm text-(--color-text-primary)">
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
              className="overflow-hidden rounded-lg border-(--color-warning)"
            >
              <Accordion.Trigger className="px-4 py-3 transition-colors">
                <div className="flex items-center gap-2">
                  <AlertCircle size={20} className="text-(--color-warning)" />
                  <span className="text-base font-medium text-(--color-text-primary)">
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
                      <div key={i} className="flex gap-2 rounded-xl bg-warning-soft/70 p-3">
                        <AlertCircle className="mt-0.5 shrink-0 text-(--color-warning)" size={16} />
                        <div className="flex-1">
                          <p className="text-sm text-(--color-text-primary)">
                            {(gap.issue || gap).replace(/_/g, ' ')}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Chip
                              variant="severity"
                              color={severity}
                              size="sm"
                              className="text-xs font-bold"
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
