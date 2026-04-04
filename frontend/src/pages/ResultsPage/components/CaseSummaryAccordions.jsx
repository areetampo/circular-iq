import { Accordion } from '@heroui/react';
import { BarChart2, Globe, Lightbulb, Target } from 'lucide-react';
import PropTypes from 'prop-types';

import { parameterLabels, validKeys } from '@/constants/evaluationData';
import { titleize } from '@/lib/formatting';

export function CaseSummaryAccordions({
  businessProblem,
  businessSolution,
  businessContext,
  evaluationParameters,
}) {
  // Prepare parameter entries for accordion
  const evaluationParams = evaluationParameters || {};
  const parameterEntries = validKeys
    .filter((key) => evaluationParams[key] != null)
    .map((key) => ({
      key,
      label: parameterLabels[key]?.label || titleize(key),
      value: Number(evaluationParams[key]) || 0,
    }));

  return (
    <div className="border-b border-[rgba(180,160,130,0.18)] mb-6 py-4">
      <Accordion className="w-full" allowsMultipleExpanded>
        {/* Problem accordion item */}
        <Accordion.Item id="problem">
          <Accordion.Heading>
            <Accordion.Trigger className="flex items-center justify-between w-full py-3 hover:bg-(--color-accent-light) transition-colors">
              <div className="flex items-center gap-3">
                <Target size={20} style={{ color: 'var(--success)' }} />
                <div>
                  <h4 className="font-semibold text-(--color-text-primary)">Problem</h4>
                  <p className="text-sm text-(--color-text-muted)">
                    What the assessment identifies as the problem
                  </p>
                </div>
              </div>
              <Accordion.Indicator style={{ color: 'var(--muted)' }} />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>
              <p className="text-sm leading-relaxed text-(--color-text-primary) py-2">
                {businessProblem || 'Not available'}
              </p>
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Solution accordion item */}
        <Accordion.Item id="solution">
          <Accordion.Heading>
            <Accordion.Trigger className="flex items-center justify-between w-full py-3 hover:bg-(--color-accent-light) transition-colors">
              <div className="flex items-center gap-3">
                <Lightbulb size={20} style={{ color: 'var(--warning)' }} />
                <div>
                  <h4 className="font-semibold text-(--color-text-primary)">Solution</h4>
                  <p className="text-sm text-(--color-text-muted)">
                    What the assessment proposes as the solution
                  </p>
                </div>
              </div>
              <Accordion.Indicator style={{ color: 'var(--muted)' }} />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>
              <p className="text-sm leading-relaxed text-(--color-text-primary) py-2">
                {businessSolution || 'Not available'}
              </p>
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Business Context accordion item */}
        {businessContext && (
          <Accordion.Item id="business-context">
            <Accordion.Heading>
              <Accordion.Trigger className="flex items-center justify-between w-full py-3 hover:bg-(--color-accent-light) transition-colors">
                <div className="flex items-center gap-3">
                  <Globe size={20} style={{ color: 'var(--foreground)' }} />
                  <div>
                    <h4 className="font-semibold text-(--color-text-primary)">Business Context</h4>
                    <p className="text-sm text-(--color-text-muted)">
                      Operational and market context details
                    </p>
                  </div>
                </div>
                <Accordion.Indicator style={{ color: 'var(--muted)' }} />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body>
                <div className="space-y-2 py-2">
                  {businessContext.target_geography && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-(--color-text-primary)">Target Geography</span>
                      <span className="text-sm font-mono text-(--color-text-muted)">
                        {businessContext.target_geography}
                      </span>
                    </div>
                  )}
                  {businessContext.operational_stage && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-(--color-text-primary)">Operational Stage</span>
                      <span className="text-sm font-mono text-(--color-text-muted)">
                        {businessContext.operational_stage}
                      </span>
                    </div>
                  )}
                  {businessContext.business_model_type && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-(--color-text-primary)">Business Model</span>
                      <span className="text-sm font-mono text-(--color-text-muted)">
                        {businessContext.business_model_type}
                      </span>
                    </div>
                  )}
                  {businessContext.material_complexity && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-(--color-text-primary)">
                        Material Complexity
                      </span>
                      <span className="text-sm font-mono text-(--color-text-muted)">
                        {businessContext.material_complexity}
                      </span>
                    </div>
                  )}
                  {businessContext.annual_volume_estimate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-(--color-text-primary)">Annual Volume</span>
                      <span className="text-sm font-mono text-(--color-text-muted)">
                        {businessContext.annual_volume_estimate}
                      </span>
                    </div>
                  )}
                  {businessContext.has_existing_partnerships !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-(--color-text-primary)">
                        Existing Partnerships
                      </span>
                      <span className="text-sm font-mono text-(--color-text-muted)">
                        {businessContext.has_existing_partnerships ? 'Yes' : 'No'}
                      </span>
                    </div>
                  )}
                </div>
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        )}

        {/* Parameters accordion item */}
        {parameterEntries.length > 0 && (
          <Accordion.Item id="parameters">
            <Accordion.Heading>
              <Accordion.Trigger className="flex items-center justify-between w-full py-3 hover:bg-(--color-accent-light) transition-colors">
                <div className="flex items-center gap-3">
                  <BarChart2 size={20} style={{ color: 'var(--foreground)' }} />
                  <div>
                    <h4 className="font-semibold text-(--color-text-primary)">
                      Evaluation Parameters
                    </h4>
                    <p className="text-sm text-(--color-text-muted)">
                      Key inputs used for the assessment
                    </p>
                  </div>
                </div>
                <Accordion.Indicator style={{ color: 'var(--muted)' }} />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body>
                <div className="space-y-2 py-2">
                  {parameterEntries.map((entry) => (
                    <div key={entry.key} className="flex justify-between items-center">
                      <span className="text-sm text-(--color-text-primary)">{entry.label}</span>
                      <span className="text-sm font-mono text-(--color-text-muted)">
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        )}
      </Accordion>
    </div>
  );
}

CaseSummaryAccordions.propTypes = {
  businessProblem: PropTypes.string,
  businessSolution: PropTypes.string,
  businessContext: PropTypes.object,
  evaluationParameters: PropTypes.object,
};
