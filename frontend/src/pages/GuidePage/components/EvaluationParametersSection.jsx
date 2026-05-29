/**
 * Guide page section — Evaluation Parameters.
 */

import { Accordion } from '@heroui/react';
import { Info, Lightbulb } from 'lucide-react';
import React from 'react';

import { Chip } from '@/components/common';
import { cn } from '@/utils/cn';

import GuideSectionHeading from './GuideSectionHeading';
import GUIDE_PAGE_CONTENT from '../content/guidePageContent';

/**
 * Renders parameter overview cards and expanded scoring guidance for each evaluation factor.
 *
 * @returns {import('react').ReactElement} Evaluation-parameters section with accordion-backed parameter anchors.
 */
export default function EvaluationParametersSection() {
  return (
    <section id="evaluation-parameters" className="scroll-mt-24">
      <GuideSectionHeading>Evaluation Parameters</GuideSectionHeading>
      <p className="mb-2 text-sm text-(--color-text-secondary)">
        Detailed scoring guidelines for each evaluation factor
      </p>
      {GUIDE_PAGE_CONTENT.evaluationParameters.intro && (
        <p className="mb-8 max-w-2xl text-sm/relaxed text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.evaluationParameters.intro}
        </p>
      )}

      {GUIDE_PAGE_CONTENT.evaluationParameters.parameterScoringNote && (
        <div className="mb-8 flex items-start gap-3 rounded-lg border border-(--color-border-faint) bg-(--color-surface-raised) px-4 py-3">
          <Info className="mt-0.5 size-3.5 shrink-0 text-(--color-text-muted)" />
          <p className="text-xs/relaxed text-(--color-text-muted)">
            {GUIDE_PAGE_CONTENT.evaluationParameters.parameterScoringNote}
          </p>
        </div>
      )}

      {/* Parameter Overview */}
      <div id="parameter-overview" className="mt-10 scroll-mt-24">
        <h3 className="mb-4 font-sniglet text-lg text-(--color-text-primary)">
          Parameter Overview
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(GUIDE_PAGE_CONTENT.evaluationParameters.parameters).map(
            ([key, param]) => (
              <div
                key={key}
                className={cn(
                  'card--lift cursor-pointer rounded-xl p-4',
                  'bg-(--color-success-soft-ui)',
                )}
                onClick={() => {
                  const targetElement = document.getElementById(`param-${key}`);
                  if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-(--color-text-primary)">{param.name}</p>
                  <Chip data-variant="status" className="bg-(--color-info-soft-ui)">
                    Weight: <span className="ml-1 text-sm font-medium">{param.weightPercent}</span>
                  </Chip>
                </div>
                <p className="mb-2 text-[0.8rem] text-(--color-text-muted)">{param.category}</p>
                <p className="text-xs text-(--color-text-muted)">{param.definition}</p>
              </div>
            ),
          )}
        </div>
      </div>

      {/* Individual Parameter Details */}
      <Accordion
        allowsMultipleExpanded
        defaultExpandedKeys={Object.keys(GUIDE_PAGE_CONTENT.evaluationParameters.parameters)}
        className="mt-10 overflow-hidden rounded-xl border-[1.5px] border-(--color-border-ui)"
      >
        {Object.entries(GUIDE_PAGE_CONTENT.evaluationParameters.parameters).map(([key, param]) => (
          <Accordion.Item key={key}>
            {/* Sentinel for intersection observer — sits at scroll target position */}
            <div
              id={`param-${key}`}
              className="scroll-mt-24"
              style={{ height: '1px', marginTop: '-1px' }}
            />
            <div>
              <Accordion.Heading>
                <Accordion.Trigger className="flex w-full items-center justify-between py-3 transition-colors hover:bg-(--color-accent-light)">
                  <div className="flex items-center gap-3">
                    {param.icon
                      ? React.createElement(param.icon, {
                          size: 20,
                          className: 'text-(--color-accent)',
                        })
                      : null}
                    <div>
                      <h4 className="text-lg font-medium text-(--color-text-primary)">
                        {param.name}
                      </h4>
                      <p className="text-sm text-(--color-text-muted)">
                        {param.category} - {param.weightPercent}
                      </p>
                    </div>
                  </div>
                  <Accordion.Indicator className="text-(--color-text-muted)" />
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel>
                <Accordion.Body className="mt-4">
                  <div className="space-y-4">
                    {/* Scoring Scale */}
                    <div>
                      <h5 className="mb-3 text-center text-sm font-medium text-(--color-text-primary)">
                        Scoring Scale
                      </h5>
                      <div className="space-y-1.5">
                        {param.scale.map((level) => (
                          <div
                            key={level.score}
                            className="flex items-start gap-3 rounded-md bg-(--color-success-soft-ui) p-2.5"
                          >
                            <span className="w-7 shrink-0 text-right font-mono text-sm font-bold text-(--color-info)">
                              {level.score}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-(--color-text-primary)">
                                {level.label}
                              </p>
                              <p className="text-xs text-(--color-text-muted)">
                                {level.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Methodology & Calibration */}
                    <div>
                      <h5 className="mb-3 text-center text-sm font-semibold text-(--color-text-primary)">
                        Methodology & Calibration
                      </h5>
                      <div className="space-y-2">
                        <p className="text-center text-sm text-(--color-text-secondary)">
                          {param.methodology}
                        </p>
                        <div className="flex items-center justify-start gap-2 rounded-lg bg-(--color-warning-soft-ui) px-3 py-2.5 text-sm text-(--color-text-muted) italic">
                          <Lightbulb className="size-3.5 shrink-0 text-(--color-accent)" />
                          {param.calibration}
                        </div>
                      </div>
                    </div>

                    {/* Example Cases */}
                    <div>
                      <h5 className="mb-3 text-center text-sm font-semibold text-(--color-text-primary)">
                        Example Cases
                      </h5>
                      <div className="space-y-2">
                        {param.examples.map((ex, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 rounded-md border border-(--color-border-faint) bg-(--color-accent-soft-ui) p-2.5"
                          >
                            <span className="w-7 shrink-0 text-right font-mono text-sm font-bold text-(--color-info)">
                              {ex.score}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-(--color-text-primary)">
                                {ex.case}
                              </p>
                              <p className="text-xs text-(--color-text-muted)">{ex.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Accordion.Body>
              </Accordion.Panel>
            </div>
          </Accordion.Item>
        ))}
      </Accordion>
    </section>
  );
}
