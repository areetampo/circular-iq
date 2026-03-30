import { Button } from '@heroui/react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Dumbbell,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Upload,
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Chip } from '@/components/common';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useAssessmentComparison } from '@/features/assessments/hooks/useAssessmentComparison';
import { reconstructScoringResult } from '@/features/assessments/utils';
import { exportComparisonCSV } from '@/features/export';
import { formatTimestamp, getCurrentTimestampFormatted, titleize } from '@/lib/formatting';

import {
  ComparisonSkeleton,
  DatabaseEvidenceTab,
  DetailsTab,
  FactorAnalysisTab,
  OverviewTab,
} from './components';

export default function AssessmentComparisonPage() {
  const [searchParams] = useSearchParams();
  const params = useParams();

  // Support both URL params (/assessments/compare/:publicId1/:publicId2) and query params (?publicId1=...&publicId2=...)
  const publicId1 =
    params.publicId1 || searchParams.get('publicId1') || params.id1 || searchParams.get('id1');
  const publicId2 =
    params.publicId2 || searchParams.get('publicId2') || params.id2 || searchParams.get('id2');
  const navigate = useNavigate();

  const { assessment1, assessment2, comparisonData, isLoading, isError, error } =
    useAssessmentComparison(publicId1, publicId2);

  const { openResultsDatabaseEvidenceDetailsDrawer } = useGlobalDrawer();

  const handleBack = () => {
    navigate('/assessments');
  };

  if (!publicId1 || !publicId2) {
    return (
      <ErrorDisplay
        variant="warning"
        icon={AlertTriangle}
        title="Unable to Compare"
        message="Please select two assessments to compare. Missing required assessment IDs."
        actions={[
          {
            label: 'Back to Assessments',
            icon: ArrowLeft,
            onClick: () => navigate('/assessments'),
            variant: 'tertiary',
          },
        ]}
        showDefaultActions={false}
      />
    );
  }

  if (isLoading) return <ComparisonSkeleton />;

  if (isError)
    return (
      <ErrorDisplay
        variant="error"
        title="Cannot Compare Assessments"
        message={error || 'One or more ids incorrect'}
        actions={[
          {
            label: 'Back to Assessments',
            icon: ArrowLeft,
            onClick: () => navigate('/assessments'),
            variant: 'tertiary',
          },
          {
            label: 'Try Different IDs',
            icon: ArrowLeft,
            onClick: () => navigate('/assessments/compare'),
            variant: 'tertiary',
          },
        ]}
        showDefaultActions={false}
      />
    );

  if (!assessment1 || !assessment2) {
    return (
      <ErrorDisplay
        variant="warning"
        icon={AlertTriangle}
        title="Assessment Not Found"
        message="One or both of the selected assessments could not be found. They may have been deleted or you may not have permission to access them."
        actions={[
          {
            label: 'Back to Assessments',
            icon: ArrowLeft,
            onClick: () => navigate('/assessments'),
            variant: 'tertiary',
          },
        ]}
        showDefaultActions={false}
      />
    );
  }

  // Reconstruct full scoring results
  const scoringResult1 = reconstructScoringResult(assessment1);
  const scoringResult2 = reconstructScoringResult(assessment2);

  // Derive metrics
  const factorDiffs = Object.entries(comparisonData.factorDiffs || {}).map(([factor, diff]) => {
    const a1 = scoringResult1?.sub_scores?.[factor] || 0;
    const a2 = scoringResult2?.sub_scores?.[factor] || 0;
    return {
      factor,
      label: titleize(factor),
      diff,
      a1,
      a2,
    };
  });

  const overallDelta = comparisonData.overallDiff;
  const biggestGain = comparisonData.biggestGain
    ? {
        ...comparisonData.biggestGain,
        label: titleize(comparisonData.biggestGain.factor),
      }
    : null;
  const biggestDrop = comparisonData.biggestDrop
    ? {
        ...comparisonData.biggestDrop,
        label: titleize(comparisonData.biggestDrop.factor),
      }
    : null;
  const averageDelta =
    factorDiffs.length > 0
      ? Math.round(factorDiffs.reduce((sum, f) => sum + f.diff, 0) / factorDiffs.length)
      : 0;

  // Helper functions
  const getScoreColor = (score) => {
    if (score >= 75) return 'success';
    if (score >= 50) return 'warning';
    return 'danger';
  };

  // Generate insights
  const generateInsights = () => {
    const score1 = scoringResult1?.overall_score || 0;
    const score2 = scoringResult2?.overall_score || 0;
    const diff = score2 - score1;
    const insights = [];

    if (diff > 5) {
      insights.push({
        type: 'positive',
        icon: TrendingUp,
        text: `Significant improvement: ${diff} point gain from ${score1} to ${score2}`,
      });
    } else if (diff > 0) {
      insights.push({
        type: 'positive',
        icon: TrendingUp,
        text: `Modest improvement: ${diff} point increase`,
      });
    } else if (diff < -5) {
      insights.push({
        type: 'negative',
        icon: TrendingDown,
        text: `Decline detected: ${Math.abs(diff)} point drop from ${score1} to ${score2}`,
      });
    } else if (diff < 0) {
      insights.push({
        type: 'negative',
        icon: TrendingDown,
        text: `Minor decline: ${Math.abs(diff)} point decrease`,
      });
    } else {
      insights.push({ type: 'neutral', icon: ArrowRight, text: 'Overall scores remain stable' });
    }

    const strongest = factorDiffs.reduce((a, b) => (a.diff > b.diff ? a : b), factorDiffs[0] || {});
    const weakest = factorDiffs.reduce((a, b) => (a.diff < b.diff ? a : b), factorDiffs[0] || {});

    if (strongest && strongest.diff > 2) {
      insights.push({
        type: 'positive',
        icon: Star,
        text: `Strongest improvement in ${strongest.label} (+${strongest.diff} points)`,
      });
    }

    if (weakest && weakest.diff < -2) {
      insights.push({
        type: 'negative',
        icon: AlertTriangle,
        text: `Notable decline in ${weakest.label} (${weakest.diff} points)`,
      });
    }

    const sub2 = scoringResult2?.sub_scores || {};
    const topScore = Math.max(...Object.values(sub2));
    const topFactor = Object.keys(sub2).find((k) => sub2[k] === topScore);
    if (topFactor && topScore >= 80) {
      insights.push({
        type: 'positive',
        icon: Dumbbell,
        text: `${titleize(topFactor)} is a strength (${topScore}/100)`,
      });
    }

    const lowScore = Math.min(...Object.values(sub2));
    const lowFactor = Object.keys(sub2).find((k) => sub2[k] === lowScore);
    if (lowFactor && lowScore < 50) {
      insights.push({
        type: 'negative',
        icon: Target,
        text: `Priority improvement: ${titleize(lowFactor)} (${lowScore}/100)`,
      });
    }

    return insights;
  };

  const insights = generateInsights();

  // Prepare data for Radar Chart
  const factors = Object.keys(scoringResult1?.sub_scores || {});
  const radarChartData =
    factors.length > 0
      ? factors.map((factor) => ({
          subject: titleize(factor),
          [assessment1.title]: scoringResult1?.sub_scores?.[factor] || 0,
          [assessment2.title]: scoringResult2?.sub_scores?.[factor] || 0,
          fullMark: 100,
        }))
      : [];

  const radarConfigs = [
    {
      dataKey: assessment1.title,
      stroke: 'var(--success)',
      fill: 'var(--success)',
      fillOpacity: 0.2,
    },
    { dataKey: assessment2.title, stroke: 'var(--info)', fill: 'var(--info)', fillOpacity: 0.2 },
  ];

  // Prepare data for Bar Chart (Changes)
  const barChartData =
    factorDiffs?.length > 0
      ? factorDiffs.map((f) => ({
          name: f.label,
          'Assessment 1': f.a1,
          'Assessment 2': f.a2,
          Change: f.diff,
        }))
      : [];

  const barConfigs = [
    { dataKey: 'Assessment 1', name: assessment1.title, fill: 'var(--success)' },
    { dataKey: 'Assessment 2', name: assessment2.title, fill: 'var(--info)' },
  ];

  return (
    <div className="space-y-0 w-full">
      {/* STICKY COMPARISON HEADER */}
      <div
        className="sticky top-0 z-40 w-full border-b transition-all duration-200 backdrop-blur-md py-3 px-4"
        style={{ backgroundColor: 'oklch(0.97 0.012 80 / 0.9)', borderColor: 'var(--border)' }}
      >
        <div className="grid grid-cols-2 gap-4 max-w-6xl mx-auto">
          <div className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
            {assessment1.title}
            <span className="ml-2 font-mono text-xs" style={{ color: 'var(--muted)' }}>
              {scoringResult1?.overall_score || 0}/100
            </span>
          </div>
          <div className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
            {assessment2.title}
            <span className="ml-2 font-mono text-xs" style={{ color: 'var(--muted)' }}>
              {scoringResult2?.overall_score || 0}/100
            </span>
          </div>
        </div>
      </div>

      {/* Assessment Headers */}
      <div className="w-full px-4 md:px-10 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
          <div
            className="border-2 rounded-xl"
            style={{
              backgroundColor: 'transparent',
              borderColor: 'var(--border)',
            }}
          >
            <div className="gap-3 p-4">
              <h2
                className="text-lg font-bold wrap-break-word"
                style={{
                  color: 'var(--foreground)',
                }}
              >
                {assessment1.title}
              </h2>
              <p className="text-xs font-medium italic" style={{ color: 'var(--muted)' }}>
                {formatTimestamp(assessment1.created_at)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Chip variant="success">Score: {scoringResult1?.overall_score || 0}/100</Chip>
                <Chip variant="warning">Conf: {scoringResult1?.confidence_level || 0}%</Chip>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {scoringResult1?.metadata?.industry && (
                  <Chip variant="default">{scoringResult1.metadata.industry}</Chip>
                )}
                {scoringResult1?.metadata?.scale && (
                  <Chip variant="default">{scoringResult1.metadata.scale}</Chip>
                )}
                {scoringResult1?.metadata?.r_strategy && (
                  <Chip variant="default">{scoringResult1.metadata.r_strategy}</Chip>
                )}
              </div>
              <Chip variant="success" className="w-fit mt-1 font-semibold">
                Assessment 1
              </Chip>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-center px-4">
            <div className="text-center">
              <span
                className="text-sm font-bold px-3 py-1.5 rounded-md"
                style={{
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent)',
                  border: '1px solid var(--accent)',
                }}
              >
                VS
              </span>
            </div>
          </div>

          <div
            className="border-2 rounded-xl"
            style={{
              backgroundColor: 'transparent',
              borderColor: 'var(--border)',
            }}
          >
            <div className="gap-3 p-4">
              <h2
                className="text-lg font-bold wrap-break-word"
                style={{
                  color: 'var(--foreground)',
                }}
              >
                {assessment2.title}
              </h2>
              <p className="text-xs font-medium italic" style={{ color: 'var(--muted)' }}>
                {formatTimestamp(assessment2.created_at)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Chip variant="info">Score: {scoringResult2?.overall_score || 0}/100</Chip>
                <Chip variant="warning">Conf: {scoringResult2?.confidence_level || 0}%</Chip>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {scoringResult2?.metadata?.industry && (
                  <Chip variant="default">{scoringResult2.metadata.industry}</Chip>
                )}
                {scoringResult2?.metadata?.scale && (
                  <Chip variant="default">{scoringResult2.metadata.scale}</Chip>
                )}
                {scoringResult2?.metadata?.r_strategy && (
                  <Chip variant="default">{scoringResult2.metadata.r_strategy}</Chip>
                )}
              </div>
              <Chip variant="info" className="w-fit mt-1 font-semibold">
                Assessment 2
              </Chip>
            </div>
          </div>
        </div>
      </div>

      {/* Vertical Content - 2 column layout */}
      <div className="max-w-7xl mx-auto px-0 sm:px-6 space-y-8">
        {/* OVERVIEW SECTION */}
        <div className="border-b border-[var(--border)] pb-3 mb-6">
          <span className="label-overline">OVERVIEW</span>
        </div>
        <OverviewTab
          assessment1={assessment1}
          assessment2={assessment2}
          scoringResult1={scoringResult1}
          scoringResult2={scoringResult2}
          insights={insights}
        />

        <div className="divider-warm my-10" />

        {/* FACTOR ANALYSIS SECTION */}
        <div className="border-b border-[var(--border)] pb-3 mb-6">
          <span className="label-overline">FACTOR ANALYSIS</span>
        </div>
        <FactorAnalysisTab
          assessment1={assessment1}
          assessment2={assessment2}
          scoringResult1={scoringResult1}
          scoringResult2={scoringResult2}
          factorDiffs={factorDiffs}
          radarChartData={radarChartData}
          radarConfigs={radarConfigs}
          barChartData={barChartData}
          barConfigs={barConfigs}
          getScoreColor={getScoreColor}
        />

        <div className="divider-warm my-10" />

        {/* DETAILS SECTION */}
        <div className="border-b border-[var(--border)] pb-3 mb-6">
          <span className="label-overline">DETAILS</span>
        </div>
        <DetailsTab
          assessment1={assessment1}
          assessment2={assessment2}
          scoringResult1={scoringResult1}
          scoringResult2={scoringResult2}
        />

        <div className="divider-warm my-10" />

        {/* DATABASE EVIDENCE SECTION */}
        <div className="border-b border-[var(--border)] pb-3 mb-6">
          <span className="label-overline">DATABASE EVIDENCE</span>
        </div>
        <DatabaseEvidenceTab
          assessment1={assessment1}
          assessment2={assessment2}
          scoringResult1={scoringResult1}
          scoringResult2={scoringResult2}
          openResultsDatabaseEvidenceDetailsDrawer={openResultsDatabaseEvidenceDetailsDrawer}
        />

        {/* Footer */}
        <div
          className="w-full px-4 sm:px-8 flex flex-col md:flex-row justify-between items-center gap-4 py-6 border-t-2"
          style={{ borderColor: 'var(--border)' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
            Last updated: {getCurrentTimestampFormatted()}
          </p>
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={() => exportComparisonCSV([assessment1, assessment2])}
            >
              <Upload size={16} />
              Export CSV
            </Button>
            <Button variant="tertiary" onClick={handleBack}>
              <ArrowLeft size={16} />
              Back to Assessments
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
