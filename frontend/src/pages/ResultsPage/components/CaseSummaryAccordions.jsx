import { Accordion } from '@heroui/react';
import { BarChart2, Globe, Lightbulb, Target } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

import { SectionHeading, Tilt3D } from '@/components/common';
import { parameterLabels, validKeys } from '@/constants/evaluationData';
import { toTitleCase } from '@/lib/formatting';

// Reusable accordion item component
function AccordionItem({ id, icon, iconColor, title, description, children }) {
  return (
    <Tilt3D
      rotateRange={{ x: 2, y: 1 }}
      block
      className="overflow-hidden rounded-xl hover:relative hover:z-10"
    >
      <div className="border-b-[1.5px] border-(--color-border-ui)">
        <Accordion.Item id={id}>
          <Accordion.Heading>
            <Accordion.Trigger className="flex w-full items-center justify-between py-3 transition-colors hover:bg-(--color-accent-light)">
              <div className="flex items-center gap-3">
                {React.createElement(icon, { size: 20, className: `text-${iconColor}` })}
                <div>
                  <h4 className="font-medium text-(--color-text-primary)">{title}</h4>
                  <p className="text-sm text-(--color-text-muted)">{description}</p>
                </div>
              </div>
              <Accordion.Indicator className="text-(--color-text-muted)" />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>{children}</Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      </div>
    </Tilt3D>
  );
}

// Reusable field display component
function ContextField({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-(--color-text-muted)">{label}</span>
      <span className="font-mono text-sm text-(--color-text-muted)">{value}</span>
    </div>
  );
}

export default function CaseSummaryAccordions({
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
      label: parameterLabels[key]?.label || toTitleCase(key),
      value: Number(evaluationParams[key]) || 0,
    }));

  return (
    <div>
      <SectionHeading variant="large" className="mb-2">
        Case Summary
      </SectionHeading>
      <Accordion className="w-full" allowsMultipleExpanded>
        {/* Problem accordion item */}
        <AccordionItem
          id="problem"
          icon={Target}
          iconColor="(--color-success)"
          title="Problem"
          description="What the assessment identifies as the problem"
        >
          <p className="py-2 text-sm/relaxed wrap-break-word text-(--color-text-muted)">
            {businessProblem || 'Not available'}
          </p>
        </AccordionItem>

        {/* Solution accordion item */}
        <AccordionItem
          id="solution"
          icon={Lightbulb}
          iconColor="(--color-warning)"
          title="Solution"
          description="What the assessment proposes as the solution"
        >
          <p className="py-2 text-sm/relaxed wrap-break-word text-(--color-text-muted)">
            {businessSolution || 'Not available'}
          </p>
        </AccordionItem>

        {/* Business Context accordion item */}
        {businessContext && (
          <AccordionItem
            id="business-context"
            icon={Globe}
            iconColor="(--color-text-primary)"
            title="Business Context"
            description="Operational and market context details"
          >
            <div className="space-y-2 py-2">
              {businessContext.target_geography && (
                <ContextField label="Target Geography" value={businessContext.target_geography} />
              )}
              {businessContext.operational_stage && (
                <ContextField label="Operational Stage" value={businessContext.operational_stage} />
              )}
              {businessContext.business_model_type && (
                <ContextField label="Business Model" value={businessContext.business_model_type} />
              )}
              {businessContext.material_complexity && (
                <ContextField
                  label="Material Complexity"
                  value={businessContext.material_complexity}
                />
              )}
              {businessContext.annual_volume_estimate && (
                <ContextField
                  label="Annual Volume"
                  value={businessContext.annual_volume_estimate}
                />
              )}
              {businessContext.has_existing_partnerships !== undefined && (
                <ContextField
                  label="Existing Partnerships"
                  value={businessContext.has_existing_partnerships ? 'Yes' : 'No'}
                />
              )}
            </div>
          </AccordionItem>
        )}

        {/* Parameters accordion item */}
        {parameterEntries.length > 0 && (
          <AccordionItem
            id="parameters"
            icon={BarChart2}
            iconColor="(--color-text-primary)"
            title="Evaluation Parameters"
            description="Key inputs used for the assessment"
          >
            <div className="space-y-2 py-2">
              {parameterEntries.map((entry) => (
                <div key={entry.key} className="flex items-center justify-between">
                  <span className="text-sm text-(--color-text-muted)">{entry.label}</span>
                  <span className="font-mono text-sm text-(--color-text-muted)">{entry.value}</span>
                </div>
              ))}
            </div>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}

ContextField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

AccordionItem.propTypes = {
  id: PropTypes.string.isRequired,
  icon: PropTypes.func.isRequired,
  iconColor: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

CaseSummaryAccordions.propTypes = {
  businessProblem: PropTypes.string,
  businessSolution: PropTypes.string,
  businessContext: PropTypes.object,
  evaluationParameters: PropTypes.object,
};
