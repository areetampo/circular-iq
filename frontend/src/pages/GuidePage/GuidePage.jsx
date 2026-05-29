/**
 * Long-form product guide for methodology, inputs, scoring, results, and sample workflows.
 * Layout and scroll spy state live here while section markup stays in `./components`.
 */

import { TextSearch } from 'lucide-react';
import React from 'react';

import { Separator } from '@/components/common';

import {
  BusinessContextSection,
  BusinessProblemSection,
  BusinessSolutionSection,
  DesktopNav,
  EvaluationCriteriaSection,
  EvaluationParametersSection,
  GettingStartedSection,
  MobileNav,
  OverviewSection,
  SampleTestCasesSection,
  ScoringBenchmarkingSection,
  UnderstandingResultsSection,
} from './components';
import useGuideScrollSpy from './hooks/useGuideScrollSpy';

const GUIDE_SECTIONS = [
  <OverviewSection key="overview" />,
  <GettingStartedSection key="getting-started" />,
  <BusinessProblemSection key="business-problem" />,
  <BusinessSolutionSection key="business-solution" />,
  <BusinessContextSection key="business-context" />,
  <EvaluationCriteriaSection key="evaluation-criteria" />,
  <EvaluationParametersSection key="evaluation-parameters" />,
  <ScoringBenchmarkingSection key="scoring-benchmarking" />,
  <UnderstandingResultsSection key="understanding-results" />,
  <SampleTestCasesSection key="sample-test-cases" />,
];

/**
 * Renders the full product guide with sticky desktop navigation and collapsible mobile navigation.
 *
 * @returns {import('react').ReactElement} Guide page containing the TOC controls and ordered content sections.
 */
export default function GuidePage() {
  const { activeId, mobileOpen, setMobileOpen, scrollToId } = useGuideScrollSpy();

  return (
    <div className="mx-auto mt-8 max-w-6xl">
      <div className="mb-8 flex items-center justify-between pl-8">
        <h2 className="flex items-center gap-3 text-3xl">
          <span className="font-sans font-medium text-mist-900">
            Circular Economy Evaluation Guide
          </span>
          <TextSearch strokeWidth={2.5} size={32} />
        </h2>
      </div>

      <MobileNav
        activeId={activeId}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        scrollToId={scrollToId}
      />

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex gap-16">
          <div className="max-w-3xl min-w-0 flex-1">
            {GUIDE_SECTIONS.map((section, index) => (
              <React.Fragment key={section.key}>
                {section}
                {index < GUIDE_SECTIONS.length - 1 && <Separator pct={40} wrapperCn="my-12" />}
              </React.Fragment>
            ))}
          </div>

          <DesktopNav activeId={activeId} onNavigate={scrollToId} />
        </div>
      </div>
    </div>
  );
}
