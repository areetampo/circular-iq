import { Button, Card, Chip, Label, ListBox, Select, Tabs } from '@heroui/react';
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
  const [selectedTab, setSelectedTab] = useState('overview');

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

  if (!assessment1 || !assessment2)
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
  const radarChartData = factors.map((factor) => ({
    subject: titleize(factor),
    [assessment1.title]: scoringResult1?.sub_scores?.[factor] || 0,
    [assessment2.title]: scoringResult2?.sub_scores?.[factor] || 0,
    fullMark: 100,
  }));

  const radarConfigs = [
    { dataKey: assessment1.title, stroke: '#10b981', fill: '#10b981', fillOpacity: 0.2 },
    { dataKey: assessment2.title, stroke: '#3b82f6', fill: '#3b82f6', fillOpacity: 0.2 },
  ];

  // Prepare data for Bar Chart (Changes)
  const barChartData = factorDiffs.map((f) => ({
    name: f.label,
    'Assessment 1': f.a1,
    'Assessment 2': f.a2,
    Change: f.diff,
  }));

  const barConfigs = [
    { dataKey: 'Assessment 1', name: assessment1.title, fill: '#10b981' },
    { dataKey: 'Assessment 2', name: assessment2.title, fill: '#3b82f6' },
  ];

  return (
    <div className="space-y-8 w-full">
      {/* Assessment Headers */}
      <div className="w-full px-4 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
          <Card className="border-2 border-emerald-200 shadow-md rounded-xl bg-linear-to-br from-emerald-50/50 to-white hover:shadow-lg transition-all duration-300">
            <Card.Content className="gap-3 p-0">
              <h2 className="text-lg font-bold text-slate-900 wrap-break-word">
                {assessment1.title}
              </h2>
              <p className="text-xs text-slate-600 font-medium italic">
                {formatTimestamp(assessment1.created_at)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Chip color="success" variant="soft" size="sm">
                  Score: {scoringResult1?.overall_score || 0}/100
                </Chip>
                <Chip color="warning" variant="soft" size="sm">
                  Conf: {scoringResult1?.confidence_level || 0}%
                </Chip>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {scoringResult1?.metadata?.industry && (
                  <Chip variant="secondary" size="sm">
                    {scoringResult1.metadata.industry}
                  </Chip>
                )}
                {scoringResult1?.metadata?.scale && (
                  <Chip variant="secondary" size="sm">
                    {scoringResult1.metadata.scale}
                  </Chip>
                )}
                {scoringResult1?.metadata?.r_strategy && (
                  <Chip variant="secondary" size="sm">
                    {scoringResult1.metadata.r_strategy}
                  </Chip>
                )}
              </div>
              <Chip color="success" variant="soft" size="sm" className="w-fit mt-1">
                <Chip.Label className="font-semibold">Assessment 1</Chip.Label>
              </Chip>
            </Card.Content>
          </Card>

          <div className="hidden md:flex items-center justify-center px-4">
            <div className="text-center">
              <Chip
                color="default"
                variant="secondary"
                size="lg"
                className="text-lg font-bold px-5 py-3 bg-linear-to-r from-emerald-100 via-teal-100 to-cyan-100 text-slate-900 shadow-md"
              >
                <Chip.Label>VS</Chip.Label>
              </Chip>
            </div>
          </div>

          <Card className="border-2 border-blue-200 shadow-md rounded-xl bg-linear-to-br from-blue-50/50 to-white hover:shadow-lg transition-all duration-300">
            <Card.Content className="gap-3 p-0">
              <h2 className="text-lg font-bold text-slate-900 wrap-break-word">
                {assessment2.title}
              </h2>
              <p className="text-xs text-slate-600 font-medium italic">
                {formatTimestamp(assessment2.created_at)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Chip color="primary" variant="soft" size="sm">
                  Score: {scoringResult2?.overall_score || 0}/100
                </Chip>
                <Chip color="warning" variant="soft" size="sm">
                  Conf: {scoringResult2?.confidence_level || 0}%
                </Chip>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {scoringResult2?.metadata?.industry && (
                  <Chip variant="secondary" size="sm">
                    {scoringResult2.metadata.industry}
                  </Chip>
                )}
                {scoringResult2?.metadata?.scale && (
                  <Chip variant="secondary" size="sm">
                    {scoringResult2.metadata.scale}
                  </Chip>
                )}
                {scoringResult2?.metadata?.r_strategy && (
                  <Chip variant="secondary" size="sm">
                    {scoringResult2.metadata.r_strategy}
                  </Chip>
                )}
              </div>
              <Chip color="primary" variant="soft" size="sm" className="w-fit mt-1">
                <Chip.Label className="font-semibold">Assessment 2</Chip.Label>
              </Chip>
            </Card.Content>
          </Card>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key)}
        variant="primary"
        className="max-w-7xl mx-auto px-0 sm:px-6 w-full"
      >
        {/* Mobile Select Dropdown */}
        <div className="md:hidden my-4 w-full flex items-center justify-center px-4">
          <Select
            value={selectedTab}
            onChange={setSelectedTab}
            className="w-2/5"
            placeholder="View Section"
          >
            <Label className="text-xs font-semibold text-slate-600">View Section</Label>
            <Select.Trigger className="mt-2">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="overview" textValue="Overview">
                  Overview
                </ListBox.Item>
                <ListBox.Item id="analysis" textValue="Factor Analysis">
                  Factor Analysis
                </ListBox.Item>
                <ListBox.Item id="details" textValue="Details">
                  Details
                </ListBox.Item>
                <ListBox.Item id="evidence" textValue="Database Evidence">
                  Database Evidence
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        {/* Desktop Tabs */}
        <div className="my-4 hidden md:flex justify-center">
          <Tabs.List
            aria-label="Comparison sections"
            className="bg-linear-to-r from-teal-50 to-emerald-50 border-2 border-teal-200 rounded-full shadow-sm *:font-semibold"
          >
            <Tabs.Tab id="overview">Overview</Tabs.Tab>
            <Tabs.Tab id="analysis">Factor Analysis</Tabs.Tab>
            <Tabs.Tab id="details">Details</Tabs.Tab>
            <Tabs.Tab id="evidence">Database Evidence</Tabs.Tab>
          </Tabs.List>
        </div>

        {/* OVERVIEW TAB */}
        <Tabs.Panel id="overview" className="w-full px-0 md:px-4 space-y-8">
          <OverviewTab
            assessment1={assessment1}
            assessment2={assessment2}
            scoringResult1={scoringResult1}
            scoringResult2={scoringResult2}
            insights={insights}
            overallDelta={overallDelta}
            biggestGain={biggestGain}
            biggestDrop={biggestDrop}
            averageDelta={averageDelta}
          />
        </Tabs.Panel>

        {/* ANALYSIS TAB */}
        <Tabs.Panel id="analysis" className="w-full px-0 md:px-4 space-y-8">
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
        </Tabs.Panel>

        {/* DETAILS TAB */}
        <Tabs.Panel id="details" className="w-full px-4 sm:px-8 space-y-8">
          <DetailsTab
            assessment1={assessment1}
            assessment2={assessment2}
            scoringResult1={scoringResult1}
            scoringResult2={scoringResult2}
          />
        </Tabs.Panel>

        {/* DATABASE EVIDENCE TAB */}
        <Tabs.Panel id="evidence" className="w-full px-4 sm:px-8 space-y-8">
          <DatabaseEvidenceTab
            assessment1={assessment1}
            assessment2={assessment2}
            scoringResult1={scoringResult1}
            scoringResult2={scoringResult2}
            openResultsDatabaseEvidenceDetailsDrawer={openResultsDatabaseEvidenceDetailsDrawer}
          />
        </Tabs.Panel>
      </Tabs>

      {/* Footer */}
      <div className="w-full px-4 sm:px-8 flex flex-col md:flex-row justify-between items-center gap-4 py-6 border-t-2 border-slate-200">
        <p className="text-xs text-slate-600 font-medium">
          Last updated: {getCurrentTimestampFormatted()}
        </p>
        <div className="flex gap-2">
          <Button color="success" onClick={() => exportComparisonCSV([assessment1, assessment2])}>
            <Upload size={16} />
            Export CSV
          </Button>
          <Button variant="bordered" onClick={handleBack}>
            <ArrowLeft size={16} />
            Back to Assessments
          </Button>
        </div>
      </div>
    </div>
  );
}
