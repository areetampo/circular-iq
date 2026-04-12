import { Separator } from '@heroui/react';
import { NotebookPen } from 'lucide-react';
import PropTypes from 'prop-types';

import { SectionHeading } from '@/components/common';
import {
  AuditSummaryCard as SharedAuditSummaryCard,
  GapAnalysisCard as SharedGapAnalysisCard,
} from '@/components/results/shared';
import { validKeys } from '@/constants/evaluationData';
import { formatFactorName } from '@/lib/scoring';
import {
  ResultsActionBar,
  ScoreOverviewSection,
  WeightedScoreCard,
} from '@/pages/ResultsPage/components';
import { CaseSummaryAccordions } from '@/pages/ResultsPage/components/CaseSummaryAccordions';
import { CategoryAnalysis } from '@/pages/ResultsPage/components/CategoryAnalysis';
import { CircularEconomyTierCard } from '@/pages/ResultsPage/components/CircularEconomyTierCard';
import { DatabaseEvidenceCard } from '@/pages/ResultsPage/components/DatabaseEvidenceCard';
import { IndustryMetadataSection } from '@/pages/ResultsPage/components/IndustryMetadataSection';
import { IntegrityAnalysis } from '@/pages/ResultsPage/components/IntegrityAnalysis';
import { ParameterConsistencyCard } from '@/pages/ResultsPage/components/ParameterConsistencyCard';
import { PerformanceComparison } from '@/pages/ResultsPage/components/PerformanceComparison';
import { RecommendationsCard } from '@/pages/ResultsPage/components/RecommendationsCard';
import { RStrategyAlignmentCard } from '@/pages/ResultsPage/components/RStrategyAlignmentCard';
import { ScoreCategoryBreakdown } from '@/pages/ResultsPage/components/ScoreCategoryBreakdown';
import { StrengthsGapsCard } from '@/pages/ResultsPage/components/StrengthsGapsCard';

export function AssessmentColumn({
  assessment,
  scoringResult,
  label,
  overallScore,
  strengths,
  gaps,
  casesSummaries,
  topFactor,
  focusFactor,
  avgFactorScore,
  resolvedBusinessViabilityScore,
  openResultsDatabaseEvidenceDetailsDrawer,
  // Props for ResultsActionBar
  isExporting = false,
  onReevaluate,
  onDownloadPDF,
  onDownloadCSV,
}) {
  const fieldHelp = {
    industry: 'Sector we matched from your description',
    scale: 'Maturity/footprint: prototype, pilot, regional, commercial, global',
    r_strategy: 'Dominant circular economy strategy (e.g., Reduce, Reuse, Recycle)',
    primary_material: 'Main material or waste stream this solution targets',
    geographic_focus: 'Primary market or region you aim to serve',
  };

  // Compute market average for radar chart
  const computeMarketAvg = (res) => {
    if (!res?.similar_cases || res.similar_cases.length === 0) return 65;
    return (
      res.similar_cases.reduce((acc, curr) => acc + (curr.similarity || 0) * 100, 0) /
      res.similar_cases.length
    );
  };

  // Build radar data and configs internally
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
      {/* Case Summary */}
      <div className="py-4">
        <ResultsActionBar
          currentData={assessment}
          user={null}
          isPublicShare={true}
          isViewFromMyAssessments={false}
          isExporting={isExporting}
          onReevaluate={onReevaluate}
          onDownloadPDF={onDownloadPDF}
          onDownloadCSV={onDownloadCSV}
          onSave={null}
          onOpenRename={null}
          onOpenDelete={null}
          defaultAssessmentName={null}
          actualResult={scoringResult}
          resolvedFormData={null}
          sessionSnapshot={null}
          navigationResult={null}
          navigate={null}
          openSaveAssessmentDialog={null}
          logger={console}
          toast={console}
        />

        <div className="flex w-full items-center justify-center">
          <Separator variant="secondary" className="mt-6 mb-8 w-2/3" />
        </div>

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
        casesSummaries={casesSummaries}
        strengths={strengths}
        gaps={gaps}
        isViewFromMyAssessments={false}
        currentData={null}
        optimisticIsPublic={false}
        topFactor={topFactor}
        focusFactor={focusFactor}
        avgFactorScore={avgFactorScore}
        resolvedBusinessViabilityScore={resolvedBusinessViabilityScore}
        reportTips={null}
      />
      <Separator variant="secondary" className="my-8" />

      <CircularEconomyTierCard actualResult={scoringResult} />
      <Separator variant="secondary" className="my-8" />

      <WeightedScoreCard actualResult={scoringResult} />
      <Separator variant="secondary" className="my-8" />

      <ParameterConsistencyCard actualResult={scoringResult} />
      <Separator variant="secondary" className="my-8" />

      <RStrategyAlignmentCard actualResult={scoringResult} />
      <Separator variant="secondary" className="my-8" />

      <ScoreCategoryBreakdown actualResult={scoringResult} />
      <Separator variant="secondary" className="my-8" />

      <SharedGapAnalysisCard result={scoringResult} variant="transparent" />
      <Separator variant="secondary" className="my-8" />

      {/* <div className="space-y-0"> */}
      <IndustryMetadataSection actualResult={scoringResult} fieldHelp={fieldHelp} />
      <Separator variant="secondary" className="my-8" />

      <CategoryAnalysis
        actualResult={scoringResult}
        resolvedBusinessViabilityScore={resolvedBusinessViabilityScore}
      />
      <Separator variant="secondary" className="my-8" />

      <PerformanceComparison
        resolvedRadarData={radarData}
        radarConfigs={radarConfigs}
        detailLoading={false}
      />
      <Separator variant="secondary" className="my-8" />

      <IntegrityAnalysis strengths={strengths} gaps={gaps} />
      <Separator variant="secondary" className="my-8" />

      {/* </div> */}

      {/* SharedAuditSummaryCard */}
      <SharedAuditSummaryCard result={scoringResult} variant="transparent" />
      <Separator variant="secondary" className="my-8" />

      {/* DatabaseEvidenceCard */}
      <DatabaseEvidenceCard actualResult={scoringResult} casesSummaries={casesSummaries} />
      <Separator variant="secondary" className="my-8" />

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
  );
}

AssessmentColumn.propTypes = {
  assessment: PropTypes.object.isRequired,
  scoringResult: PropTypes.object.isRequired,
  label: PropTypes.string,
  overallScore: PropTypes.number.isRequired,
  strengths: PropTypes.array.isRequired,
  gaps: PropTypes.array.isRequired,
  casesSummaries: PropTypes.array.isRequired,
  topFactor: PropTypes.array,
  focusFactor: PropTypes.array,
  avgFactorScore: PropTypes.number.isRequired,
  resolvedBusinessViabilityScore: PropTypes.number.isRequired,
  openResultsDatabaseEvidenceDetailsDrawer: PropTypes.func.isRequired,
  // Props for ResultsActionBar
  isExporting: PropTypes.bool,
  onReevaluate: PropTypes.func,
  onDownloadPDF: PropTypes.func,
  onDownloadCSV: PropTypes.func,
};

export default AssessmentColumn;
