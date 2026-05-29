/**
 * Guide page section — Evaluation Criteria.
 */

import { Chip, Separator } from '@/components/common';

import GuideSectionHeading from './GuideSectionHeading';
import GUIDE_PAGE_CONTENT from '../content/guidePageContent';

/**
 * Renders evaluation metrics, value-dimension cards, and the score-calculation flow.
 *
 * @returns {import('react').ReactElement} Evaluation-criteria section with TOC anchor subsections.
 */
export default function EvaluationCriteriaSection() {
  return (
    <section id="evaluation-criteria" className="scroll-mt-24">
      <GuideSectionHeading>Evaluation Criteria</GuideSectionHeading>
      <p className="mb-2 text-sm text-(--color-text-secondary)">
        Three core value dimensions with specific factors
      </p>
      {GUIDE_PAGE_CONTENT.evaluationCriteria.intro && (
        <p className="mb-8 max-w-2xl text-sm/relaxed text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.evaluationCriteria.intro}
        </p>
      )}

      {/* Stats row */}
      <div className="mb-8 flex flex-wrap justify-center gap-6">
        {GUIDE_PAGE_CONTENT.evaluationCriteria.metrics.map((metric, idx) => (
          <div
            key={idx}
            className={`rounded-xl bg-(--color-success-soft-ui) p-3 text-center ${
              metric.color === 'blue' ? 'text-(--color-info)' : 'text-(--color-success)'
            }`}
          >
            <div
              className={`text-2xl font-medium ${
                metric.color === 'blue' ? 'text-(--color-info)' : `text-(--color-success)`
              }`}
            >
              {metric.number}
            </div>
            <div className="mt-1 text-xs font-medium text-(--color-text-muted)">{metric.label}</div>
          </div>
        ))}
      </div>

      {/* Value Sections */}
      {GUIDE_PAGE_CONTENT.evaluationCriteria.valueSections.map((section) => (
        <div key={section.id} className="mt-10 scroll-mt-24" id={section.id}>
          <div className="pl-2">
            <div className="mb-1 flex items-center gap-2">
              <h3 className="font-sniglet text-base text-(--color-text-primary)">
                {section.title}
              </h3>
              {section.icon && (
                <section.icon className={`size-4.5 ${section.iconColor}`} strokeWidth={2} />
              )}
            </div>
            <p className="mb-4 text-sm text-(--color-text-muted)">{section.description}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {section.paramKeys.map((key) => {
              const param = GUIDE_PAGE_CONTENT.evaluationParameters.parameters[key];
              if (!param) return null;
              return (
                <div
                  key={key}
                  className="rounded-xl border border-(--color-border-ui) bg-(--color-surface-raised) p-4"
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-(--color-text-primary)">
                      {param.name}
                    </p>
                    <Chip data-variant="status">{param.weightPercent}</Chip>
                  </div>
                  <p className="text-xs text-(--color-text-muted)">{param.definition}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Score Calculation */}
      <div id="score-calculation" className="mt-10 scroll-mt-24">
        <h3 className="mb-4 font-sniglet text-lg text-(--color-text-primary)">Score Calculation</h3>
        <div
          className="hidden sm:grid"
          style={{
            gridTemplateColumns: `repeat(${GUIDE_PAGE_CONTENT.evaluationCriteria.calculationSteps.length}, 1fr)`,
          }}
        >
          {GUIDE_PAGE_CONTENT.evaluationCriteria.calculationSteps.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center px-2 text-center">
              {/* Connector line — only between steps, not after last */}
              {i < GUIDE_PAGE_CONTENT.evaluationCriteria.calculationSteps.length - 1 && (
                <Separator wrapperCn="absolute top-4 left-1/2" />
              )}
              <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-(--color-accent) text-sm font-medium text-white">
                {step.number}
              </div>
              <p className="mt-3 mb-1 text-sm font-semibold text-(--color-text-primary)">
                {step.title}
              </p>
              <p className="text-xs text-(--color-text-muted)">{step.description}</p>
            </div>
          ))}
        </div>
        {/* Mobile version */}
        <div className="space-y-4 sm:hidden">
          {GUIDE_PAGE_CONTENT.evaluationCriteria.calculationSteps.map((step) => (
            <div key={step.number} className="flex items-start gap-3">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-(--color-accent) text-sm font-bold text-white">
                {step.number}
              </div>
              <div>
                <p className="mb-0.5 text-sm font-semibold text-(--color-text-primary)">
                  {step.title}
                </p>
                <p className="text-xs text-(--color-text-muted)">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
