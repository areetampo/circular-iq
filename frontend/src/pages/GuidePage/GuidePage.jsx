import { Accordion, Chip } from '@heroui/react';
import {
  BookCopy,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  Database,
  FileText,
  Globe,
  Info,
  Lightbulb,
  Target,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { cn } from '@/utils/cn';

import { GUIDE_PAGE_CONTENT } from './content/guidePageContent.js';

// Parameter category border colors
const PARAM_CATEGORY_BORDER = {
  public_participation: 'border-l-2 border-(--color-info)',
  infrastructure: 'border-l-2 border-(--color-info)',
  market_price: 'border-l-2 border-(--color-success)',
  maintenance: 'border-l-2 border-(--color-success)',
  uniqueness: 'border-l-2 border-(--color-success)',
  size_efficiency: 'border-l-2 border-(--color-accent)',
  chemical_safety: 'border-l-2 border-(--color-accent)',
  tech_readiness: 'border-l-2 border-(--color-accent)',
};

// Navigation tree as specified in prompt
const NAV_TREE = [
  {
    id: 'overview',
    label: 'Overview',
    children: [
      { id: 'how-it-works', label: 'How It Works' },
      { id: 'data-sources', label: 'Data Sources' },
      { id: 'assessment-layers', label: 'Assessment Layers' },
    ],
  },
  {
    id: 'getting-started',
    label: 'Getting Started',
    children: [
      { id: 'quickstart-steps', label: 'Quickstart Steps' },
      { id: 'anon-vs-auth', label: 'Anonymous vs Signed In' },
      { id: 'tips-for-best-results', label: 'Tips for Best Results' },
    ],
  },
  {
    id: 'business-problem',
    label: 'Business Problem',
    children: [
      { id: 'problem-elements', label: 'Essential Elements' },
      { id: 'problem-tips', label: 'Writing Tips' },
      { id: 'problem-example', label: 'Example' },
    ],
  },
  {
    id: 'business-solution',
    label: 'Business Solution',
    children: [
      { id: 'solution-components', label: 'Critical Components' },
      { id: 'circularity-loop', label: 'Circularity Loop' },
      { id: 'solution-pitfalls', label: 'Common Pitfalls' },
      { id: 'solution-tips', label: 'Pro Tips' },
      { id: 'solution-example', label: 'Example' },
    ],
  },
  {
    id: 'business-context',
    label: 'Business Context',
    children: [
      { id: 'context-why', label: 'Why It Matters' },
      { id: 'context-fields', label: 'Field Definitions' },
    ],
  },
  {
    id: 'evaluation-criteria',
    label: 'Evaluation Criteria',
    children: [
      { id: 'access-value', label: 'Access Value' },
      { id: 'embedded-value', label: 'Embedded Value' },
      { id: 'processing-value', label: 'Processing Value' },
      { id: 'score-calculation', label: 'Score Calculation' },
    ],
  },
  {
    id: 'evaluation-parameters',
    label: 'Evaluation Parameters',
    children: [
      { id: 'parameter-overview', label: 'Parameter Overview' },
      { id: 'param-public-participation', label: 'Public Participation' },
      { id: 'param-infrastructure', label: 'Infrastructure' },
      { id: 'param-market-price', label: 'Market Price' },
      { id: 'param-maintenance', label: 'Maintenance' },
      { id: 'param-uniqueness', label: 'Uniqueness' },
      { id: 'param-size-efficiency', label: 'Size Efficiency' },
      { id: 'param-chemical-safety', label: 'Chemical Safety' },
      { id: 'param-tech-readiness', label: 'Tech Readiness' },
    ],
  },
  {
    id: 'scoring-benchmarking',
    label: 'Scoring & Benchmarking',
    children: [
      { id: 'circularity-tiers', label: 'Circularity Tiers' },
      { id: 'weighted-scoring', label: 'Weighted Scoring' },
      { id: 'consistency-check', label: 'Consistency Check' },
      { id: 'knowledge-base', label: 'Knowledge Base' },
      { id: 'r-strategy', label: 'R-Strategy Alignment' },
    ],
  },
  {
    id: 'understanding-results',
    label: 'Understanding Results',
    children: [
      { id: 'results-overview', label: 'Results Overview' },
      { id: 'improvement-roadmap', label: 'Improvement Roadmap' },
      { id: 'sdg-alignment', label: 'SDG Alignment' },
      { id: 'database-evidence', label: 'Database Evidence' },
      { id: 'saving-exporting', label: 'Saving & Exporting' },
    ],
  },
  {
    id: 'sample-test-cases',
    label: 'Sample Test Cases',
    children: [{ id: 'test-cases-how-to', label: 'How to Use' }],
  },
];

// NavItem component
const NavItem = ({ item, level, activeId, onNavigate }) => {
  const isActive = activeId === item.id;
  return (
    <button
      onClick={() => onNavigate(item.id)}
      className={cn(
        'relative flex w-full items-center text-left transition-colors duration-150',
        level === 'top' ? 'py-1 pl-4 text-sm font-medium' : 'py-0.5 pl-7 text-[12px] font-normal',
        isActive
          ? 'font-semibold text-(--color-text-primary)'
          : 'text-(--color-text-muted) hover:text-(--color-text-secondary)',
      )}
    >
      {isActive && (
        <span className="absolute inset-y-0 left-0 w-0.5 rounded-r-full bg-(--color-accent)" />
      )}
      {item.label}
    </button>
  );
};

// Helper function to determine if a section should be open (showing its children)
const isSectionOpen = (section, activeId) =>
  activeId === section.id || (section.children?.some((c) => c.id === activeId) ?? false);

// Mobile Navigation component
const MobileNav = ({ activeId, mobileOpen, setMobileOpen }) => {
  const getCurrentSectionLabel = () => {
    const allItems = NAV_TREE.flatMap((section) => [section, ...(section.children || [])]);
    const current = allItems.find((item) => item.id === activeId);
    return current?.label || 'Overview';
  };

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const headerOffset = 80; // matches sticky header + some breathing room
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior: 'smooth' });
    setMobileOpen(false); // Close mobile menu after navigation
  };

  return (
    <div className="sticky top-14 z-20 border-b border-(--color-border-ui) bg-(--color-bg) lg:hidden">
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-(--color-text-primary)"
      >
        <span>{getCurrentSectionLabel()}</span>
        {mobileOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {mobileOpen && (
        <div className="border-t border-(--color-border-ui) bg-(--color-bg) px-4 py-2">
          {NAV_TREE.map((section) => (
            <React.Fragment key={section.id}>
              <NavItem item={section} level="top" activeId={activeId} onNavigate={scrollToId} />
              {isSectionOpen(section, activeId) &&
                section.children?.map((child) => (
                  <div key={child.id} className="ml-3 border-l border-(--color-border-faint) pl-3">
                    <NavItem item={child} level="sub" activeId={activeId} onNavigate={scrollToId} />
                  </div>
                ))}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

// Desktop Navigation component
const DesktopNav = ({ activeId, onNavigate }) => {
  return (
    <nav className="hidden w-52 shrink-0 lg:block">
      <div className="sticky top-20">
        <p className="label-overline mb-3">On this page</p>
        {/*
          Scroll container: fixed max-height, hidden scrollbar, CSS fade shadows.
          The mask-image creates the top/bottom fade effect that HeroUI ScrollShadow provides.
          It fades from transparent at top/bottom edges to fully visible in the middle.
        */}
        <div
          className="overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            maxHeight: 'calc(100vh - 9rem)',
            maskImage:
              'linear-gradient(to bottom, transparent 0%, black 40px, black calc(100% - 40px), transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent 0%, black 40px, black calc(100% - 40px), transparent 100%)',
          }}
        >
          {/* Extra padding top/bottom so content isn't hidden under the fade */}
          <div className="border-l border-(--color-border-ui) pt-2 pb-10">
            {NAV_TREE.map((section) => (
              <React.Fragment key={section.id}>
                <NavItem item={section} level="top" activeId={activeId} onNavigate={onNavigate} />
                {section.children?.map((child) => (
                  <NavItem
                    key={child.id}
                    item={child}
                    level="sub"
                    activeId={activeId}
                    onNavigate={onNavigate}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Overview Section
const OverviewSection = () => {
  return (
    <section
      id="overview"
      className="scroll-mt-24 border-t border-(--color-border-faint) py-14 first:border-t-0"
    >
      <h2 className="mb-1 font-display text-2xl font-bold text-(--color-text-primary)">Overview</h2>
      <p className="mb-2 text-sm text-(--color-text-muted)">
        Learn how our AI-powered circular economy assessment works
      </p>
      {GUIDE_PAGE_CONTENT.overview.intro && (
        <p className="mb-8 max-w-2xl text-sm/relaxed text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.overview.intro}
        </p>
      )}

      {/* How It Works */}
      <div id="how-it-works" className="scroll-mt-24">
        <h3 className="mb-4 font-display text-lg font-semibold text-(--color-text-primary)">
          How It Works
        </h3>
        <p className="mb-6 text-sm text-(--color-text-secondary)">
          Our evaluation combines semantic vector search, evidence-based AI reasoning, and
          multi-dimensional scoring to produce actionable assessments grounded in 40,000+ real-world
          circular economy case studies.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {GUIDE_PAGE_CONTENT.overview.methodologyItems.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border-l-2 border-(--color-accent) bg-(--color-surface-raised) p-4"
            >
              <div className="w-fit rounded-lg bg-(--color-bg) p-2">
                <item.icon className="size-5 text-(--color-accent)" />
              </div>
              <h4 className="mt-2 mb-1 text-sm font-semibold text-(--color-text-primary)">
                {item.title}
              </h4>
              <p className="text-xs/relaxed text-(--color-text-muted)">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Data Sources */}
      <div id="data-sources" className="mt-10 scroll-mt-24">
        <h3 className="mb-4 font-display text-lg font-semibold text-(--color-text-primary)">
          Data Sources
        </h3>
        <p className="mb-6 text-sm text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.overview.dataSources.subtitle}
        </p>

        {/* Data Categories */}
        <div className="space-y-6">
          {GUIDE_PAGE_CONTENT.overview.dataSources.categories.map((category, catIdx) => {
            const CATEGORY_COLORS = [
              { bg: 'bg-(--color-info-soft)', text: 'text-(--color-info)' },
              { bg: 'bg-(--color-success-soft-ui)', text: 'text-(--color-success)' },
              { bg: 'bg-(--color-warning-soft-ui)', text: 'text-(--color-warning)' },
              { bg: 'bg-(--color-accent-soft-ui)', text: 'text-(--color-accent)' },
            ];
            const colors = CATEGORY_COLORS[catIdx % CATEGORY_COLORS.length];

            const getIcon = (iconName) => {
              switch (iconName) {
                case 'Globe':
                  return Globe;
                case 'FileText':
                  return FileText;
                case 'Database':
                  return Database;
                case 'Target':
                  return Target;
                default:
                  return BookCopy;
              }
            };
            const IconComponent = getIcon(category.icon);

            return (
              <div
                key={catIdx}
                className="rounded-xl border border-(--color-border-ui) bg-(--color-surface-raised) p-4"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={cn(
                      'flex shrink-0 items-center justify-center rounded-lg p-2',
                      colors.bg,
                    )}
                  >
                    <IconComponent className={colors.text} size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-(--color-text-primary)">
                      {category.name}
                    </h4>
                    <p className="text-xs text-(--color-text-muted)">{category.description}</p>
                  </div>
                </div>

                {/* Datasets Grid */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {category.datasets.map((dataset, dsIdx) => (
                    <div
                      key={dsIdx}
                      className="flex flex-col gap-2 rounded-xl border border-(--color-border-faint) bg-(--color-bg-card) p-3"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-(--color-text-primary)">
                          {dataset.name}
                        </span>
                        <span className="w-fit rounded-md border border-(--color-border-faint) bg-(--color-surface-raised) px-1.5 py-0.5 font-mono text-xs text-(--color-accent)">
                          {dataset.count}
                        </span>
                      </div>
                      <p className="text-xs/relaxed text-(--color-text-muted)">
                        {dataset.description}
                      </p>
                      <p className="font-mono text-[0.65rem] text-(--color-text-muted)">
                        Source: {dataset.source}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assessment Layers */}
      <div id="assessment-layers" className="mt-10 scroll-mt-24">
        <h3 className="mb-4 font-display text-lg font-semibold text-(--color-text-primary)">
          Assessment Layers
        </h3>
        <div className="space-y-1">
          {GUIDE_PAGE_CONTENT.overview.layers.map((layer) => (
            <div
              key={layer.number}
              className="flex items-start gap-3 border-b border-(--color-border-faint) py-3 last:border-b-0"
            >
              <div
                className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
                  layer.color === 'accent'
                    ? 'bg-(--color-accent) text-white'
                    : layer.color === 'success'
                      ? 'bg-(--color-success) text-white'
                      : 'bg-(--color-info) text-white'
                }`}
              >
                {layer.number}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-(--color-text-primary)">{layer.name}</h4>
                {layer.description && (
                  <p className="mb-1.5 text-xs text-(--color-text-muted)">{layer.description}</p>
                )}
                <div className="mt-1 flex flex-wrap gap-1">
                  {layer.outputs.map((output) => (
                    <Chip key={output} data-variant="tag" size="sm">
                      {output}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-lg border border-(--color-warning-border) bg-(--color-warning-soft-ui) px-4 py-3 text-sm text-(--color-text-secondary)">
          <strong className="text-(--color-warning)">Note:</strong> This assessment is designed for
          constructive feedback during early-stage ideation. Scores reflect alignment with circular
          economy principles — use as guidance, not commercial validation.
        </div>
      </div>
    </section>
  );
};

// Getting Started Section
const GettingStartedSection = () => (
  <section
    id="getting-started"
    className="scroll-mt-24 border-t border-(--color-border-faint) py-14"
  >
    <h2 className="mb-1 font-display text-2xl font-bold text-(--color-text-primary)">
      Getting Started
    </h2>
    <p className="mb-2 text-sm text-(--color-text-muted)">
      {GUIDE_PAGE_CONTENT.gettingStarted.subtitle}
    </p>
    <p className="mb-10 max-w-2xl text-sm/relaxed text-(--color-text-secondary)">
      {GUIDE_PAGE_CONTENT.gettingStarted.intro}
    </p>

    {/* Quickstart Steps */}
    <div id="quickstart-steps" className="scroll-mt-24">
      <h3 className="mb-5 font-display text-lg font-semibold text-(--color-text-primary)">
        Quickstart Steps
      </h3>
      <ol className="space-y-4">
        {GUIDE_PAGE_CONTENT.gettingStarted.quickstartSteps.map((step) => (
          <li key={step.number} className="flex items-start gap-4">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-(--color-accent) font-mono text-sm font-bold text-white">
              {step.number}
            </div>
            <div className="flex-1 rounded-xl border border-(--color-border-ui) bg-(--color-surface-raised) px-4 py-3">
              <p className="mb-0.5 text-sm font-semibold text-(--color-text-primary)">
                {step.title}
              </p>
              <p className="text-xs/relaxed text-(--color-text-muted)">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>

      {GUIDE_PAGE_CONTENT.gettingStarted.autoFillNote && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-(--color-border-faint) bg-(--color-surface-raised) px-4 py-3">
          <Info className="mt-0.5 size-3.5 shrink-0 text-(--color-text-muted)" />
          <p className="text-xs/relaxed text-(--color-text-muted)">
            <strong>Auto-fill:</strong> {GUIDE_PAGE_CONTENT.gettingStarted.autoFillNote}
          </p>
        </div>
      )}
    </div>

    {/* Anonymous vs Signed In */}
    <div id="anon-vs-auth" className="mt-10 scroll-mt-24">
      <h3 className="mb-5 font-display text-lg font-semibold text-(--color-text-primary)">
        Anonymous vs. Signed In
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          GUIDE_PAGE_CONTENT.gettingStarted.anonymousVsAuth.anonymous,
          GUIDE_PAGE_CONTENT.gettingStarted.anonymousVsAuth.authenticated,
        ].map((mode, i) => (
          <div
            key={mode.title}
            className={cn(
              'rounded-xl border p-4',
              i === 0
                ? 'border-(--color-border-ui) bg-(--color-surface-raised)'
                : 'border-(--color-success-border) bg-(--color-success-soft-ui)',
            )}
          >
            <p
              className={cn(
                'mb-3 text-sm font-semibold',
                i === 0 ? 'text-(--color-text-primary)' : 'text-(--color-success)',
              )}
            >
              {mode.title}
            </p>
            <ul className="space-y-1.5">
              {mode.points.map((point, j) => (
                <li key={j} className="flex items-start gap-2 text-xs text-(--color-text-muted)">
                  <span
                    className={cn(
                      'mt-0.5 size-1.5 shrink-0 rounded-full',
                      i === 0 ? 'bg-(--color-text-muted)' : 'bg-(--color-success)',
                    )}
                  />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>

    {/* Tips for Best Results */}
    <div id="tips-for-best-results" className="mt-10 scroll-mt-24">
      <h3 className="mb-5 font-display text-lg font-semibold text-(--color-text-primary)">
        Tips for Best Results
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {GUIDE_PAGE_CONTENT.gettingStarted.bestPracticeTips.map((tip) => (
          <div
            key={tip.title}
            className="rounded-xl border border-(--color-border-ui) bg-(--color-surface-raised) p-4"
          >
            <p className="mb-1 text-sm font-semibold text-(--color-text-primary)">{tip.title}</p>
            <p className="text-xs/relaxed text-(--color-text-muted)">{tip.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Business Problem Section
const BusinessProblemSection = () => {
  return (
    <section
      id="business-problem"
      className="scroll-mt-24 border-t border-(--color-border-faint) py-14"
    >
      <h2 className="mb-1 font-display text-2xl font-bold text-(--color-text-primary)">
        Business Problem
      </h2>
      {GUIDE_PAGE_CONTENT.businessProblem.intro && (
        <p className="mb-8 max-w-2xl text-sm/relaxed text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.businessProblem.intro}
        </p>
      )}

      {GUIDE_PAGE_CONTENT.businessProblem.scoringImpact && (
        <div className="mb-8 flex items-start gap-3 rounded-lg border border-(--color-border-faint) bg-(--color-surface-raised) px-4 py-3">
          <Info className="mt-0.5 size-3.5 shrink-0 text-(--color-text-muted)" />
          <p className="text-xs/relaxed text-(--color-text-muted)">
            {GUIDE_PAGE_CONTENT.businessProblem.scoringImpact}
          </p>
        </div>
      )}

      {/* Essential Elements */}
      <div id="problem-elements" className="mt-10 scroll-mt-24">
        <h3 className="mb-4 font-display text-lg font-semibold text-(--color-text-primary)">
          Essential Elements
        </h3>
        <div className="space-y-1">
          {GUIDE_PAGE_CONTENT.businessProblem.elements.map((element, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 border-b border-(--color-border-faint) py-3 last:border-b-0"
            >
              <div className="mt-0.5 shrink-0 rounded-md bg-(--color-success-soft-ui) p-1.5">
                <CheckSquare className="size-3.5 text-(--color-success)" />
              </div>
              <div>
                <p className="text-sm font-semibold text-(--color-text-primary)">{element.title}</p>
                <p className="mt-0.5 text-xs text-(--color-text-muted)">{element.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Writing Tips */}
      <div id="problem-tips" className="mt-10 scroll-mt-24">
        <h3 className="mb-4 font-display text-lg font-semibold text-(--color-text-primary)">
          Writing Tips
        </h3>
        <div className="rounded-lg border border-(--color-info)/20 bg-(--color-info-soft) p-4">
          <p className="mb-3 text-xs font-bold tracking-wider text-(--color-info) uppercase">
            Writing Tips
          </p>
          <ol className="space-y-2">
            {GUIDE_PAGE_CONTENT.businessProblem.writingTips.map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-sm text-(--color-text-secondary)"
              >
                <span className="w-5 shrink-0 text-right font-mono text-xs font-bold text-(--color-info)">
                  {i + 1}.
                </span>
                {tip}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Example */}
      <div id="problem-example" className="mt-10 scroll-mt-24">
        <h3 className="mb-4 font-display text-lg font-semibold text-(--color-text-primary)">
          Example Statement
        </h3>
        <blockquote className="rounded-lg border-l-4 border-(--color-accent) bg-(--color-accent-soft-ui) px-4 py-3 text-sm/relaxed text-(--color-text-secondary) italic">
          {GUIDE_PAGE_CONTENT.businessProblem.example}
        </blockquote>
      </div>

      {/* Minimum character note */}
      <div className="flex items-center gap-2 rounded-lg border border-(--color-border-faint) bg-(--color-surface-raised) px-4 py-2.5">
        <Info className="size-3.5 shrink-0 text-(--color-text-muted)" />
        <p className="text-xs text-(--color-text-muted)">
          <strong>Minimum 200 characters required</strong> for AI analysis.
        </p>
      </div>
    </section>
  );
};

// Business Solution Section
const BusinessSolutionSection = () => {
  return (
    <section
      id="business-solution"
      className="scroll-mt-24 border-t border-(--color-border-faint) py-14"
    >
      <h2 className="mb-1 font-display text-2xl font-bold text-(--color-text-primary)">
        Business Solution
      </h2>
      {GUIDE_PAGE_CONTENT.businessSolution.intro && (
        <p className="mb-8 max-w-2xl text-sm/relaxed text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.businessSolution.intro}
        </p>
      )}

      {GUIDE_PAGE_CONTENT.businessSolution.scoringImpact && (
        <div className="mb-8 flex items-start gap-3 rounded-lg border border-(--color-border-faint) bg-(--color-surface-raised) px-4 py-3">
          <Info className="mt-0.5 size-3.5 shrink-0 text-(--color-text-muted)" />
          <p className="text-xs/relaxed text-(--color-text-muted)">
            {GUIDE_PAGE_CONTENT.businessSolution.scoringImpact}
          </p>
        </div>
      )}

      {/* Critical Components */}
      <div id="solution-components" className="mt-10 scroll-mt-24">
        <h3 className="mb-4 font-display text-lg font-semibold text-(--color-text-primary)">
          Critical Components
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {GUIDE_PAGE_CONTENT.businessSolution.components.map(({ title, description }) => (
            <div
              key={title}
              className="rounded-lg border border-(--color-border-ui) bg-(--color-surface-raised) p-3"
            >
              <p className="mb-1 text-sm font-semibold text-(--color-text-primary)">{title}</p>
              <p className="text-xs text-(--color-text-muted)">{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* The Circularity Loop */}
      <div id="circularity-loop" className="mt-10 scroll-mt-24">
        <h3 className="mb-4 font-display text-lg font-semibold text-(--color-text-primary)">
          The Circularity Loop
        </h3>
        <p className="mb-5 text-sm/relaxed text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.businessSolution.circularityLoopExplainer.intro}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-(--color-success-border) bg-(--color-success-soft-ui) p-4">
            <p className="mb-3 text-xs font-bold tracking-wider text-(--color-success) uppercase">
              Strong Loop Signals
            </p>
            <ul className="space-y-2">
              {GUIDE_PAGE_CONTENT.businessSolution.circularityLoopExplainer.strongLoop.map(
                (item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-(--color-text-secondary)"
                  >
                    <Check className="mt-0.5 size-3.5 shrink-0 text-(--color-success)" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>
          <div className="rounded-xl border border-(--color-warning-border) bg-(--color-warning-soft-ui) p-4">
            <p className="mb-3 text-xs font-bold tracking-wider text-(--color-warning) uppercase">
              Weak Loop Signals
            </p>
            <ul className="space-y-2">
              {GUIDE_PAGE_CONTENT.businessSolution.circularityLoopExplainer.weakLoop.map(
                (item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-(--color-text-secondary)"
                  >
                    <X className="mt-0.5 size-3.5 shrink-0 text-(--color-warning)" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Common Pitfalls */}
      <div id="solution-pitfalls" className="mt-10 scroll-mt-24">
        <h3 className="mb-4 font-display text-lg font-semibold text-(--color-text-primary)">
          Common Pitfalls
        </h3>
        <div className="space-y-2 rounded-lg border border-(--color-warning-border) bg-(--color-warning-soft-ui) p-4">
          <p className="mb-3 text-xs font-bold tracking-wider text-(--color-warning) uppercase">
            Common Pitfalls
          </p>
          {GUIDE_PAGE_CONTENT.businessSolution.pitfalls.map((pitfall, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <X className="mt-0.5 size-3.5 shrink-0 text-(--color-warning)" />
              <div>
                <span className="font-semibold text-(--color-text-primary)">
                  {typeof pitfall === 'string' ? pitfall : pitfall.title || pitfall}:{' '}
                </span>
                <span className="text-(--color-text-muted)">
                  {typeof pitfall === 'string' ? '' : pitfall.description || ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pro Tips */}
      <div id="solution-tips" className="mt-10 scroll-mt-24">
        <h3 className="mb-4 font-display text-lg font-semibold text-(--color-text-primary)">
          Pro Tips
        </h3>
        <div className="space-y-2 rounded-lg border border-(--color-success-border) bg-(--color-success-soft-ui) p-4">
          <p className="mb-3 text-xs font-bold tracking-wider text-(--color-success) uppercase">
            Pro Tips
          </p>
          {GUIDE_PAGE_CONTENT.businessSolution.proTips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-(--color-text-secondary)">
              <Check className="mt-0.5 size-3.5 shrink-0 text-(--color-success)" />
              {tip}
            </div>
          ))}
        </div>
      </div>

      {/* Example */}
      <div id="solution-example" className="mt-10 scroll-mt-24">
        <h3 className="mb-4 font-display text-lg font-semibold text-(--color-text-primary)">
          Example Statement
        </h3>
        <blockquote className="rounded-lg border-l-4 border-(--color-accent) bg-(--color-accent-soft-ui) px-4 py-3 text-sm/relaxed text-(--color-text-secondary) italic">
          {GUIDE_PAGE_CONTENT.businessSolution.example}
        </blockquote>
      </div>

      {/* Minimum character note */}
      <div className="flex items-center gap-2 rounded-lg border border-(--color-border-faint) bg-(--color-surface-raised) px-4 py-2.5">
        <Info className="size-3.5 shrink-0 text-(--color-text-muted)" />
        <p className="text-xs text-(--color-text-muted)">
          <strong>Minimum 200 characters required</strong> for AI analysis.
        </p>
      </div>
    </section>
  );
};

// Business Context Section
const BusinessContextSection = () => {
  return (
    <section
      id="business-context"
      className="scroll-mt-24 border-t border-(--color-border-faint) py-14"
    >
      <h2 className="mb-1 font-display text-2xl font-bold text-(--color-text-primary)">
        Business Context
      </h2>
      {GUIDE_PAGE_CONTENT.businessContext.intro ? (
        <p className="mb-8 max-w-2xl text-sm/relaxed text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.businessContext.intro}
        </p>
      ) : (
        <p className="mb-8 text-sm text-(--color-text-muted)">
          These optional fields improve AI calibration by providing structured context about your
          business, enabling stage-appropriate benchmarking and more precise recommendations.
        </p>
      )}

      {/* Why It Matters */}
      <div id="context-why" className="scroll-mt-24">
        <h3 className="mb-4 font-display text-lg font-semibold text-(--color-text-primary)">
          Why It Matters
        </h3>
        <p className="mb-4 text-sm/relaxed text-(--color-text-secondary)">
          Business context fields feed directly into the AI&apos;s benchmarking calibration. Without
          them, the model compares your submission against all 40,000+ cases indiscriminately. With
          them, it narrows the comparison to cases that match your stage, model type, and geography
          — producing more relevant scores and recommendations.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              label: 'Stage-Appropriate Benchmarks',
              desc: 'An idea-stage submission is not compared against mature operations — the scoring expectations adjust to your operational stage.',
            },
            {
              label: 'Model-Specific Comparisons',
              desc: 'A Product-as-a-Service business is compared with other PaaS cases, not against recycling operations with very different economics.',
            },
            {
              label: 'Geographic Context',
              desc: 'Infrastructure availability, regulatory environment, and market maturity vary significantly by region — context fields capture this.',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-(--color-border-ui) bg-(--color-surface-raised) p-4"
            >
              <p className="mb-1 text-sm font-semibold text-(--color-text-primary)">{item.label}</p>
              <p className="text-xs/relaxed text-(--color-text-muted)">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Field Definitions */}
      <div id="context-fields" className="mt-10 scroll-mt-24">
        <h3 className="mb-4 font-display text-lg font-semibold text-(--color-text-primary)">
          Field Definitions
        </h3>
        <div className="space-y-1">
          {GUIDE_PAGE_CONTENT.businessContext.fields.map((field, idx) => (
            <div key={idx} className="border-b border-(--color-border-faint) py-4 last:border-b-0">
              <p className="mb-0.5 text-sm font-semibold text-(--color-text-primary)">
                {field.title}
              </p>
              <p className="mb-1.5 text-sm text-(--color-text-secondary)">{field.description}</p>
              <div className="flex items-start gap-1.5">
                <Lightbulb className="mt-0.5 size-3 shrink-0 text-(--color-accent)" />
                <p className="text-xs text-(--color-text-muted) italic">{field.hint}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Evaluation Criteria Section
const EvaluationCriteriaSection = () => {
  return (
    <section
      id="evaluation-criteria"
      className="scroll-mt-24 border-t border-(--color-border-faint) py-14"
    >
      <h2 className="mb-1 font-display text-2xl font-bold text-(--color-text-primary)">
        Evaluation Criteria
      </h2>
      <p className="mb-2 text-sm text-(--color-text-secondary)">
        Three core value dimensions with specific factors
      </p>
      {GUIDE_PAGE_CONTENT.evaluationCriteria.intro && (
        <p className="mb-8 max-w-2xl text-sm/relaxed text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.evaluationCriteria.intro}
        </p>
      )}

      {/* Stats row */}
      <div className="mb-8 flex flex-wrap gap-2">
        {GUIDE_PAGE_CONTENT.evaluationCriteria.metrics.map((metric, idx) => (
          <Chip key={idx} data-variant="info" data-color="success">
            <span className="font-mono font-bold">{metric.number}</span> {metric.label}
          </Chip>
        ))}
      </div>

      {/* Value Sections */}
      {GUIDE_PAGE_CONTENT.evaluationCriteria.valueSections.map((section) => (
        <div key={section.id} className="mt-10 scroll-mt-24" id={section.id}>
          <div className="mb-1 flex items-center gap-2">
            <h3 className="font-display text-base font-semibold text-(--color-text-primary)">
              {section.title}
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                section.color === 'info'
                  ? 'bg-(--color-info-soft) text-(--color-info)'
                  : section.color === 'success'
                    ? 'bg-(--color-success-soft-ui) text-(--color-success)'
                    : 'bg-(--color-accent-soft-ui) text-(--color-accent)'
              }`}
            >
              {section.paramKeys.length} factors
            </span>
          </div>
          <p className="mb-4 text-sm text-(--color-text-muted)">{section.description}</p>
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
        <h3 className="mb-4 font-display text-lg font-semibold text-(--color-text-primary)">
          Score Calculation
        </h3>
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
                <div className="absolute top-4 left-1/2 h-px w-full bg-(--color-border-faint)" />
              )}
              <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-(--color-accent) text-sm font-bold text-white">
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
};

// Evaluation Parameters Section
const EvaluationParametersSection = () => {
  return (
    <section
      id="evaluation-parameters"
      className="scroll-mt-24 border-t border-(--color-border-faint) py-14"
    >
      <h2 className="mb-1 font-display text-2xl font-bold text-(--color-text-primary)">
        Evaluation Parameters
      </h2>
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
        <h3 className="mb-4 font-display text-lg font-semibold text-(--color-text-primary)">
          Parameter Overview
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(GUIDE_PAGE_CONTENT.evaluationParameters.parameters).map(
            ([key, param]) => (
              <div
                key={key}
                className={cn(
                  'card-lift cursor-pointer rounded-xl border border-(--color-border-ui) bg-(--color-surface-raised) p-4 transition-colors hover:border-(--color-accent)',
                  PARAM_CATEGORY_BORDER[key],
                )}
                onClick={() =>
                  document.getElementById(`param-${key}`)?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-(--color-text-primary)">{param.name}</p>
                  <Chip data-variant="status">{param.weightPercent}</Chip>
                </div>
                <p className="mb-2 text-[11px] text-(--color-text-muted)">{param.category}</p>
                <p className="text-xs text-(--color-text-muted)">{param.definition}</p>
              </div>
            ),
          )}
        </div>
      </div>

      {/* Individual Parameter Details */}
      {Object.entries(GUIDE_PAGE_CONTENT.evaluationParameters.parameters).map(([key, param]) => (
        <div key={key} className="mt-10 scroll-mt-24" id={`param-${key}`}>
          <div className="overflow-hidden rounded-xl border border-(--color-border-ui)">
            <Accordion allowsMultipleExpanded>
              <Accordion.Item key={key}>
                <Accordion.Heading>
                  <Accordion.Trigger>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-semibold text-(--color-text-primary)">
                          {param.name}
                        </h4>
                        <p className="mt-0.5 text-xs text-(--color-text-muted)">{param.category}</p>
                      </div>
                      <Chip data-variant="status">{param.weightPercent}</Chip>
                    </div>
                    <p className="mt-2 text-xs text-(--color-text-muted)">{param.definition}</p>
                    <Accordion.Indicator />
                  </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                  <Accordion.Body>
                    <div className="space-y-4">
                      {/* Scoring Scale */}
                      <div>
                        <h5 className="mb-3 text-sm font-semibold text-(--color-text-primary)">
                          Scoring Scale
                        </h5>
                        <div className="space-y-1.5">
                          {param.scale.map((level) => (
                            <div
                              key={level.score}
                              className="flex items-start gap-3 rounded-md border border-(--color-border-faint) bg-(--color-bg-card) p-2.5"
                            >
                              <span className="w-7 shrink-0 text-right font-mono text-sm font-bold text-(--color-accent)">
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
                        <h5 className="mb-3 text-sm font-semibold text-(--color-text-primary)">
                          Methodology & Calibration
                        </h5>
                        <div className="space-y-2">
                          <p className="text-sm text-(--color-text-secondary)">
                            {param.methodology}
                          </p>
                          <div className="flex items-start gap-2 rounded-lg border border-(--color-border-faint) bg-(--color-surface-raised) px-3 py-2.5 text-sm text-(--color-text-muted) italic">
                            <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-(--color-accent)" />
                            {param.calibration}
                          </div>
                        </div>
                      </div>

                      {/* Example Cases */}
                      <div>
                        <h5 className="mb-3 text-sm font-semibold text-(--color-text-primary)">
                          Example Cases
                        </h5>
                        <div className="space-y-2">
                          {param.examples.map((ex, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-3 rounded-md border border-(--color-border-faint) bg-(--color-bg-card) p-2.5"
                            >
                              <span className="w-7 shrink-0 text-right font-mono text-sm font-bold text-(--color-accent)">
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
              </Accordion.Item>
            </Accordion>
          </div>
        </div>
      ))}
    </section>
  );
};

// R-Strategy color hierarchy
const R_STRATEGY_COLORS = {
  Refuse: 'border-l-2 border-(--color-success)',
  Reduce: 'border-l-2 border-(--color-success)',
  Reuse: 'border-l-2 border-(--color-info)',
  Repair: 'border-l-2 border-(--color-info)',
  Refurbish: 'border-l-2 border-(--color-accent)',
  Remanufacture: 'border-l-2 border-(--color-accent)',
  Repurpose: 'border-l-2 border-(--color-accent)',
  Recycle: 'border-l-2 border-(--color-text-muted)',
  Recover: 'border-l-2 border-(--color-text-muted)',
};

// Scoring & Benchmarking Section
const ScoringBenchmarkingSection = () => (
  <section
    id="scoring-benchmarking"
    className="scroll-mt-24 border-t border-(--color-border-faint) py-14"
  >
    <h2 className="mb-1 font-display text-2xl font-bold text-(--color-text-primary)">
      Scoring & Benchmarking
    </h2>
    <p className="mb-2 text-sm text-(--color-text-muted)">
      {GUIDE_PAGE_CONTENT.scoringBenchmarking.subtitle}
    </p>
    <p className="mb-10 max-w-2xl text-sm/relaxed text-(--color-text-secondary)">
      {GUIDE_PAGE_CONTENT.scoringBenchmarking.intro}
    </p>

    {/* Circularity Tiers */}
    <div id="circularity-tiers" className="scroll-mt-24">
      <h3 className="mb-4 font-display text-lg font-semibold text-(--color-text-primary)">
        Circularity Tiers
      </h3>
      <div className="overflow-hidden rounded-xl border border-(--color-border-ui)">
        {GUIDE_PAGE_CONTENT.scoringBenchmarking.tiers.map((tier, i) => (
          <div
            key={tier.name}
            className={cn(
              'flex items-start gap-4 px-4 py-3.5',
              i !== GUIDE_PAGE_CONTENT.scoringBenchmarking.tiers.length - 1 &&
                'border-b border-(--color-border-faint)',
            )}
          >
            <div className="w-24 shrink-0">
              <p
                className={cn(
                  'text-sm font-semibold',
                  tier.color === 'success' && 'text-(--color-success)',
                  tier.color === 'info' && 'text-(--color-info)',
                  tier.color === 'warning' && 'text-(--color-warning)',
                  tier.color === 'accent' && 'text-(--color-accent)',
                )}
              >
                {tier.name}
              </p>
              <p className="font-mono text-xs text-(--color-text-muted)">{tier.range}</p>
            </div>
            <p className="text-sm/relaxed text-(--color-text-secondary)">{tier.description}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Weighted Scoring */}
    <div id="weighted-scoring" className="mt-10 scroll-mt-24">
      <h3 className="mb-5 font-display text-lg font-semibold text-(--color-text-primary)">
        Weighted Scoring
      </h3>
      <p className="mb-4 text-sm/relaxed text-(--color-text-secondary)">
        {GUIDE_PAGE_CONTENT.scoringBenchmarking.weightedScoring.explanation}
      </p>
      <div className="my-4 rounded-lg border border-(--color-border-faint) bg-(--color-surface-raised) px-5 py-4">
        <p className="text-center font-mono text-sm font-semibold text-(--color-text-primary)">
          {GUIDE_PAGE_CONTENT.scoringBenchmarking.weightedScoring.formula}
        </p>
      </div>
      <p className="mt-3 text-xs text-(--color-text-muted) italic">
        {GUIDE_PAGE_CONTENT.scoringBenchmarking.weightedScoring.note}
      </p>
    </div>

    {/* Consistency Check */}
    <div id="consistency-check" className="mt-10 scroll-mt-24">
      <h3 className="mb-5 font-display text-lg font-semibold text-(--color-text-primary)">
        Consistency Check
      </h3>
      <p className="mb-4 text-sm/relaxed text-(--color-text-secondary)">
        {GUIDE_PAGE_CONTENT.scoringBenchmarking.consistencyCheck.explanation}
      </p>
      <ul className="mb-4 space-y-2">
        {GUIDE_PAGE_CONTENT.scoringBenchmarking.consistencyCheck.rules.map((rule, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-(--color-text-secondary)">
            <Info className="mt-0.5 size-3.5 shrink-0 text-(--color-info)" />
            {rule}
          </li>
        ))}
      </ul>
      <p className="text-xs text-(--color-text-muted) italic">
        {GUIDE_PAGE_CONTENT.scoringBenchmarking.consistencyCheck.note}
      </p>
    </div>

    {/* Knowledge Base */}
    <div id="knowledge-base" className="mt-10 scroll-mt-24">
      <h3 className="mb-5 font-display text-lg font-semibold text-(--color-text-primary)">
        Knowledge Base
      </h3>
      <p className="mb-5 text-sm/relaxed text-(--color-text-secondary)">
        {GUIDE_PAGE_CONTENT.scoringBenchmarking.knowledgeBase.summary}
      </p>
      <div className="overflow-hidden rounded-xl border border-(--color-border-ui)">
        {GUIDE_PAGE_CONTENT.scoringBenchmarking.knowledgeBase.sources.map((src, i) => (
          <div
            key={src.name}
            className={cn(
              'flex items-center justify-between gap-4 px-4 py-3',
              i % 2 === 1 && 'bg-(--color-table-stripe)',
              i !== GUIDE_PAGE_CONTENT.scoringBenchmarking.knowledgeBase.sources.length - 1 &&
                'border-b border-(--color-border-faint)',
            )}
          >
            <div>
              <p className="text-sm font-medium text-(--color-text-primary)">{src.name}</p>
              <p className="text-xs text-(--color-text-muted)">{src.type}</p>
            </div>
            <span className="font-mono text-sm font-bold text-(--color-accent)">{src.count}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-(--color-text-muted) italic">
        {GUIDE_PAGE_CONTENT.scoringBenchmarking.knowledgeBase.searchNote}
      </p>
    </div>

    {/* R-Strategy Alignment */}
    <div id="r-strategy" className="mt-10 scroll-mt-24">
      <h3 className="mb-5 font-display text-lg font-semibold text-(--color-text-primary)">
        R-Strategy Alignment
      </h3>
      <p className="mb-5 text-sm/relaxed text-(--color-text-secondary)">
        {GUIDE_PAGE_CONTENT.scoringBenchmarking.rStrategy.explanation}
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {GUIDE_PAGE_CONTENT.scoringBenchmarking.rStrategy.strategies.map((s) => (
          <div
            key={s.code}
            className={cn(
              'rounded-lg border border-(--color-border-ui) bg-(--color-surface-raised) p-3',
              R_STRATEGY_COLORS[s.code],
            )}
          >
            <p className="mb-0.5 text-sm font-semibold text-(--color-accent)">{s.code}</p>
            <p className="text-xs text-(--color-text-muted)">{s.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Understanding Results Section
const UnderstandingResultsSection = () => (
  <section
    id="understanding-results"
    className="scroll-mt-24 border-t border-(--color-border-faint) py-14"
  >
    <h2 className="mb-1 font-display text-2xl font-bold text-(--color-text-primary)">
      Understanding Results
    </h2>
    <p className="mb-2 text-sm text-(--color-text-muted)">
      {GUIDE_PAGE_CONTENT.understandingResults.subtitle}
    </p>
    <p className="mb-10 max-w-2xl text-sm/relaxed text-(--color-text-secondary)">
      {GUIDE_PAGE_CONTENT.understandingResults.intro}
    </p>

    {/* Results Overview */}
    <div id="results-overview" className="scroll-mt-24">
      <h3 className="mb-5 font-display text-lg font-semibold text-(--color-text-primary)">
        Results Overview
      </h3>
      <div className="space-y-3">
        {GUIDE_PAGE_CONTENT.understandingResults.sections
          .filter(
            (s) => !['Improvement Roadmap', 'SDG Alignment', 'Database Evidence'].includes(s.title),
          )
          .map((s, i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-xl border border-(--color-border-ui) bg-(--color-surface-raised) p-4"
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-(--color-border-ui) bg-(--color-bg) font-mono text-xs font-bold text-(--color-accent)">
                {i + 1}
              </div>
              <div>
                <p className="mb-1 text-sm font-semibold text-(--color-text-primary)">{s.title}</p>
                <p className="text-xs/relaxed text-(--color-text-muted)">{s.description}</p>
              </div>
            </div>
          ))}
      </div>
    </div>

    {/* Improvement Roadmap */}
    <div id="improvement-roadmap" className="mt-10 scroll-mt-24">
      <h3 className="mb-5 font-display text-lg font-semibold text-(--color-text-primary)">
        Improvement Roadmap
      </h3>
      <p className="mb-5 text-sm/relaxed text-(--color-text-secondary)">
        {
          GUIDE_PAGE_CONTENT.understandingResults.sections.find(
            (s) => s.title === 'Improvement Roadmap',
          )?.description
        }
      </p>
      <p className="mb-4 text-sm/relaxed text-(--color-text-secondary)">
        {GUIDE_PAGE_CONTENT.understandingResults.improvementRoadmapDetail.howGenerated}
      </p>
      <div className="space-y-0 overflow-hidden rounded-lg border border-(--color-border-ui)">
        {GUIDE_PAGE_CONTENT.understandingResults.improvementRoadmapDetail.actionFields.map(
          (f, i) => (
            <div
              key={f.field}
              className={cn(
                'flex items-start gap-0 overflow-hidden rounded-lg border border-(--color-border-faint) bg-(--color-surface-raised)',
                'border-b border-(--color-border-faint) last:border-b-0',
              )}
            >
              <div className="w-32 shrink-0 border-r border-(--color-border-faint) px-3 py-2.5">
                <p className="text-xs font-semibold text-(--color-accent)">{f.field}</p>
              </div>
              <div className="px-3 py-2.5">
                <p className="text-xs text-(--color-text-muted)">{f.desc}</p>
              </div>
            </div>
          ),
        )}
      </div>
    </div>

    {/* SDG Alignment */}
    <div id="sdg-alignment" className="mt-10 scroll-mt-24">
      <h3 className="mb-5 font-display text-lg font-semibold text-(--color-text-primary)">
        SDG Alignment
      </h3>
      <p className="mb-4 text-sm/relaxed text-(--color-text-secondary)">
        {GUIDE_PAGE_CONTENT.understandingResults.sdgDetail.explanation}
      </p>
      <div className="space-y-2">
        {GUIDE_PAGE_CONTENT.understandingResults.sdgDetail.commonSDGs.map((sdg) => (
          <div
            key={sdg.goal}
            className="flex items-start gap-3 rounded-lg border border-(--color-border-faint) bg-(--color-surface-raised) px-4 py-3"
          >
            <span className="shrink-0 rounded-md border border-(--color-info)/20 bg-(--color-info-soft) px-2 py-0.5 font-mono text-[11px] font-bold text-(--color-info)">
              {sdg.goal}
            </span>
            <div>
              <p className="text-xs font-semibold text-(--color-text-primary)">{sdg.name}</p>
              <p className="text-xs text-(--color-text-muted)">{sdg.relevance}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Database Evidence */}
    <div id="database-evidence" className="mt-10 scroll-mt-24">
      <h3 className="mb-5 font-display text-lg font-semibold text-(--color-text-primary)">
        Database Evidence
      </h3>
      {(() => {
        const s = GUIDE_PAGE_CONTENT.understandingResults.sections.find(
          (s) => s.title === 'Database Evidence',
        );
        return s ? (
          <>
            <p className="mb-4 text-sm/relaxed text-(--color-text-secondary)">{s.description}</p>
            <div className="rounded-lg border border-(--color-border-faint) bg-(--color-surface-raised) px-4 py-3">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 size-4 shrink-0 text-(--color-text-muted)" />
                <p className="text-sm text-(--color-text-secondary)">
                  {GUIDE_PAGE_CONTENT.understandingResults.exportNote}
                </p>
              </div>
            </div>
          </>
        ) : null;
      })()}
    </div>

    {/* Saving & Exporting */}
    <div id="saving-exporting" className="mt-10 scroll-mt-24">
      <h3 className="mb-5 font-display text-lg font-semibold text-(--color-text-primary)">
        Saving & Exporting
      </h3>
      <div className="mb-6 space-y-2">
        {GUIDE_PAGE_CONTENT.understandingResults.savingAndExporting.saving.map((item) => (
          <div
            key={item.action}
            className="rounded-lg border border-(--color-border-ui) bg-(--color-surface-raised) px-4 py-3"
          >
            <p className="mb-0.5 text-sm font-semibold text-(--color-text-primary)">
              {item.action}
            </p>
            <p className="text-xs text-(--color-text-muted)">{item.how}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {GUIDE_PAGE_CONTENT.understandingResults.savingAndExporting.exporting.map((fmt) => (
          <div
            key={fmt.format}
            className="rounded-xl border border-(--color-border-ui) bg-(--color-surface-raised) p-4"
          >
            <p className="mb-1 font-mono text-sm font-bold text-(--color-accent)">
              .{fmt.format.toLowerCase()}
            </p>
            <p className="text-xs/relaxed text-(--color-text-muted)">{fmt.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Sample Test Cases Section
const SampleTestCasesSection = () => {
  return (
    <section
      id="sample-test-cases"
      className="scroll-mt-24 border-t border-(--color-border-faint) py-14"
    >
      <h2 className="mb-1 font-display text-2xl font-bold text-(--color-text-primary)">
        Sample Test Cases
      </h2>
      <p className="mb-2 text-sm text-(--color-text-muted)">
        Real circular economy business examples for reference
      </p>
      {GUIDE_PAGE_CONTENT.sampleTestCases.intro && (
        <p className="mb-8 max-w-2xl text-sm/relaxed text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.sampleTestCases.intro}
        </p>
      )}

      {/* Description + Benefits */}
      <div className="mb-8">
        <p className="mb-4 text-sm text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.sampleTestCases.description}
        </p>
        <ul className="space-y-2">
          {GUIDE_PAGE_CONTENT.sampleTestCases.benefits.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-(--color-text-secondary)">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-(--color-success)" />
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* How to Use */}
      <div id="test-cases-how-to" className="mt-10 scroll-mt-24">
        <h3 className="mb-4 font-display text-lg font-semibold text-(--color-text-primary)">
          How to Use
        </h3>
        <div className="space-y-1">
          {GUIDE_PAGE_CONTENT.sampleTestCases.steps.map((step) => (
            <div
              key={step.num}
              className="flex items-start gap-3 border-b border-(--color-border-faint) py-3 last:border-b-0"
            >
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full border border-(--color-border-ui) bg-(--color-surface-raised) font-mono text-xs font-bold text-(--color-accent)">
                {step.num}
              </div>
              <div>
                <p className="mb-0.5 text-sm font-semibold text-(--color-text-primary)">
                  {step.title}
                </p>
                <p className="text-xs text-(--color-text-muted)">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tip callout */}
      <div className="mt-4 flex items-start gap-3 rounded-lg border border-(--color-accent-border) bg-(--color-accent-light) px-4 py-3">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-(--color-accent)" />
        <p className="text-sm text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.sampleTestCases.tip}
        </p>
      </div>
    </section>
  );
};

// Main GuidePage component
export default function GuidePage() {
  const [activeId, setActiveId] = useState('overview');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // ONLY observe child subsection divs — never parent <section> elements.
    // Parent sections are large wrappers that stay "intersecting" long after
    // their children have left, causing the flicker.
    const childIds = NAV_TREE.flatMap((s) => s.children?.map((c) => c.id) ?? []);

    // Also build the full priority list (children first) for when we need
    // to fall back to a parent section heading at the very top of the page.
    const parentIds = NAV_TREE.map((s) => s.id);

    // Combine: children are observed and win; parents used only for initial state.
    const allObservedIds = [...childIds];

    const elements = allObservedIds.map((id) => document.getElementById(id)).filter(Boolean);

    if (elements.length === 0) return;

    const intersecting = new Set();

    const pickActive = () => {
      if (intersecting.size === 0) {
        // Nothing intersecting — we're between sections or at very top.
        // Find which section the viewport top is currently inside by checking
        // which parent section's top is above the viewport midpoint.
        const viewportMid = window.scrollY + window.innerHeight * 0.3;
        let bestParent = parentIds[0];
        for (const id of parentIds) {
          const el = document.getElementById(id);
          if (!el) continue;
          const top = el.getBoundingClientRect().top + window.scrollY;
          if (top <= viewportMid) {
            bestParent = id;
          }
        }
        setActiveId(bestParent);
        return;
      }

      // Among intersecting children, pick the one whose parent section
      // appears earliest in the nav tree, then by child order within the section.
      const priorityOrder = NAV_TREE.flatMap((s) => s.children?.map((c) => c.id) ?? []);
      for (const id of priorityOrder) {
        if (intersecting.has(id)) {
          setActiveId(id);
          return;
        }
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            intersecting.add(entry.target.id);
          } else {
            intersecting.delete(entry.target.id);
          }
        });
        pickActive();
      },
      // Wider band: fires when element enters the middle 37% of the viewport.
      // Top 8% is the sticky header dead zone.
      // Bottom 55% means the element must be in the upper half to count.
      { rootMargin: '-8% 0px -55% 0px', threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      intersecting.clear();
    };
  }, []);

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const headerOffset = 80; // matches sticky header + some breathing room
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-(--color-bg)">
      {/* Page header */}
      <div className="sticky top-0 z-30 border-b border-(--color-border-ui) bg-(--color-bg)/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center">
            <h1 className="font-display text-xl font-bold text-(--color-text-primary)">
              Circular Economy Evaluation Guide
            </h1>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-16 py-10">
          {/* Content */}
          <div className="max-w-3xl min-w-0 flex-1">
            <OverviewSection />
            <GettingStartedSection />
            <BusinessProblemSection />
            <BusinessSolutionSection />
            <BusinessContextSection />
            <EvaluationCriteriaSection />
            <EvaluationParametersSection />
            <ScoringBenchmarkingSection />
            <UnderstandingResultsSection />
            <SampleTestCasesSection />
          </div>

          {/* Desktop Navigation */}
          <DesktopNav activeId={activeId} onNavigate={scrollToId} />
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav activeId={activeId} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
    </div>
  );
}
