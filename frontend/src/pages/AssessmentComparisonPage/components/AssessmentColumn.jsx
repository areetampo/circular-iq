/**
 * Assessment results column used inside public comparison and read-only assessment views.
 */

import { NotebookPen } from 'lucide-react';
import PropTypes from 'prop-types';

import { SectionHeading, Separator } from '@/components/common';
import {
  AuditSummaryCard as SharedAuditSummaryCard,
  GapAnalysisCard as SharedGapAnalysisCard,
} from '@/components/results/shared';
import { validKeys } from '@/constants/evaluationData';
import { formatFactorName } from '@/lib/scoring';
import {
  CaseSummaryAccordions,
  CategoryAnalysis,
  CircularEconomyTierCard,
  DatabaseEvidenceCard,
  IndustryMetadataSection,
  IntegrityAnalysis,
  ParameterConsistencyCard,
  PerformanceComparison,
  RecommendationsCard,
  ResultsActionBar,
  RStrategyAlignmentCard,
  ScoreCategoryBreakdown,
  ScoreOverviewSection,
  StrengthsGapsCard,
  WeightedScoreCard,
} from '@/pages/ResultsPage/components';

/**
 * Renders one assessment's result cards, radar data, audit evidence, and recommendation sections.
 */
export default function AssessmentColumn({
  assessment,
  scoringResult,
  overallScore,
  strengths,
  gaps,
  casesSummaries,
  topFactor,
  focusFactor,
  resolvedBusinessViabilityScore,
}) {
  const fieldHelp = {
    industry: 'Sector we matched from your description',
    scale: 'Maturity/footprint: prototype, pilot, regional, commercial, global',
    r_strategy: 'Dominant circular economy strategy (e.g., Reduce, Reuse, Recycle)',
    primary_material: 'Main material or waste stream this solution targets',
    geographic_focus: 'Primary market or region you aim to serve',
  };

  const computeMarketAvg = (res) => {
    if (!res?.similar_cases || res.similar_cases.length === 0) return 65;
    return (
      res.similar_cases.reduce((acc, curr) => acc + (curr.similarity || 0) * 100, 0) /
      res.similar_cases.length
    );
  };

  // Keep radar values local because comparison columns do not receive the ResultsPage resolver props.
  const radarData = validKeys
    .filter((key) => key in (scoringResult?.sub_scores || {}))
    .map((key) => ({
      subject: formatFactorName(key),
      userValue: Number(scoringResult.sub_scores[key]) || 0,
      marketAvg: computeMarketAvg(scoringResult),
    }));

  const radarConfigs = [
    {
      name: 'Your Idea',
      dataKey: 'userValue',
      stroke: 'var(--success)',
      fill: 'var(--success)',
      fillOpacity: 0.35,
    },
    {
      name: 'Market Average',
      dataKey: 'marketAvg',
      stroke: 'var(--info)',
      fill: 'var(--info)',
      fillOpacity: 0.2,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Results Content wrapper for PDF export */}
      <div id="results-content" className="space-y-6">
        {/* Case Summary */}
        <div className="py-4">
          <ResultsActionBar
            currentData={assessment}
            user={null}
            isPublicShare={true}
            isViewFromMyAssessments={false}
            onSave={null}
            onOpenRename={null}
            onOpenDelete={null}
            defaultAssessmentName={null}
            actualResult={scoringResult}
            resolvedFormData={null}
            sessionSnapshot={null}
            navigationResult={null}
            openSaveAssessmentDialog={null}
          />

          <Separator pct={50} wrapperCn="mt-6 mb-8" />

          <CaseSummaryAccordions
            businessProblem={assessment.business_problem}
            businessSolution={assessment.business_solution}
            businessContext={assessment.business_context}
            evaluationParameters={assessment.evaluation_parameters}
          />
        </div>

        <ScoreOverviewSection
          actualResult={scoringResult}
          overallScore={overallScore}
          topFactor={topFactor}
          focusFactor={focusFactor}
        />
        <Separator pct={40} wrapperCn="my-8" />

        <CircularEconomyTierCard actualResult={scoringResult} />
        <Separator pct={40} wrapperCn="my-8" />

        <WeightedScoreCard actualResult={scoringResult} />
        <Separator pct={40} wrapperCn="my-8" />

        <ParameterConsistencyCard actualResult={scoringResult} />
        <Separator pct={40} wrapperCn="my-8" />

        <RStrategyAlignmentCard actualResult={scoringResult} />
        <Separator pct={40} wrapperCn="my-8" />

        <ScoreCategoryBreakdown actualResult={scoringResult} />
        <Separator pct={40} wrapperCn="my-8" />

        <SharedGapAnalysisCard result={scoringResult} variant="transparent" />
        <Separator pct={40} wrapperCn="my-8" />

        {/* <div className="space-y-0"> */}
        <IndustryMetadataSection actualResult={scoringResult} fieldHelp={fieldHelp} />
        <Separator pct={40} wrapperCn="my-8" />

        <CategoryAnalysis
          actualResult={scoringResult}
          resolvedBusinessViabilityScore={resolvedBusinessViabilityScore}
        />
        <Separator pct={40} wrapperCn="my-8" />

        <PerformanceComparison
          resolvedRadarData={radarData}
          radarConfigs={radarConfigs}
          detailLoading={false}
        />
        <Separator pct={40} wrapperCn="my-8" />

        <IntegrityAnalysis strengths={strengths} gaps={gaps} />
        <Separator pct={40} wrapperCn="my-8" />

        {/* </div> */}

        {/* SharedAuditSummaryCard */}
        <SharedAuditSummaryCard result={scoringResult} variant="transparent" />
        <Separator pct={40} wrapperCn="my-8" />

        {/* DatabaseEvidenceCard */}
        <DatabaseEvidenceCard actualResult={scoringResult} casesSummaries={casesSummaries} />
        <Separator pct={40} wrapperCn="my-8" />

        <SectionHeading
          variant="small"
          icon={<NotebookPen className="size-4 text-(--color-accent)" />}
          className="mt-8"
        >
          Strategic Synthesis
        </SectionHeading>

        <StrengthsGapsCard strengths={strengths} gaps={gaps} />
        <RecommendationsCard actualResult={scoringResult} />
      </div>
    </div>
  );
}

AssessmentColumn.propTypes = {
  /** Assessment data containing business problem, solution, context, and parameters */
  assessment: PropTypes.object.isRequired,
  /** Scoring result object with scores, analysis, and metadata */
  scoringResult: PropTypes.object.isRequired,
  /** Overall circular economy score (0-100) */
  overallScore: PropTypes.number.isRequired,
  /** Array of identified strengths from the analysis */
  strengths: PropTypes.array.isRequired,
  /** Array of identified gaps from the analysis */
  gaps: PropTypes.array.isRequired,
  /** Array of similar case summaries for comparison */
  casesSummaries: PropTypes.array.isRequired,
  /** Top scoring sub-score entry as [factorKey, score], or null when no sub-scores exist */
  topFactor: PropTypes.array,
  /** Lowest scoring sub-score entry as [factorKey, score], or null when no sub-scores exist */
  focusFactor: PropTypes.array,
  /** Business viability score after applying the shared ResultsPage weighting formula */
  resolvedBusinessViabilityScore: PropTypes.number.isRequired,
};
