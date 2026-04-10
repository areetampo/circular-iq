import {
  BarChart3,
  ChartSpline,
  ChevronDown,
  ChevronUp,
  ClipboardMinus,
  ClipboardPenLine,
  Lightbulb,
  Settings,
  Target,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { cn } from '@/utils/cn';
import { GUIDE_PAGE_CONTENT } from './content';

// Navigation sections
const SECTIONS = [
  { id: 'assessment-methodology', title: 'Assessment Methodology', icon: ChartSpline },
  { id: 'business-problem', title: 'Business Problem Guide', icon: Target },
  { id: 'business-solution', title: 'Business Solution Guide', icon: Lightbulb },
  { id: 'evaluation-criteria', title: 'Evaluation Criteria', icon: ClipboardMinus },
  { id: 'evaluation-parameters', title: 'Evaluation Parameters', icon: BarChart3 },
  { id: 'parameter-details', title: 'Parameter Details', icon: Settings },
  { id: 'sample-test-cases', title: 'Sample Test Cases', icon: ClipboardPenLine },
];

// Navigation component with HeroUI-inspired aesthetic
const Navigation = ({ activeSection, onSectionClick, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const getProgress = (sectionId) => {
    const index = SECTIONS.findIndex((s) => s.id === sectionId);
    return ((index + 1) / SECTIONS.length) * 100;
  };

  const NavContent = ({ isMobile = false }) => (
    <>
      {SECTIONS.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        const progress = getProgress(section.id);

        return (
          <button
            key={section.id}
            onClick={() => {
              onSectionClick(section.id);
              if (isMobile) setIsMobileMenuOpen(false);
            }}
            aria-label={`Navigate to ${section.title}`}
            className={`group relative flex w-full items-center gap-3 py-2 text-left transition-all duration-200 ${
              isActive ? 'font-medium' : ''
            } ${isActive ? 'text-(--color-text-primary)' : `text-(--color-text-muted)`}`}
          >
            {/* Active indicator line */}
            <div
              className={`absolute inset-y-0 left-0 w-0.5 bg-(--color-accent) transition-all duration-200 ${
                isActive ? 'opacity-100' : 'opacity-0'
              }`}
            />

            <span
              className={`pl-4 text-sm transition-all duration-200 ${
                isActive ? 'translate-x-0' : 'group-hover:translate-x-0.5'
              }`}
            >
              {section.title}
            </span>
          </button>
        );
      })}
    </>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-6">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex size-1 items-center justify-center">
              <div className="size-1 rounded-full bg-(--color-text-muted)" />
            </div>
            <span className="text-xs font-semibold tracking-wider text-(--color-text-muted) uppercase">
              On this page
            </span>
          </div>
          <div className="space-y-0.5 border-l border-border">
            <NavContent />
          </div>
        </div>
      </nav>

      {/* Mobile Dropdown Navigation */}
      <div className="sticky top-0 z-40 mb-8 border-b border-border bg-(--color-bg) lg:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={`${isMobileMenuOpen ? 'Close' : 'Open'} section navigation menu`}
          aria-expanded={isMobileMenuOpen}
          className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-(--color-accent-light)"
        >
          <div className="flex items-center gap-3">
            <div className="relative size-6 shrink-0">
              {/* Circular progress indicator */}
              <svg className="size-6 -rotate-90" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  strokeWidth="2"
                  className="stroke-border"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  strokeWidth="2"
                  strokeDasharray={`${2 * Math.PI * 10}`}
                  strokeDashoffset={`${2 * Math.PI * 10 * (1 - getProgress(activeSection) / 100)}`}
                  strokeLinecap="round"
                  className="stroke-(--color-accent) transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {SECTIONS.find((s) => s.id === activeSection) &&
                  React.createElement(SECTIONS.find((s) => s.id === activeSection).icon, {
                    className: 'text-(--color-accent)',
                    size: 12,
                  })}
              </div>
            </div>
            <span className="text-sm font-medium text-(--color-text-primary)">
              {SECTIONS.find((s) => s.id === activeSection)?.title}
            </span>
          </div>
          {isMobileMenuOpen ? (
            <ChevronUp size={20} className="text-(--color-text-muted)" />
          ) : (
            <ChevronDown size={20} className="text-(--color-text-muted)" />
          )}
        </button>

        {/* Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-border bg-(--color-bg) shadow-lg">
            <div className="ml-4 max-h-[60vh] space-y-0.5 overflow-y-auto border-l border-border px-4 py-2">
              <NavContent isMobile={true} />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// Assessment Methodology Section
const AssessmentMethodologySection = () => {
  return (
    <section id="assessment-methodology" className="scroll-mt-20 lg:scroll-mt-6">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="mt-8 mb-4 border-t border-border pt-8 font-display text-xl text-(--color-text-primary)">
          Assessment Methodology
        </h2>
        <p className="mb-10 text-sm text-(--color-text-muted)">
          How our AI evaluates circular economy initiatives
        </p>

        <div className="space-y-6">
          <p className="text-sm/relaxed text-(--color-text-secondary)">
            Our evaluation combines <strong>semantic analysis</strong>,{' '}
            <strong>AI reasoning</strong>, and <strong>multi-dimensional scoring</strong> to provide
            accurate, evidence-based assessments of circular economy initiatives.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {GUIDE_PAGE_CONTENT.assessmentMethodology.items.map((item, idx) => (
              <div
                key={idx}
                className={cn(
                  `mt-4 border-t border-l-4 border-border pt-4 first:mt-0 first:border-0 first:pt-0`,
                  item.bgColor,
                  `border-l-[${item.borderColor}]`,
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 rounded-lg bg-(--color-surface-raised) p-2">
                    <item.icon
                      size={20}
                      className={
                        item.borderColor === 'var(--info)'
                          ? 'text-(--color-info)'
                          : item.borderColor === 'var(--success)'
                            ? 'text-(--color-success)'
                            : item.borderColor === 'var(--warning)'
                              ? 'text-(--color-warning)'
                              : item.borderColor === 'var(--accent)'
                                ? 'text-(--color-accent)'
                                : 'text-(--color-text-primary)'
                      }
                    />
                  </div>
                  <div>
                    <h3 className="mb-1 text-base font-bold text-(--color-text-primary)">
                      {item.title}
                    </h3>
                    <p className="text-sm/relaxed text-(--color-text-secondary)">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-(--color-warning) bg-warning-soft p-4">
            <h4 className="mb-3 text-base font-bold text-(--color-warning)">Important Note</h4>
            <p className="leading-relaxed text-(--color-text-secondary)">
              This assessment is designed to provide{' '}
              <strong>constructive feedback for early-stage ideation</strong>. Scores reflect
              alignment with established circular economy principles and should be used as guidance,
              not as definitive validation of commercial viability.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// Business Problem Section
const BusinessProblemSection = () => {
  return (
    <section id="business-problem" className="scroll-mt-20 lg:scroll-mt-6">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="mt-8 mb-4 border-t border-border pt-8 font-display text-xl text-(--color-text-primary)">
          Business Problem Guide
        </h2>
        <p className="mb-10 text-sm text-(--color-text-muted)">
          Environmental or circular economy challenge
        </p>

        <div className="space-y-6">
          <p className="leading-relaxed text-(--color-text-secondary)">
            Describe <strong>environmental or circular economy challenge</strong> your business
            addresses.
          </p>

          <div className="mt-4 border-t border-l-4 border-(--color-success) bg-success-soft pt-4 first:mt-0 first:border-0 first:pt-0">
            <h4 className="mb-3 text-base font-bold text-(--color-success)">Essential Elements</h4>
            <div className="space-y-2">
              {GUIDE_PAGE_CONTENT.businessProblem.elements.map((item, idx) => (
                <div
                  key={idx}
                  className="mt-3 cursor-default border-t border-l-4 border-(--color-success) bg-(--color-surface-raised) pt-3 select-none first:mt-0 first:border-0 first:pt-0"
                >
                  <div className="mt-0.5 shrink-0 rounded-lg bg-success-soft p-2">
                    <ClipboardMinus className="size-4 text-(--color-success)" strokeWidth={1.75} />
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm/snug font-bold text-(--color-text-primary)">
                      {item.title}
                    </span>
                    <span className="text-xs/relaxed text-(--color-text-muted)">
                      {item.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 border-t border-l-4 border-(--color-info) bg-(--color-info-soft) pt-4 first:mt-0 first:border-0 first:pt-0">
            <h4 className="mb-3 text-base font-bold text-(--color-info)">Writing Tips</h4>
            <ul className="space-y-1">
              {GUIDE_PAGE_CONTENT.businessProblem.writingTips.map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-sm">
                  <span className="font-bold text-(--color-info)">•</span>
                  <span className="text-(--color-text-muted)">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-2 text-base font-bold text-(--color-accent)">Example Statement</h4>
            <p className="rounded-lg border-l-4 border-(--color-accent) bg-(--color-accent-light) p-3 text-sm/relaxed text-(--color-text-muted) italic">
              {GUIDE_PAGE_CONTENT.businessProblem.example}
            </p>
          </div>

          <p className="rounded-lg bg-(--color-surface-raised) p-3 text-xs text-(--color-text-muted) italic">
            ‼ ️ <strong>Minimum 200 characters required</strong>
          </p>
        </div>
      </div>
    </section>
  );
};

// Business Solution Section
const BusinessSolutionSection = () => {
  return (
    <section id="business-solution" className="scroll-mt-20 lg:scroll-mt-6">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="mt-8 mb-4 border-t border-border pt-8 font-display text-xl text-(--color-text-primary)">
          Business Solution Guide
        </h2>
        <p className="mb-10 text-sm text-(--color-text-muted)">How your business solves problem</p>

        <div className="space-y-6">
          <p className="leading-relaxed text-(--color-text-secondary)">
            Describe <strong>how your business solves the problem</strong> with technical details
            about materials, processes, partnerships, and outcomes.
          </p>

          <div className="mt-4 border-t border-l-4 border-(--color-info) bg-(--color-info-soft) pt-4 first:mt-0 first:border-0 first:pt-0">
            <h4 className="mb-3 text-base font-bold text-(--color-info)">Critical Components</h4>
            <ul className="space-y-2">
              {GUIDE_PAGE_CONTENT.businessSolution.components.map(({ title, description }) => (
                <li key={title} className="border-l-2 border-(--color-info) pl-3 text-sm">
                  <strong className="font-semibold text-(--color-info)">{title}</strong>
                  <p className="mt-0.5 text-sm text-(--color-text-muted)">{description}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 border-t border-l-4 border-(--color-warning) bg-warning-soft pt-4 first:mt-0 first:border-0 first:pt-0">
            <h4 className="mb-3 text-base font-bold text-(--color-warning)">Common Pitfalls</h4>
            <ul className="space-y-1">
              {GUIDE_PAGE_CONTENT.businessSolution.pitfalls.map(({ title, description }) => (
                <li key={title} className="flex items-start gap-3 text-sm">
                  <span className="font-semibold text-(--color-warning)">{title}</span>
                  <span className="text-(--color-text-muted)">{description}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-2 text-base font-bold text-(--color-accent)">Example Statement</h4>
            <p className="rounded-lg border-l-4 border-(--color-accent) bg-(--color-accent-light) p-3 text-sm/relaxed text-(--color-text-muted) italic">
              {GUIDE_PAGE_CONTENT.businessSolution.example}
            </p>
          </div>

          <p className="rounded-lg bg-(--color-surface-raised) p-3 text-xs text-(--color-text-muted) italic">
            ‼ ️ <strong>Minimum 200 characters required</strong>
          </p>
        </div>
      </div>
    </section>
  );
};

// Evaluation Criteria Section
const EvaluationCriteriaSection = () => {
  const VALUE_SECTIONS = [
    {
      title: 'Access Value',
      description: 'Social participation and infrastructure accessibility',
      factors: ['public_participation', 'infrastructure'],
      color: 'blue',
    },
    {
      title: 'Embedded Value',
      description: 'Economic worth and technical integration',
      factors: ['market_price', 'maintenance', 'uniqueness'],
      color: 'green',
    },
    {
      title: 'Processing Value',
      description: 'Environmental efficiency and technical readiness',
      factors: ['size_efficiency', 'chemical_safety', 'tech_readiness'],
      color: 'green',
    },
  ];

  return (
    <section id="evaluation-criteria" className="scroll-mt-20 lg:scroll-mt-6">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="mt-8 mb-4 border-t border-border pt-8 font-display text-xl text-(--color-text-primary)">
          Evaluation Criteria
        </h2>
        <p className="mb-10 text-sm text-(--color-text-muted)">
          Three core value dimensions with specific factors
        </p>

        <div className="space-y-6">
          <p className="text-sm/relaxed text-(--color-text-secondary)">
            Our AI-powered evaluation framework assesses business ideas across{' '}
            <strong>three core value dimensions</strong>, each comprising specific factors.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {GUIDE_PAGE_CONTENT.evaluationCriteria.metrics.map((metric, idx) => (
              <div
                key={idx}
                className={`rounded-lg border p-3 text-center ${
                  metric.color === 'blue'
                    ? 'border-(--color-info) bg-(--color-info-soft)'
                    : 'border-(--color-success) bg-success-soft'
                }`}
              >
                <div
                  className={`text-2xl font-bold ${
                    metric.color === 'blue' ? `text-(--color-info)` : `text-(--color-success)`
                  }`}
                >
                  {metric.title}
                </div>
                <p className="mt-1 text-xs text-(--color-text-muted)">{metric.description}</p>
              </div>
            ))}
          </div>

          {VALUE_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-4">
              <h3 className="mb-3 text-lg font-bold text-(--color-text-primary)">
                {section.title}
              </h3>
              <p className="mb-4 text-sm text-(--color-text-muted)">{section.description}</p>
              <div className="grid gap-2 md:grid-cols-2">
                {section.factors.map((factor) => (
                  <div key={factor} className="rounded-lg border border-border bg-surface p-3">
                    <p className="text-xs font-semibold text-(--color-text-primary)">
                      {GUIDE_PAGE_CONTENT.evaluationParameters.factors[factor]?.name || factor}
                    </p>
                    <p className="mt-0.5 text-xs text-(--color-text-muted)">
                      {GUIDE_PAGE_CONTENT.evaluationParameters.factors[factor]?.category || 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-xl border border-(--color-warning) bg-warning-soft p-4">
            <h4 className="mb-3 text-base font-bold text-(--color-warning)">
              How We Calculate Your Score
            </h4>
            <div className="space-y-2">
              {GUIDE_PAGE_CONTENT.evaluationCriteria.calculationSteps.map((step) => (
                <div key={step.number} className="flex items-start gap-3">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-(--color-warning) text-sm font-bold text-white">
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-(--color-warning)">{step.title}</p>
                    <p className="mt-0.5 text-xs text-(--color-text-muted)">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Evaluation Parameters Section
const EvaluationParametersSection = () => {
  return (
    <section id="evaluation-parameters" className="scroll-mt-20 lg:scroll-mt-6">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="mt-8 mb-4 border-t border-border pt-8 font-display text-xl text-(--color-text-primary)">
          Evaluation Parameters Guide
        </h2>
        <p className="mb-10 text-sm text-(--color-text-muted)">
          Factors used to evaluate circularity potential
        </p>

        <div className="space-y-6">
          <p className="leading-relaxed text-(--color-text-secondary)">
            These are the factors we use to evaluate circularity potential. Use the definitions to
            align your self-assessed scores with our scoring model.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(GUIDE_PAGE_CONTENT.evaluationParameters.factors).map(
              ([key, factor]) => (
                <div key={key} className="rounded-xl border border-border bg-surface p-4">
                  <h4 className="mb-1 text-base font-bold text-(--color-text-primary)">
                    {factor.title}
                  </h4>
                  <p className="mb-2 text-xs font-medium text-(--color-text-muted)">
                    Category: {factor.category}
                  </p>
                  <p className="text-sm/relaxed text-(--color-text-secondary)">{factor.desc}</p>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// Parameter Details Section
const ParameterDetailsSection = () => {
  return (
    <section id="parameter-details" className="scroll-mt-20 lg:scroll-mt-6">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="mt-8 mb-4 border-t border-border pt-8 font-display text-xl text-(--color-text-primary)">
          Parameter Details
        </h2>
        <p className="mb-10 text-sm text-(--color-text-muted)">
          Detailed scoring guidelines for each evaluation factor
        </p>

        <div className="space-y-6">
          {Object.entries(GUIDE_PAGE_CONTENT.evaluationParameters.factors).map(
            ([key, guidance]) => (
              <div key={key} className="space-y-6">
                <div className="border-l-4 border-l-(--color-accent) pl-6">
                  <h3 className="mb-4 text-xl font-bold text-(--color-text-primary)">
                    {guidance.name}
                  </h3>
                  <p className="mb-2 text-sm font-medium text-(--color-text-muted)">
                    <strong>Category:</strong> {guidance.category} | <strong>Weight:</strong>{' '}
                    {guidance.weightPercent}
                  </p>
                  <p className="mb-4 text-sm/relaxed text-(--color-text-secondary)">
                    {guidance.definition}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="space-y-4">
                    <h4 className="mb-2 text-base font-bold text-(--color-accent)">
                      Scoring Scale
                    </h4>
                    <div className="space-y-2">
                      {guidance.scale.map((level) => (
                        <div
                          key={level.score}
                          className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-bold text-(--color-text-primary)">
                              {level.score} - {level.label}
                            </p>
                            <p className="mt-0.5 text-xs text-(--color-text-muted)">
                              {level.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="mb-2 text-base font-bold text-(--color-accent)">Methodology</h4>
                    <p className="mb-4 text-sm/relaxed text-(--color-text-secondary)">
                      {guidance.methodology}
                    </p>
                    <p className="text-sm/relaxed text-(--color-text-secondary)">
                      <strong>Calibration:</strong> {guidance.calibration}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="mb-2 text-base font-bold text-(--color-accent)">
                      Example Cases
                    </h4>
                    <div className="space-y-2">
                      {guidance.examples.map((example, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-bold text-(--color-text-primary)">
                              Score: {example.score} - {example.case}
                            </p>
                            <p className="mt-0.5 text-xs text-(--color-text-muted)">
                              {example.reason}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
};

// Sample Test Cases Section
const SampleTestCasesSection = () => {
  const [activeCase, setActiveCase] = useState(null);

  return (
    <section id="sample-test-cases" className="scroll-mt-20 lg:scroll-mt-6">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="mt-8 mb-4 border-t border-border pt-8 font-display text-xl text-(--color-text-primary)">
          Sample Test Cases
        </h2>
        <p className="mb-10 text-sm text-(--color-text-muted)">
          Real circular economy business examples for reference
        </p>

        <div className="space-y-6">
          <p className="leading-relaxed text-(--color-text-secondary)">
            Study these real circular economy initiatives to understand how successful businesses
            structure their problems and solutions. Use them as inspiration for your own circular
            economy business idea.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                id: 'packaging-recovery',
                title: 'Sustainable Packaging Recovery',
                industry: 'Packaging',
                problem: 'Single-use packaging waste overwhelming landfills and oceans',
                solution: 'Collection and composting service for food service packaging waste',
                score: 75,
              },
              {
                id: 'textile-recycling',
                title: 'Textile Recycling Platform',
                industry: 'Fashion',
                problem: 'Fast fashion waste and lack of recycling infrastructure',
                solution: 'Digital platform connecting textile waste with recycling facilities',
                score: 82,
              },
            ].map((testCase) => (
              <div
                key={testCase.id}
                className="cursor-pointer rounded-xl border border-border p-4 transition-colors hover:border-(--color-accent)"
                onClick={() => setActiveCase(activeCase === testCase.id ? null : testCase.id)}
              >
                <h3 className="mb-2 text-base font-bold text-(--color-text-primary)">
                  {testCase.title}
                </h3>
                <p className="mb-2 text-xs font-medium text-(--color-text-muted)">
                  Industry: {testCase.industry} | Score: {testCase.score}/100
                </p>
                <div className="space-y-2">
                  <div>
                    <strong className="text-xs text-(--color-accent)">Problem:</strong>
                    <p className="mt-1 text-xs text-(--color-text-secondary)">{testCase.problem}</p>
                  </div>
                  <div>
                    <strong className="text-xs text-(--color-accent)">Solution:</strong>
                    <p className="mt-1 text-xs text-(--color-text-secondary)">
                      {testCase.solution}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Main GuidePage component
export default function GuidePage() {
  const [activeSection, setActiveSection] = useState('assessment-methodology');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle scroll-based section detection
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id]');
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Account for sticky header
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="min-h-screen bg-(--color-bg)">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border bg-(--color-bg)">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="font-display text-3xl font-bold text-(--color-text-primary)">
              Circular Economy Assessment Guide
            </h1>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-8 py-8">
          {/* Navigation */}
          <Navigation
            activeSection={activeSection}
            onSectionClick={scrollToSection}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />

          {/* Content */}
          <div className="min-w-0 flex-1">
            <AssessmentMethodologySection />
            <BusinessProblemSection />
            <BusinessSolutionSection />
            <EvaluationCriteriaSection />
            <EvaluationParametersSection />
            <ParameterDetailsSection />
            <SampleTestCasesSection />
          </div>
        </div>
      </div>
    </div>
  );
}
