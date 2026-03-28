import {
  BarChart3,
  BookCopy,
  ChartSpline,
  ChevronDown,
  ChevronUp,
  ClipboardMinus,
  ClipboardPenLine,
  Lightbulb,
  Settings,
  Target,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { GUIDE_PAGE_CONTENT } from '@/constants/drawers/GuidePageContent';

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
            className={`group flex items-center gap-3 w-full py-2 text-left transition-all duration-200 relative ${
              isActive ? 'font-medium' : ''
            }`}
            style={{ color: isActive ? 'var(--foreground)' : 'var(--muted)' }}
          >
            {/* Active indicator line */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-0.5 transition-all duration-200`}
              style={{
                backgroundColor: 'var(--accent)',
                opacity: isActive ? '1' : '0',
              }}
            />

            <span
              className={`text-sm pl-4 transition-all duration-200 ${
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
      <nav className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center justify-center w-1 h-1">
              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--muted)' }} />
            </div>
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{
                color: 'var(--muted)',
              }}
            >
              On this page
            </span>
          </div>
          <div className="space-y-0.5 border-l" style={{ borderColor: 'var(--border)' }}>
            <NavContent />
          </div>
        </div>
      </nav>

      {/* Mobile Dropdown Navigation */}
      <div
        className="lg:hidden sticky top-0 z-40 border-b mb-8"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={`${isMobileMenuOpen ? 'Close' : 'Open'} section navigation menu`}
          aria-expanded={isMobileMenuOpen}
          className="flex items-center justify-between w-full px-4 py-3 text-left transition-colors hover:bg-[var(--accent-soft)]"
        >
          <div className="flex items-center gap-3">
            <div className="relative w-6 h-6 shrink-0">
              {/* Circular progress indicator */}
              <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  strokeWidth="2"
                  style={{ stroke: 'var(--border)' }}
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
                  className="transition-all duration-300"
                  style={{ stroke: 'var(--accent)' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {SECTIONS.find((s) => s.id === activeSection) &&
                  React.createElement(SECTIONS.find((s) => s.id === activeSection).icon, {
                    style: { color: 'var(--accent)' },
                    size: 12,
                  })}
              </div>
            </div>
            <span
              className="text-sm font-medium"
              style={{
                color: 'var(--foreground)',
              }}
            >
              {SECTIONS.find((s) => s.id === activeSection)?.title}
            </span>
          </div>
          {isMobileMenuOpen ? (
            <ChevronUp size={20} style={{ color: 'var(--muted)' }} />
          ) : (
            <ChevronDown size={20} style={{ color: 'var(--muted)' }} />
          )}
        </button>

        {/* Dropdown Menu */}
        {isMobileMenuOpen && (
          <div
            className="border-t shadow-lg"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface)',
            }}
          >
            <div
              className="py-2 px-4 space-y-0.5 max-h-[60vh] overflow-y-auto border-l ml-4"
              style={{ borderColor: 'var(--border)' }}
            >
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-soft)' }}>
            <BookCopy className="" style={{ color: 'var(--accent)' }} size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Assessment Methodology</h2>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              How our AI evaluates circular economy initiatives
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <p className="leading-relaxed" style={{ color: 'var(--muted)' }}>
            Our evaluation combines <strong>semantic analysis</strong>,{' '}
            <strong>AI reasoning</strong>, and <strong>multi-dimensional scoring</strong> to provide
            accurate, evidence-based assessments of circular economy initiatives.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {GUIDE_PAGE_CONTENT.assessmentMethodology.items.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border-l-4"
                style={{ backgroundColor: item.bgColor, borderLeftColor: item.borderColor }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="shrink-0 p-2 rounded-lg"
                    style={{ backgroundColor: 'var(--surface-raised)' }}
                  >
                    <item.icon
                      size={20}
                      style={{
                        color:
                          item.borderColor === 'var(--info)'
                            ? 'var(--info)'
                            : item.borderColor === 'var(--success)'
                              ? 'var(--success)'
                              : item.borderColor === 'var(--warning)'
                                ? 'var(--warning)'
                                : item.borderColor === 'var(--accent)'
                                  ? 'var(--accent)'
                                  : 'var(--foreground)',
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-bold mb-1" style={{ color: 'var(--foreground)' }}>
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            className="p-4 rounded-xl border"
            style={{ backgroundColor: 'var(--warning-soft)', borderColor: 'var(--warning)' }}
          >
            <h4 className="mb-3 text-base font-bold" style={{ color: 'var(--warning)' }}>
              Important Note
            </h4>
            <p className="leading-relaxed" style={{ color: 'var(--muted)' }}>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-soft)' }}>
            <Target className="" style={{ color: 'var(--accent)' }} size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Business Problem Guide</h2>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Environmental or circular economy challenge
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <p className="leading-relaxed" style={{ color: 'var(--muted)' }}>
            Describe <strong>environmental or circular economy challenge</strong> your business
            addresses.
          </p>

          <div
            className="p-4 rounded-xl border-l-4"
            style={{
              backgroundColor: 'var(--success-soft)',
              borderColor: 'var(--success)',
              border: '1px solid var(--success)',
            }}
          >
            <h4 className="mb-3 text-base font-bold" style={{ color: 'var(--success)' }}>
              Essential Elements
            </h4>
            <div className="space-y-2">
              {GUIDE_PAGE_CONTENT.businessProblem.elements.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3.5 p-4 rounded-xl border-l-4 cursor-default select-none"
                  style={{
                    backgroundColor: 'var(--surface-raised)',
                    borderColor: 'var(--success)',
                    border: '1px solid var(--success)',
                  }}
                >
                  <div
                    className="shrink-0 p-2 rounded-lg mt-0.5"
                    style={{ backgroundColor: 'var(--success-soft)' }}
                  >
                    <ClipboardMinus
                      className="size-4"
                      style={{ color: 'var(--success)' }}
                      strokeWidth={1.75}
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span
                      className="text-sm font-bold leading-snug"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {item.title}
                    </span>
                    <span className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                      {item.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="p-4 rounded-xl border-l-4"
            style={{
              backgroundColor: 'var(--info-soft)',
              borderColor: 'var(--info)',
              border: '1px solid var(--info)',
            }}
          >
            <h4 className="mb-3 text-base font-bold" style={{ color: 'var(--info)' }}>
              Writing Tips
            </h4>
            <ul className="space-y-1">
              {GUIDE_PAGE_CONTENT.businessProblem.writingTips.map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-sm">
                  <span className="font-bold" style={{ color: 'var(--info)' }}>
                    •
                  </span>
                  <span style={{ color: 'var(--muted)' }}>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-2 text-base font-bold" style={{ color: 'var(--accent)' }}>
              Example Statement
            </h4>
            <p
              className="p-3 text-sm italic leading-relaxed rounded-lg border-l-4"
              style={{
                color: 'var(--muted)',
                backgroundColor: 'var(--accent-soft)',
                borderColor: 'var(--accent)',
                border: '1px solid var(--accent)',
              }}
            >
              {GUIDE_PAGE_CONTENT.businessProblem.example}
            </p>
          </div>

          <p
            className="p-3 text-xs italic rounded-lg"
            style={{
              color: 'var(--muted)',
              backgroundColor: 'var(--surface-raised)',
            }}
          >
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-soft)' }}>
            <Lightbulb className="" style={{ color: 'var(--accent)' }} size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Business Solution Guide</h2>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              How your business solves problem
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <p className="leading-relaxed" style={{ color: 'var(--muted)' }}>
            Describe <strong>how your business solves the problem</strong> with technical details
            about materials, processes, partnerships, and outcomes.
          </p>

          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: 'var(--info-soft)', borderColor: 'var(--info)' }}
          >
            <h4 className="mb-3 text-base font-bold" style={{ color: 'var(--info)' }}>
              Critical Components
            </h4>
            <ul className="space-y-2">
              {GUIDE_PAGE_CONTENT.businessSolution.components.map(({ title, description }) => (
                <li
                  key={title}
                  className="border-l-2 pl-3 text-sm"
                  style={{ borderColor: 'var(--info)' }}
                >
                  <strong className="font-semibold" style={{ color: 'var(--info)' }}>
                    {title}
                  </strong>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
                    {description}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: 'var(--warning-soft)', borderColor: 'var(--warning)' }}
          >
            <h4 className="mb-3 text-base font-bold" style={{ color: 'var(--warning)' }}>
              Common Pitfalls
            </h4>
            <ul className="space-y-1">
              {GUIDE_PAGE_CONTENT.businessSolution.pitfalls.map(({ title, description }) => (
                <li key={title} className="flex items-start gap-3 text-sm">
                  <span className="font-semibold" style={{ color: 'var(--warning)' }}>
                    {title}
                  </span>
                  <span style={{ color: 'var(--muted)' }}>{description}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-2 text-base font-bold" style={{ color: 'var(--accent)' }}>
              Example Statement
            </h4>
            <p
              className="p-3 text-sm italic leading-relaxed rounded-lg border-l-4"
              style={{
                color: 'var(--muted)',
                backgroundColor: 'var(--accent-soft)',
                borderColor: 'var(--accent)',
                border: '1px solid var(--accent)',
              }}
            >
              {GUIDE_PAGE_CONTENT.businessSolution.example}
            </p>
          </div>

          <p
            className="p-3 text-xs italic rounded-lg"
            style={{
              color: 'var(--muted)',
              backgroundColor: 'var(--surface-raised)',
            }}
          >
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-soft)' }}>
            <ClipboardMinus className="" style={{ color: 'var(--accent)' }} size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Evaluation Criteria</h2>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Three core value dimensions with specific factors
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            Our AI-powered evaluation framework assesses business ideas across{' '}
            <strong>three core value dimensions</strong>, each comprising specific factors.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {GUIDE_PAGE_CONTENT.evaluationCriteria.metrics.map((metric, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg text-center border"
                style={{
                  backgroundColor:
                    metric.color === 'blue' ? 'var(--info-soft)' : 'var(--success-soft)',
                  borderColor: metric.color === 'blue' ? 'var(--info)' : 'var(--success)',
                }}
              >
                <div
                  className={`text-2xl font-bold`}
                  style={{
                    color: metric.color === 'blue' ? 'var(--info)' : 'var(--success)',
                  }}
                >
                  {metric.title}
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  {metric.description}
                </p>
              </div>
            ))}
          </div>

          {VALUE_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-4">
              <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--foreground)' }}>
                {section.title}
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
                {section.description}
              </p>
              <div className="grid gap-2 md:grid-cols-2">
                {section.factors.map((factor) => (
                  <div
                    key={factor}
                    className="p-3 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                      {GUIDE_PAGE_CONTENT.evaluationParameters.factors[factor]?.name || factor}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {GUIDE_PAGE_CONTENT.evaluationParameters.factors[factor]?.category || 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div
            className="p-4 rounded-xl border"
            style={{ backgroundColor: 'var(--warning-soft)', borderColor: 'var(--warning)' }}
          >
            <h4
              className="font-bold text-amber-900 mb-3 text-base"
              style={{ color: 'var(--warning)' }}
            >
              How We Calculate Your Score
            </h4>
            <div className="space-y-2">
              {GUIDE_PAGE_CONTENT.evaluationCriteria.calculationSteps.map((step) => (
                <div key={step.number} className="flex items-start gap-3">
                  <div
                    className="flex items-center justify-center shrink-0 w-6 h-6 font-bold text-white rounded-full text-sm"
                    style={{
                      backgroundColor: 'var(--warning)',
                    }}
                  >
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: 'var(--warning)' }}>
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
      </div>
    </section>
  );
};

// Evaluation Parameters Section
const EvaluationParametersSection = () => {
  return (
    <section id="evaluation-parameters" className="scroll-mt-20 lg:scroll-mt-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-soft)' }}>
            <BarChart3 className="" style={{ color: 'var(--accent)' }} size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Evaluation Parameters Guide</h2>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Factors used to evaluate circularity potential
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <p className="leading-relaxed" style={{ color: 'var(--muted)' }}>
            These are the factors we use to evaluate circularity potential. Use the definitions to
            align your self-assessed scores with our scoring model.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(GUIDE_PAGE_CONTENT.evaluationParameters.factors).map(
              ([key, factor]) => (
                <div
                  key={key}
                  className="p-4 rounded-xl border"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <h4 className="text-base font-bold mb-1" style={{ color: 'var(--foreground)' }}>
                    {factor.title}
                  </h4>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>
                    Category: {factor.category}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                    {factor.desc}
                  </p>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-soft)' }}>
            <Settings className="" style={{ color: 'var(--accent)' }} size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Parameter Details</h2>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Detailed scoring guidelines for each evaluation factor
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(GUIDE_PAGE_CONTENT.evaluationParameters.factors).map(
            ([key, guidance]) => (
              <div key={key} className="space-y-6">
                <div className="border-l-4 pl-6" style={{ borderLeftColor: 'var(--accent)' }}>
                  <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
                    {guidance.name}
                  </h3>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--muted)' }}>
                    <strong>Category:</strong> {guidance.category} | <strong>Weight:</strong>{' '}
                    {guidance.weightPercent}
                  </p>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--muted)' }}>
                    {guidance.definition}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="space-y-4">
                    <h4 className="text-base font-bold mb-2" style={{ color: 'var(--accent)' }}>
                      Scoring Scale
                    </h4>
                    <div className="space-y-2">
                      {guidance.scale.map((level) => (
                        <div
                          key={level.score}
                          className="flex items-start gap-3 p-3 rounded-lg border"
                          style={{
                            backgroundColor: 'var(--surface)',
                            borderColor: 'var(--border)',
                          }}
                        >
                          <div className="flex-1">
                            <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                              {level.score} - {level.label}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                              {level.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-base font-bold mb-2" style={{ color: 'var(--accent)' }}>
                      Methodology
                    </h4>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--muted)' }}>
                      {guidance.methodology}
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                      <strong>Calibration:</strong> {guidance.calibration}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-base font-bold mb-2" style={{ color: 'var(--accent)' }}>
                      Example Cases
                    </h4>
                    <div className="space-y-2">
                      {guidance.examples.map((example, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-lg border"
                          style={{
                            backgroundColor: 'var(--surface)',
                            borderColor: 'var(--border)',
                          }}
                        >
                          <div className="flex-1">
                            <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                              Score: {example.score} - {example.case}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-soft)' }}>
            <ClipboardPenLine className="" style={{ color: 'var(--accent)' }} size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Sample Test Cases</h2>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Real circular economy business examples for reference
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <p className="leading-relaxed" style={{ color: 'var(--muted)' }}>
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
                title: 'Textile Circular Economy',
                industry: 'Fashion & Textiles',
                problem: 'Fast fashion waste and limited recycling options for consumers',
                solution: 'Take-back and recycling program for used clothing and textiles',
                score: 68,
              },
              {
                id: 'construction-materials',
                title: 'Construction Materials Loop',
                industry: 'Construction',
                problem: 'Construction waste and lack of material recovery systems',
                solution: 'Marketplace for reclaimed and surplus construction materials',
                score: 72,
              },
              {
                id: 'electronics-recovery',
                title: 'Electronics Recovery System',
                industry: 'Electronics',
                problem: 'E-waste toxicity and low recycling rates for valuable materials',
                solution: 'Specialized recovery and refurbishing service for electronic waste',
                score: 70,
              },
            ].map((testCase) => (
              <div
                key={testCase.id}
                className="p-4 rounded-xl border cursor-pointer transition-colors duration-200"
                style={{
                  borderColor: activeCase === testCase.id ? 'var(--info)' : 'var(--border)',
                  backgroundColor:
                    activeCase === testCase.id ? 'var(--info-soft)' : 'var(--surface)',
                  outlineColor: activeCase === testCase.id ? 'var(--info)' : 'transparent',
                  outlineWidth: activeCase === testCase.id ? '2px' : '0',
                  outlineOffset: activeCase === testCase.id ? '2px' : '0',
                }}
                onClick={() => setActiveCase(activeCase === testCase.id ? null : testCase.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="text-base font-bold mb-1" style={{ color: 'var(--foreground)' }}>
                      {testCase.title}
                    </h4>
                    <p className="text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>
                      Industry: {testCase.industry}
                    </p>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--muted)' }}>
                      <strong>Problem:</strong> {testCase.problem}
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                      <strong>Solution:</strong> {testCase.solution}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white"
                      style={{
                        backgroundColor:
                          activeCase === testCase.id ? 'var(--info)' : 'var(--muted)',
                      }}
                    >
                      {testCase.score}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            className="p-4 rounded-lg border-l-4"
            style={{ backgroundColor: 'var(--info-soft)', borderLeftColor: 'var(--info)' }}
          >
            <h4 className="mb-2 text-base font-bold" style={{ color: 'var(--info)' }}>
              How to Use These Examples
            </h4>
            <ul className="space-y-1 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-bold" style={{ color: 'var(--info)' }}>
                  1.
                </span>
                <span style={{ color: 'var(--muted)' }}>
                  Study the problem-solution structure and scoring level.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold" style={{ color: 'var(--info)' }}>
                  2.
                </span>
                <span style={{ color: 'var(--muted)' }}>
                  Adapt the language and focus areas to your specific business.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold" style={{ color: 'var(--info)' }}>
                  3.
                </span>
                <span style={{ color: 'var(--muted)' }}>
                  Use these as reference points, not templates to copy exactly.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

// Main GuidePage Component
export default function GuidePage() {
  const [activeSection, setActiveSection] = useState('assessment-methodology');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sectionRefs = useRef({});

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-80px 0px -60% 0px',
      threshold: 0.1,
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          if (sectionId && activeSection !== sectionId) {
            setActiveSection(sectionId);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all sections
    SECTIONS.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      SECTIONS.forEach((section) => {
        const element = document.getElementById(section.id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [activeSection]);

  const handleSectionClick = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = window.innerWidth < 1024 ? 80 : 24; // Account for mobile sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <Navigation
        activeSection={activeSection}
        onSectionClick={handleSectionClick}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <main>
        <AssessmentMethodologySection />
        <BusinessProblemSection />
        <BusinessSolutionSection />
        <EvaluationCriteriaSection />
        <EvaluationParametersSection />
        <ParameterDetailsSection />
        <SampleTestCasesSection />
      </main>
    </div>
  );
}
