import { Button, Tab, Tabs } from '@heroui/react';
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
import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import ErrorDisplay from '@/components/common/ErrorDisplay';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useAssessmentComparison } from '@/features/assessments/hooks/useAssessmentComparison';
import { reconstructScoringResult } from '@/features/assessments/utils';
import { exportComparisonCSV } from '@/features/export';
import { getCurrentTimestampFormatted, titleize } from '@/lib/formatting';

import {
  ComparisonSkeleton,
  DatabaseEvidenceTab,
  DetailsTab,
  FactorAnalysisTab,
  OverviewTab,
} from './components';
import { ChangeIndicator } from './components/ChangeIndicator';

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
    if (score >= 75) return 'var(--color-success)';
    if (score >= 50) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  const [activeTab, setActiveTab] = useState('overview');

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
      stroke: '#b8916a', // primary - warm brown/tan
      fill: '#b8916a',
      fillOpacity: 0.12,
    },
    {
      dataKey: assessment2.title,
      stroke: '#4a7c59', // secondary - muted sage green
      fill: '#4a7c59',
      fillOpacity: 0.12,
    },
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
    { dataKey: 'Assessment 1', name: assessment1.title, fill: '#b8916a' }, // primary
    { dataKey: 'Assessment 2', name: assessment2.title, fill: '#4a7c59' }, // secondary
  ];

  return (
    <div className="space-y-0 w-full">
      {/* STICKY COMPARISON HEADER */}
      <div className="sticky top-0 z-20 bg-(--color-bg) border-b border-(--color-border) py-4 px-6">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 max-w-7xl mx-auto">
          {/* Left: Assessment 1 */}
          <div>
            <h2 className="font-(--font-display) text-xl text-(--color-text-primary) truncate">
              {assessment1.title}
            </h2>
            <div className="flex items-baseline gap-1 mt-1">
              <span
                className="font-(--font-mono) text-3xl"
                style={{ color: getScoreColor(scoringResult1?.overall_score || 0) }}
              >
                {scoringResult1?.overall_score || 0}
              </span>
              <span className="text-sm text-(--color-text-muted)">/100</span>
            </div>
          </div>
          {/* Center: VS badge */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold tracking-widest uppercase text-(--color-text-muted)">
              vs
            </span>
            {overallDelta !== 0 && <ChangeIndicator diff={overallDelta} />}
          </div>
          {/* Right: Assessment 2 */}
          <div className="text-right">
            <h2 className="font-(--font-display) text-xl text-(--color-text-primary) truncate">
              {assessment2.title}
            </h2>
            <div className="flex items-baseline gap-1 mt-1 justify-end">
              <span
                className="font-(--font-mono) text-3xl"
                style={{ color: getScoreColor(scoringResult2?.overall_score || 0) }}
              >
                {scoringResult2?.overall_score || 0}
              </span>
              <span className="text-sm text-(--color-text-muted)">/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* TAB BAR */}
      <div className="border-b border-(--color-border) mb-8">
        <div className="max-w-7xl mx-auto px-6">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={setActiveTab}
            variant="underlined"
            classNames={{
              tabList: 'gap-6 w-full relative rounded-none p-0 border-b border-(--color-border)',
              cursor: 'w-full bg-(--color-accent) rounded-full',
              tab: 'max-w-fit px-0 h-12',
              tabContent:
                'group-data-[selected=true]:text-(--color-accent) font-semibold text-(--color-text-muted)',
            }}
          >
            <Tab key="overview" title="Overview" />
            <Tab key="factors" title="Factor Analysis" />
            <Tab key="details" title="Details" />
            <Tab key="evidence" title="Database Evidence" />
          </Tabs>
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        {activeTab === 'overview' && (
          <>
            {/* Key Insights - Full Width */}
            {insights && insights.length > 0 && (
              <div className="mb-8">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-(--color-text-primary) mb-2">
                      Key Insights
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {insights.map((insight, idx) => {
                      const IconComponent = insight.icon;
                      return (
                        <div
                          key={idx}
                          className={`flex items-center gap-3 p-4 rounded-lg transition-all duration-200 hover:shadow-md border-l-4 ${
                            insight.type === 'positive'
                              ? 'border-l-(--color-success) bg-(--color-success-soft)'
                              : insight.type === 'negative'
                                ? 'border-l-(--color-error) bg-(--color-error-soft)'
                                : 'border-l-(--color-accent) bg-(--color-accent-soft)'
                          }`}
                        >
                          <IconComponent className="shrink-0" strokeWidth={2.5} size={20} />
                          <p className="text-sm font-medium m-0 text-(--color-text-primary)">
                            {insight.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Assessment Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="border-r border-(--color-border) pr-8">
                <OverviewTab
                  assessment={assessment1}
                  scoringResult={scoringResult1}
                  variant="left"
                />
              </div>
              <div className="pl-8">
                <OverviewTab
                  assessment={assessment2}
                  scoringResult={scoringResult2}
                  variant="right"
                />
              </div>
            </div>
          </>
        )}

        {activeTab === 'factors' && (
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
        )}

        {activeTab === 'details' && (
          <DetailsTab
            assessment1={assessment1}
            assessment2={assessment2}
            scoringResult1={scoringResult1}
            scoringResult2={scoringResult2}
          />
        )}

        {activeTab === 'evidence' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DatabaseEvidenceTab
              assessment={assessment1}
              scoringResult={scoringResult1}
              openResultsDatabaseEvidenceDetailsDrawer={openResultsDatabaseEvidenceDetailsDrawer}
              variant="single"
            />
            <DatabaseEvidenceTab
              assessment={assessment2}
              scoringResult={scoringResult2}
              openResultsDatabaseEvidenceDetailsDrawer={openResultsDatabaseEvidenceDetailsDrawer}
              variant="single"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="w-full px-4 sm:px-8 flex flex-col md:flex-row justify-between items-center gap-4 py-6 border-t-2 border-[rgba(180,160,130,0.18)]">
        <p className="text-[12px] font-medium text-(--color-text-muted)">
          Last updated: {getCurrentTimestampFormatted()}
        </p>
        <div className="flex gap-2">
          <Button variant="primary" onPress={() => exportComparisonCSV([assessment1, assessment2])}>
            <Upload size={16} />
            Export CSV
          </Button>
          <Button variant="tertiary" onPress={handleBack}>
            <ArrowLeft size={16} />
            Back to Assessments
          </Button>
        </div>
      </div>
    </div>
  );
}
