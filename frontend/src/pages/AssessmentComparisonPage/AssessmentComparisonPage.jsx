import {
  Button,
  Card,
  Chip,
  Label,
  ListBox,
  ProgressBar,
  Select,
  Skeleton,
  Table,
  Tabs,
} from '@heroui/react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  CheckCircle2,
  Dumbbell,
  FileText,
  Frown,
  GitCompare,
  Lightbulb,
  Minus,
  Search,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Upload,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import BarChart from '@/components/charts/BarChart';
import RadarChart from '@/components/charts/RadarChart';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useAssessmentComparison } from '@/features/assessments';
import { reconstructScoringResult } from '@/features/assessments/utils';
import { exportComparisonCSV } from '@/features/export';
import { formatTimestamp, getCurrentTimestampFormatted, titleize } from '@/lib/formatting';
import { formatFactorName, getRiskBadgeColor } from '@/lib/scoring';
import { categorizeIntegrityGaps } from '@/utils/content';

// Skeleton Loader Component
function ComparisonSkeleton() {
  return (
    <div className="space-y-6 mt-4 w-full">
      {/* Header Skeleton */}
      <div className="w-full px-4 sm:px-8">
        <div className="flex items-center justify-center gap-4">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>

      {/* Assessment Headers Skeleton */}
      <div className="w-full px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-center">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="hidden lg:block h-16 w-16 rounded-full mx-auto" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="w-full px-4 sm:px-8">
        <div className="flex justify-center mb-6">
          <Skeleton className="h-12 w-96 rounded-xl" />
        </div>

        {/* Content Cards Skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssessmentComparisonPage() {
  const [searchParams] = useSearchParams();
  const [selectedTab, setSelectedTab] = useState('overview');
  const id1 = searchParams.get('id1');
  const id2 = searchParams.get('id2');
  const navigate = useNavigate();

  const { assessment1, assessment2, comparisonData, isLoading, isError, error } =
    useAssessmentComparison(id1, id2);

  const { openResultsDatabaseEvidenceDetailsDrawer } = useGlobalDrawer();

  const handleBack = () => {
    navigate('/assessments');
  };

  if (!id1 || !id2) {
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
        title="Error Loading Assessments"
        message={error || 'Failed to load assessment data. Please try again.'}
        actions={[
          {
            label: 'Back to Assessments',
            icon: ArrowLeft,
            onClick: () => navigate('/assessments'),
            variant: 'tertiary',
          },
        ]}
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

  const getDeltaColor = (delta) => {
    if (delta > 0) return 'success';
    if (delta < 0) return 'danger';
    return 'default';
  };

  const renderChangeIndicator = (diff) => {
    if (diff > 0) {
      return (
        <Chip color="success" variant="soft" size="sm" className="transition-all duration-200">
          <TrendingUp size={14} />
          <Chip.Label>+{diff}</Chip.Label>
        </Chip>
      );
    } else if (diff < 0) {
      return (
        <Chip color="danger" variant="soft" size="sm" className="transition-all duration-200">
          <TrendingDown size={14} />
          <Chip.Label>{diff}</Chip.Label>
        </Chip>
      );
    }
    return (
      <Chip color="default" variant="soft" size="sm" className="transition-all duration-200">
        <Minus size={14} />
        <Chip.Label>0</Chip.Label>
      </Chip>
    );
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
              <Select.Icon />
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
          {/* Input Data Comparison */}
          <Card className="border-2 border-indigo-200 shadow-md rounded-xl bg-linear-to-br from-indigo-50/30 to-white">
            <Card.Header className="flex items-center gap-3 pb-4">
              <div className="p-2.5 rounded-lg bg-linear-to-br from-indigo-100 to-indigo-200">
                <Lightbulb className="text-indigo-700" size={20} />
              </div>
              <Card.Title className="font-bold text-lg text-slate-900">
                Input Data & Context
              </Card.Title>
            </Card.Header>
            <Card.Content className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Business Problem */}
                <Card className="border-2 border-indigo-200 shadow-md rounded-xl bg-white">
                  <Card.Header className="flex items-center gap-3 pb-4">
                    <Card.Title className="font-bold text-lg text-slate-900">
                      Business Problem
                    </Card.Title>
                  </Card.Header>
                  <Card.Content className="p-0">
                    <Table>
                      <Table
                        aria-label="Business problem comparison"
                        removeWrapper
                        classNames={{
                          th: 'bg-linear-to-r from-slate-50 to-slate-100 font-bold text-slate-700',
                          td: 'align-top py-4',
                        }}
                      >
                        <Table.Header>
                          <Table.Column className="w-1/2">Assessment 1</Table.Column>
                          <Table.Column className="w-1/2">Assessment 2</Table.Column>
                        </Table.Header>
                        <Table.Body>
                          <Table.Row className="hover:bg-slate-50/50 transition-colors duration-150">
                            <Table.Cell>
                              <div>
                                <p className="text-sm font-semibold text-slate-900 mb-2">
                                  {assessment1?.title || 'Assessment 1'}
                                </p>
                                <p className="text-sm text-slate-700 leading-relaxed">
                                  {assessment1?.business_problem || 'N/A'}
                                </p>
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <div>
                                <p className="text-sm font-semibold text-slate-900 mb-2">
                                  {assessment2?.title || 'Assessment 2'}
                                </p>
                                <p className="text-sm text-slate-700 leading-relaxed">
                                  {assessment2?.business_problem || 'N/A'}
                                </p>
                              </div>
                            </Table.Cell>
                          </Table.Row>
                        </Table.Body>
                      </Table>
                    </Table>
                  </Card.Content>
                </Card>

                {/* Business Solution */}
                <Card className="border-2 border-indigo-200 shadow-md rounded-xl bg-white">
                  <Card.Header className="flex items-center gap-3 pb-4">
                    <Card.Title className="font-bold text-lg text-slate-900">
                      Business Solution
                    </Card.Title>
                  </Card.Header>
                  <Card.Content className="p-0">
                    <Table
                      aria-label="Business solution comparison"
                      removeWrapper
                      classNames={{
                        th: 'bg-linear-to-r from-slate-50 to-slate-100 font-bold text-slate-700',
                        td: 'py-4',
                      }}
                    >
                      <Table.Header>
                        <Table.Column className="w-1/2">Assessment 1</Table.Column>
                        <Table.Column className="w-1/2">Assessment 2</Table.Column>
                      </Table.Header>
                      <Table.Body>
                        <Table.Row className="hover:bg-slate-50/50 transition-colors duration-150">
                          <Table.Cell className="align-top">
                            <div>
                              <p className="text-sm font-semibold text-slate-900 mb-2">
                                {assessment1?.title || 'Assessment 1'}
                              </p>
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {assessment1?.business_solution || 'N/A'}
                              </p>
                            </div>
                          </Table.Cell>
                          <Table.Cell className="align-top">
                            <div>
                              <p className="text-sm font-semibold text-slate-900 mb-2">
                                {assessment2?.title || 'Assessment 2'}
                              </p>
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {assessment2?.business_solution || 'N/A'}
                              </p>
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      </Table.Body>
                    </Table>
                  </Card.Content>
                </Card>
              </div>

              {/* Derived Metrics Comparison */}
              <Card className="border-2 border-emerald-200 shadow-md rounded-xl bg-white">
                <Card.Header className="flex items-center gap-3 pb-4">
                  <Card.Title className="font-bold text-lg text-slate-900">
                    Derived Metrics
                  </Card.Title>
                </Card.Header>
                <Card.Content className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
                    {[
                      { key: 'technical_feasibility', label: 'Technical Feasibility' },
                      { key: 'economic_viability', label: 'Economic Viability' },
                      { key: 'circularity_potential', label: 'Circularity Potential' },
                    ].map(({ key, label }) => {
                      const val1 = scoringResult1?.derived_metrics?.[key] || 0;
                      const val2 = scoringResult2?.derived_metrics?.[key] || 0;
                      const winner = val1 > val2 ? 1 : val2 > val1 ? 2 : null;
                      return (
                        <div key={key} className="p-3 bg-slate-50 rounded-lg">
                          <div className="text-xs font-bold text-slate-900 mb-2">{label}</div>
                          <div className="flex items-center justify-between">
                            <div
                              className={`text-sm font-bold ${winner === 1 ? 'text-green-700' : 'text-slate-600'}`}
                            >
                              A1: {val1}
                            </div>
                            <div
                              className={`text-sm font-bold ${winner === 2 ? 'text-green-700' : 'text-slate-600'}`}
                            >
                              A2: {val2}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs font-bold text-slate-900 mb-2">Risk Level</div>
                      <div className="flex items-center justify-between">
                        <Chip
                          variant="soft"
                          className={`text-xs ${getRiskBadgeColor(scoringResult1?.derived_metrics?.risk_level)}`}
                        >
                          A1: {scoringResult1?.derived_metrics?.risk_level || 'N/A'}
                        </Chip>
                        <Chip
                          variant="soft"
                          className={`text-xs ${getRiskBadgeColor(scoringResult2?.derived_metrics?.risk_level)}`}
                        >
                          A2: {scoringResult2?.derived_metrics?.risk_level || 'N/A'}
                        </Chip>
                      </div>
                    </div>
                  </div>
                </Card.Content>
              </Card>

              {/* Evaluation Parameters Summary */}
              <Card className="border-2 border-indigo-200 shadow-md rounded-xl bg-white">
                <Card.Header className="flex items-center gap-3 pb-4">
                  <Card.Title className="font-bold text-lg text-slate-900">
                    Evaluation Parameters
                  </Card.Title>
                </Card.Header>
                <Card.Content className="p-0 overflow-x-auto">
                  <Table
                    aria-label="Evaluation parameters comparison"
                    removeWrapper
                    classNames={{
                      th: 'bg-linear-to-r from-slate-50 to-slate-100 font-bold text-slate-700',
                      td: 'py-3',
                    }}
                  >
                    <Table.Header>
                      <Table.Column className="w-2/5">PARAMETER</Table.Column>
                      <Table.Column className="text-center w-1.5/5">
                        {assessment1?.title || 'Assessment 1'}
                      </Table.Column>
                      <Table.Column className="text-center w-1.5/5">
                        {assessment2?.title || 'Assessment 2'}
                      </Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {Object.entries(
                        assessment1?.evaluation_parameters ||
                          assessment1?.result_json?.evaluation_parameters ||
                          {},
                      ).map(([key, value1]) => {
                        const value2 =
                          assessment2?.evaluation_parameters?.[key] ||
                          assessment2?.result_json?.evaluation_parameters?.[key];
                        return (
                          <Table.Row
                            key={key}
                            className="hover:bg-slate-50/50 transition-colors duration-150"
                          >
                            <Table.Cell className="font-medium text-slate-900 capitalize">
                              {key.replace(/_/g, ' ')}
                            </Table.Cell>
                            <Table.Cell className="text-center text-slate-600">
                              {String(value1).substring(0, 30)}
                              {String(value1).length > 30 ? '...' : ''}
                            </Table.Cell>
                            <Table.Cell className="text-center text-slate-600">
                              {String(value2 || '').substring(0, 30)}
                              {String(value2 || '').length > 30 ? '...' : ''}
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table>
                </Card.Content>
              </Card>

              {/* Business Context Comparison */}
              <Card className="border-2 border-amber-200 shadow-md rounded-xl bg-white">
                <Card.Header className="flex items-center gap-3 pb-4">
                  <Card.Title className="font-bold text-lg text-slate-900">
                    Business Context
                  </Card.Title>
                </Card.Header>
                <Card.Content className="p-0 overflow-x-auto">
                  <Table
                    aria-label="Business context comparison"
                    removeWrapper
                    classNames={{
                      th: 'bg-linear-to-r from-slate-50 to-slate-100 font-bold text-slate-700',
                      td: 'py-3',
                    }}
                  >
                    <Table.Header>
                      <Table.Column className="w-2/5">CONTEXT FIELD</Table.Column>
                      <Table.Column className="text-center w-1.5/5">
                        {assessment1?.title || 'Assessment 1'}
                      </Table.Column>
                      <Table.Column className="text-center w-1.5/5">
                        {assessment2?.title || 'Assessment 2'}
                      </Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {(() => {
                        const ctx1 =
                          assessment1?.result_json?.business_context ||
                          assessment1?.business_context ||
                          {};
                        const ctx2 =
                          assessment2?.result_json?.business_context ||
                          assessment2?.business_context ||
                          {};
                        const allKeys = new Set([...Object.keys(ctx1), ...Object.keys(ctx2)]);

                        if (allKeys.size === 0) {
                          return (
                            <Table.Row>
                              <Table.Cell colSpan={3} className="text-center text-slate-500 py-6">
                                No business context data available
                              </Table.Cell>
                            </Table.Row>
                          );
                        }

                        return Array.from(allKeys).map((key) => {
                          const value1 = ctx1[key];
                          const value2 = ctx2[key];
                          const val1Str =
                            value1 === null || value1 === undefined
                              ? 'Not specified'
                              : typeof value1 === 'boolean'
                                ? value1
                                  ? 'Yes'
                                  : 'No'
                                : String(value1);
                          const val2Str =
                            value2 === null || value2 === undefined
                              ? 'Not specified'
                              : typeof value2 === 'boolean'
                                ? value2
                                  ? 'Yes'
                                  : 'No'
                                : String(value2);

                          return (
                            <Table.Row
                              key={key}
                              className={`hover:bg-slate-50/50 transition-colors duration-150 ${
                                val1Str === val2Str ? '' : 'bg-yellow-50/30'
                              }`}
                            >
                              <Table.Cell className="font-medium text-slate-900 capitalize">
                                {key.replace(/_/g, ' ')}
                              </Table.Cell>
                              <Table.Cell
                                className={`text-center text-slate-600 ${val1Str === val2Str ? '' : 'font-semibold text-amber-700'}`}
                              >
                                {val1Str.substring(0, 30)}
                                {val1Str.length > 30 ? '...' : ''}
                              </Table.Cell>
                              <Table.Cell
                                className={`text-center text-slate-600 ${val1Str === val2Str ? '' : 'font-semibold text-amber-700'}`}
                              >
                                {val2Str.substring(0, 30)}
                                {val2Str.length > 30 ? '...' : ''}
                              </Table.Cell>
                            </Table.Row>
                          );
                        });
                      })()}
                    </Table.Body>
                  </Table>
                </Card.Content>
              </Card>
            </Card.Content>
          </Card>

          {/* Key Insights */}
          {insights && insights.length > 0 && (
            <Card className="border-2 border-teal-200 shadow-md rounded-xl bg-linear-to-br from-teal-50/30 to-white">
              <Card.Header className="flex items-center gap-3 pb-4">
                <div className="p-2.5 rounded-lg bg-linear-to-br from-teal-100 to-teal-200">
                  <Lightbulb className="text-teal-700" size={20} />
                </div>
                <Card.Title className="font-bold text-lg text-slate-900">Key Insights</Card.Title>
              </Card.Header>
              <Card.Content className="gap-3 flex flex-col">
                {insights.map((insight, idx) => {
                  const IconComponent = insight.icon;
                  const colorClass =
                    insight.type === 'positive'
                      ? 'bg-linear-to-r from-emerald-50 to-green-50 border-l-emerald-500 text-emerald-700'
                      : insight.type === 'negative'
                        ? 'bg-linear-to-r from-red-50 to-orange-50 border-l-red-500 text-red-700'
                        : 'bg-linear-to-r from-slate-50 to-gray-50 border-l-slate-400 text-slate-700';

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-4 rounded-lg border-l-4 ${colorClass} transition-all duration-200 hover:shadow-md`}
                    >
                      <IconComponent className="shrink-0" strokeWidth={2.5} size={20} />
                      <p className="text-sm font-medium m-0">{insight.text}</p>
                    </div>
                  );
                })}
              </Card.Content>
            </Card>
          )}

          {/* Executive Summary & Score Highlights */}
          <Card className="border-2 border-purple-200 shadow-md rounded-xl bg-linear-to-br from-purple-50/30 to-white">
            <Card.Header className="flex items-center gap-3 pb-4">
              <div className="p-2.5 rounded-lg bg-linear-to-br from-purple-100 to-purple-200">
                <Lightbulb className="text-purple-700" size={20} />
              </div>
              <Card.Title className="font-bold text-lg text-slate-900">
                Executive Summary
              </Card.Title>
            </Card.Header>
            <Card.Content className="space-y-6">
              {/* Audit Verdicts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[
                  { sr: scoringResult1, assessment: assessment1, color: 'emerald' },
                  { sr: scoringResult2, assessment: assessment2, color: 'blue' },
                ].map(({ sr, assessment, color }) => {
                  const borderColor =
                    color === 'emerald' ? 'border-emerald-500' : 'border-blue-500';
                  const bgColor = color === 'emerald' ? 'bg-emerald-50' : 'bg-blue-50';
                  return (
                    <div
                      key={assessment.id}
                      className={`p-5 pl-4 border-l-4 ${borderColor} ${bgColor} rounded-r-lg hover:shadow-md transition-all duration-200`}
                    >
                      <p
                        className={`text-sm font-bold ${color === 'emerald' ? 'text-emerald-700' : 'text-blue-700'} uppercase mb-2 tracking-wide`}
                      >
                        {assessment.title}
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {sr?.audit?.audit_verdict || 'No verdict available'}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Comparative Analysis */}
              {(scoringResult1?.audit?.comparative_analysis ||
                scoringResult2?.audit?.comparative_analysis) && (
                <div className="p-5 pl-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
                  <p className="text-xs font-semibold text-blue-900 uppercase mb-2 tracking-wide">
                    Key Findings
                  </p>
                  <div className="space-y-3">
                    {[
                      { sr: scoringResult1, assessment: assessment1 },
                      { sr: scoringResult2, assessment: assessment2 },
                    ].map(
                      ({ sr, assessment }) =>
                        sr?.audit?.comparative_analysis && (
                          <div key={assessment.id}>
                            <p className="text-xs font-semibold text-slate-700 mb-1">
                              {assessment.title}
                            </p>
                            <p className="text-sm text-slate-700 leading-relaxed">
                              {sr.audit.comparative_analysis}
                            </p>
                          </div>
                        ),
                    )}
                  </div>
                </div>
              )}

              {/* Score Highlights */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-4">Score Highlights</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[
                    { sr: scoringResult1, assessment: assessment1, color: 'emerald' },
                    { sr: scoringResult2, assessment: assessment2, color: 'blue' },
                  ].map(({ sr, assessment, color }) => {
                    const subScores = sr?.sub_scores || {};
                    const topFactor = Object.entries(subScores).reduce(
                      (a, b) => (b[1] > a[1] ? b : a),
                      ['N/A', 0],
                    );
                    const focusFactor = Object.entries(subScores).reduce(
                      (a, b) => (b[1] < a[1] ? b : a),
                      ['N/A', 0],
                    );
                    const avgScore =
                      Object.values(subScores).length > 0
                        ? Math.round(
                            Object.values(subScores).reduce((a, b) => a + b, 0) /
                              Object.values(subScores).length,
                          )
                        : 0;

                    const borderColor =
                      color === 'emerald' ? 'border-emerald-300' : 'border-blue-300';
                    const bgCard = color === 'emerald' ? 'bg-emerald-50/50' : 'bg-blue-50/50';

                    return (
                      <div
                        key={assessment.id}
                        className={`p-4 rounded-lg border-2 ${borderColor} ${bgCard} space-y-4`}
                      >
                        <p
                          className={`text-xs font-bold ${color === 'emerald' ? 'text-emerald-900' : 'text-blue-900'} uppercase tracking-wide`}
                        >
                          {assessment.title}
                        </p>

                        <div className="space-y-3">
                          {/* Strongest Factor */}
                          <div className="p-3 bg-white rounded-lg border border-slate-200">
                            <p className="text-xs font-semibold text-slate-600 mb-1">
                              Strongest Factor
                            </p>
                            <p
                              className={`text-lg font-bold ${color === 'emerald' ? 'text-emerald-700' : 'text-blue-700'}`}
                            >
                              {topFactor[0] !== 'N/A' ? titleize(topFactor[0]) : 'N/A'}
                            </p>
                            <p className="text-sm text-slate-600 font-semibold">
                              {topFactor[0] !== 'N/A' ? `${topFactor[1]}/100` : '—'}
                            </p>
                          </div>

                          {/* Focus Area */}
                          <div className="p-3 bg-white rounded-lg border border-slate-200">
                            <p className="text-xs font-semibold text-slate-600 mb-1">Focus Area</p>
                            <p className="text-lg font-bold text-orange-700">
                              {focusFactor[0] !== 'N/A' ? titleize(focusFactor[0]) : 'N/A'}
                            </p>
                            <p className="text-sm text-slate-600 font-semibold">
                              {focusFactor[0] !== 'N/A' ? `${focusFactor[1]}/100` : '—'}
                            </p>
                          </div>

                          {/* Average Score */}
                          <div className="p-3 bg-white rounded-lg border border-slate-200">
                            <p className="text-xs font-semibold text-slate-600 mb-1">
                              Average Score
                            </p>
                            <p className="text-lg font-bold text-purple-700">{avgScore}/100</p>
                            <ProgressBar
                              value={avgScore}
                              className="mt-2 h-2 rounded-full bg-purple-500"
                              aria-label={`${assessment.title} average score`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Change Snapshot */}
          <Card className="border-2 border-orange-200 shadow-md rounded-xl bg-linear-to-br from-orange-50/30 to-white">
            <Card.Header className="flex items-center gap-3 pb-4">
              <div className="p-2.5 rounded-lg bg-linear-to-br from-orange-100 to-orange-200">
                <Target className="text-orange-700" size={20} />
              </div>
              <Card.Title className="font-bold text-lg text-slate-900">
                Scores & Change Snapshot
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Assessment 1 Score */}
                <div className="p-5 bg-linear-to-br from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                  <p className="text-xs text-slate-600 mb-2 font-semibold uppercase tracking-wide truncate">
                    {assessment1.title}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-bold ${
                        (scoringResult1?.overall_score || 0) >= 75
                          ? 'text-emerald-700'
                          : (scoringResult1?.overall_score || 0) >= 50
                            ? 'text-amber-600'
                            : 'text-red-600'
                      }`}
                    >
                      {scoringResult1?.overall_score || 0}
                    </span>
                    <span className="text-sm text-slate-500 font-medium">/100</span>
                  </div>
                  <ProgressBar
                    value={scoringResult1?.overall_score || 0}
                    className={`mt-2 h-2 rounded-full ${
                      (scoringResult1?.overall_score || 0) >= 75
                        ? 'bg-emerald-500'
                        : (scoringResult1?.overall_score || 0) >= 50
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                    }`}
                    aria-label="Assessment 1 score"
                  />
                </div>

                {/* Assessment 2 Score */}
                <div className="p-5 bg-linear-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                  <p className="text-xs text-slate-600 mb-2 font-semibold uppercase tracking-wide truncate">
                    {assessment2.title}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-bold ${
                        (scoringResult2?.overall_score || 0) >= 75
                          ? 'text-emerald-700'
                          : (scoringResult2?.overall_score || 0) >= 50
                            ? 'text-amber-600'
                            : 'text-red-600'
                      }`}
                    >
                      {scoringResult2?.overall_score || 0}
                    </span>
                    <span className="text-sm text-slate-500 font-medium">/100</span>
                  </div>
                  <ProgressBar
                    value={scoringResult2?.overall_score || 0}
                    className={`mt-2 h-2 rounded-full ${
                      (scoringResult2?.overall_score || 0) >= 75
                        ? 'bg-emerald-500'
                        : (scoringResult2?.overall_score || 0) >= 50
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                    }`}
                    aria-label="Assessment 2 score"
                  />
                </div>

                {/* Overall Change */}
                <div className="p-5 bg-linear-to-br from-slate-50 to-white border-2 border-slate-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                  <p className="text-xs text-slate-600 mb-2 font-semibold uppercase tracking-wide">
                    Overall Change
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-bold ${
                        overallDelta > 0
                          ? 'text-emerald-600'
                          : overallDelta < 0
                            ? 'text-red-600'
                            : 'text-slate-500'
                      }`}
                    >
                      {overallDelta > 0 ? '+' : ''}
                      {overallDelta}
                    </span>
                    <span className="text-sm text-slate-500 font-medium">pts</span>
                  </div>
                </div>

                {biggestGain && (
                  <div className="p-5 bg-linear-to-br from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                    <p className="text-xs text-slate-600 mb-2 font-semibold uppercase tracking-wide">
                      Biggest Gain
                    </p>
                    <p className="text-4xl font-bold text-emerald-700">+{biggestGain.diff}</p>
                    <p className="text-xs text-slate-600 truncate mt-1 font-medium">
                      {biggestGain.label}
                    </p>
                  </div>
                )}

                {biggestDrop && (
                  <div className="p-5 bg-linear-to-br from-red-50 to-orange-50 border-2 border-red-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                    <p className="text-xs text-slate-600 mb-2 font-semibold uppercase tracking-wide">
                      Biggest Drop
                    </p>
                    <p className="text-4xl font-bold text-red-700">{biggestDrop.diff}</p>
                    <p className="text-xs text-slate-600 truncate mt-1 font-medium">
                      {biggestDrop.label}
                    </p>
                  </div>
                )}

                <div className="p-5 bg-linear-to-br from-purple-50 to-violet-50 border-2 border-purple-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                  <p className="text-xs text-slate-600 mb-2 font-semibold uppercase tracking-wide">
                    Avg Change
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-bold ${
                        averageDelta > 0
                          ? 'text-emerald-600'
                          : averageDelta < 0
                            ? 'text-red-600'
                            : 'text-slate-500'
                      }`}
                    >
                      {averageDelta > 0 ? '+' : ''}
                      {averageDelta}
                    </span>
                    <span className="text-sm text-slate-500 font-medium">pts</span>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Score Breakdown Comparison */}
          {scoringResult1?.score_breakdown && scoringResult2?.score_breakdown && (
            <Card className="border-2 border-purple-200 shadow-md rounded-xl bg-white">
              <Card.Header className="flex items-center gap-3 pb-4">
                <Card.Title className="font-bold text-lg text-slate-900">
                  Score Breakdown
                </Card.Title>
              </Card.Header>
              <Card.Content className="p-0">
                <div className="space-y-4 p-4">
                  {Object.keys(scoringResult1.score_breakdown).map((category) => {
                    const data1 = scoringResult1.score_breakdown[category];
                    const data2 = scoringResult2.score_breakdown[category];
                    return (
                      <div key={category} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-bold text-slate-900">{category}</div>
                          <div className="flex gap-4">
                            <div className="text-sm font-bold text-emerald-700">
                              A1: {data1.score}
                            </div>
                            <div className="text-sm font-bold text-blue-700">A2: {data2.score}</div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-600 mb-2">{data1.weight}</div>
                        <div className="flex gap-4">
                          <ProgressBar value={data1.score} className="flex-1 h-2" color="success" />
                          <ProgressBar value={data2.score} className="flex-1 h-2" color="primary" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card.Content>
            </Card>
          )}
        </Tabs.Panel>

        {/* ANALYSIS TAB */}
        <Tabs.Panel id="analysis" className="w-full px-0 md:px-4 space-y-8">
          {/* Visual Comparison Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <Card className="border-2 border-blue-200 shadow-md rounded-xl bg-linear-to-br from-blue-50/30 to-white">
              <Card.Header className="flex items-center gap-3 pb-0">
                <div className="p-2.5 rounded-lg bg-linear-to-br from-blue-100 to-blue-200">
                  <GitCompare className="text-blue-700" size={20} />
                </div>
                <Card.Title className="font-bold text-lg text-slate-900">
                  Factor Comparison (Radar)
                </Card.Title>
              </Card.Header>
              <Card.Content className="pb-4">
                <div className="h-100 p-4 bg-white rounded-lg">
                  <RadarChart
                    data={radarChartData}
                    radarConfigs={radarConfigs}
                    height={400}
                    showLegend
                    showTooltip
                  />
                </div>
              </Card.Content>
            </Card>

            {/* Bar Chart */}
            <Card className="border-2 border-purple-200 shadow-md rounded-xl bg-linear-to-br from-purple-50/30 to-white">
              <Card.Header className="flex items-center gap-3 pb-0">
                <div className="p-2.5 rounded-lg bg-linear-to-br from-purple-100 to-purple-200">
                  <BarChart3 className="text-purple-700" size={20} />
                </div>
                <Card.Title className="font-bold text-lg text-slate-900">
                  Score Comparison (Bar)
                </Card.Title>
              </Card.Header>
              <Card.Content className="pb-4">
                <div className="h-100 p-4 bg-white rounded-lg">
                  <BarChart
                    data={barChartData}
                    barConfigs={barConfigs}
                    height={400}
                    showLegend
                    showGrid
                    yAxisLabel="Score"
                  />
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Detailed Factor Progress */}
          <Card className="border-2 border-indigo-200 shadow-md rounded-xl bg-linear-to-br from-indigo-50/30 to-white">
            <Card.Header className="flex items-center gap-3 pb-0">
              <div className="p-2.5 rounded-lg bg-linear-to-br from-indigo-100 to-indigo-200">
                <Zap className="text-indigo-700" size={20} />
              </div>
              <Card.Title className="font-bold text-lg text-slate-900">
                Detailed Factor Analysis
              </Card.Title>
            </Card.Header>
            <Card.Content className="gap-4">
              {factorDiffs.map((factor) => (
                <div
                  key={factor.factor}
                  className="space-y-3 pb-4 border-b border-slate-200 last:border-0 hover:bg-slate-50/50 p-3 rounded-lg transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">{factor.label}</h4>
                    <div className="flex items-center gap-2">
                      <Chip
                        color={getScoreColor(factor.a1)}
                        variant="soft"
                        size="sm"
                        className="transition-all duration-200"
                      >
                        <Chip.Label className="font-semibold">{factor.a1}</Chip.Label>
                      </Chip>
                      <ArrowRight className="text-slate-400" size={12} />
                      <Chip
                        color={getScoreColor(factor.a2)}
                        variant="soft"
                        size="sm"
                        className="transition-all duration-200"
                      >
                        <Chip.Label className="font-semibold">{factor.a2}</Chip.Label>
                      </Chip>
                      {renderChangeIndicator(factor.diff)}
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 space-y-1">
                      <div className="text-xs text-emerald-700 font-semibold">
                        {assessment1.title}
                      </div>
                      <ProgressBar
                        value={factor.a1}
                        className="h-2.5 rounded-full bg-emerald-500"
                        aria-label={`${assessment1.title} factor score`}
                      />
                    </div>
                    <span className="text-xs text-emerald-700 font-bold w-10 text-right">
                      {factor.a1}%
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 space-y-1">
                      <div className="text-xs text-amber-600 font-semibold">
                        {assessment2.title}
                      </div>
                      <ProgressBar
                        value={factor.a2}
                        className="h-2.5 rounded-full bg-amber-500"
                        aria-label={`${assessment2.title} factor score`}
                      />
                    </div>
                    <span className="text-xs text-amber-600 font-bold w-10 text-right">
                      {factor.a2}%
                    </span>
                  </div>
                </div>
              ))}
            </Card.Content>
          </Card>

          {/* Factor-by-Factor Table */}
          <Card className="border-2 border-cyan-200 shadow-md rounded-xl bg-linear-to-br from-cyan-50/30 to-white">
            <Card.Header className="flex gap-3 items-center pb-3">
              <div className="p-2.5 rounded-lg bg-linear-to-br from-cyan-100 to-cyan-200">
                <Search className="text-cyan-700" size={20} />
              </div>
              <Card.Title className="font-bold text-lg text-slate-900">
                Factor-by-Factor Comparison
              </Card.Title>
            </Card.Header>
            <Card.Content className="p-0">
              <Table
                aria-label="Factor comparison table"
                removeWrapper
                classNames={{
                  th: 'bg-linear-to-r from-slate-50 to-slate-100 font-bold text-slate-700',
                  td: 'py-4',
                }}
              >
                <Table.Header>
                  <Table.Column className="w-[35%]">FACTOR</Table.Column>
                  <Table.Column className="text-center">{assessment1.title}</Table.Column>
                  <Table.Column className="text-center">{assessment2.title}</Table.Column>
                  <Table.Column className="text-center">CHANGE</Table.Column>
                </Table.Header>
                <Table.Body>
                  {Object.entries(scoringResult1?.sub_scores || {}).map(([factor, val1]) => {
                    const val2 = scoringResult2?.sub_scores?.[factor] || 0;
                    const diff = val2 - val1;
                    return (
                      <Table.Row
                        key={factor}
                        className="hover:bg-slate-50/50 transition-colors duration-150"
                      >
                        <Table.Cell className="font-semibold text-slate-900">
                          {titleize(factor)}
                        </Table.Cell>
                        <Table.Cell className="text-center">
                          <Chip
                            color={getScoreColor(val1)}
                            variant="soft"
                            size="md"
                            className="transition-all duration-200"
                          >
                            <Chip.Label className="font-bold">{val1}</Chip.Label>
                          </Chip>
                        </Table.Cell>
                        <Table.Cell className="text-center">
                          <Chip
                            color={getScoreColor(val2)}
                            variant="soft"
                            size="md"
                            className="transition-all duration-200"
                          >
                            <Chip.Label className="font-bold">{val2}</Chip.Label>
                          </Chip>
                        </Table.Cell>
                        <Table.Cell className="text-center">
                          {renderChangeIndicator(diff)}
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table>
            </Card.Content>
          </Card>

          {/* Integrity Analysis */}
          {(scoringResult1?.audit?.integrity_gaps || scoringResult2?.audit?.integrity_gaps) && (
            <Card className="border-2 border-red-200 shadow-md rounded-xl bg-linear-to-br from-red-50/30 to-white">
              <Card.Header className="flex items-center gap-3 pb-4">
                <div className="p-2.5 rounded-lg bg-linear-to-br from-red-100 to-red-200">
                  <AlertTriangle className="text-red-700" size={20} />
                </div>
                <Card.Title className="font-bold text-lg text-slate-900">
                  Integrity Analysis
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[
                    { sr: scoringResult1, assessment: assessment1, color: 'emerald' },
                    { sr: scoringResult2, assessment: assessment2, color: 'blue' },
                  ].map(({ sr, assessment, color }) => {
                    const gaps = sr?.audit?.integrity_gaps || [];
                    const { strengths, gaps: gapsOnly } = categorizeIntegrityGaps(gaps);

                    return (
                      <Card key={assessment.id} className="border border-slate-200 bg-white">
                        <Card.Header className="pb-3">
                          <Card.Title className="font-bold text-slate-900">
                            {assessment.title}
                          </Card.Title>
                        </Card.Header>
                        <Card.Content className="space-y-4">
                          {/* Strengths Validated */}
                          {strengths.length > 0 && (
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 mb-3">
                                Strengths Validated ({strengths.length})
                              </h4>
                              <div className="space-y-2">
                                {strengths.map((strength, i) => (
                                  <div
                                    key={i}
                                    className="p-3 bg-green-50 border border-green-200 rounded-lg"
                                  >
                                    <div className="flex items-start gap-2">
                                      <CheckCircle2
                                        className="text-green-700 shrink-0 mt-0.5"
                                        size={16}
                                      />
                                      <div className="flex-1">
                                        <p className="text-sm font-semibold text-slate-900">
                                          {strength.gap}
                                        </p>
                                        {strength.severity && (
                                          <Chip
                                            variant="soft"
                                            size="sm"
                                            className={`text-xs mt-1 ${
                                              strength.severity === 'high'
                                                ? 'text-green-700 bg-green-100'
                                                : strength.severity === 'medium'
                                                  ? 'text-blue-700 bg-blue-100'
                                                  : 'text-slate-600 bg-slate-100'
                                            }`}
                                          >
                                            {strength.severity}
                                          </Chip>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Areas for Improvement */}
                          {gapsOnly.length > 0 && (
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 mb-3">
                                Areas for Improvement ({gapsOnly.length})
                              </h4>
                              <div className="space-y-2">
                                {gapsOnly.map((gap, i) => (
                                  <div
                                    key={i}
                                    className={`p-3 border rounded-lg ${
                                      gap.severity === 'high'
                                        ? 'bg-red-50 border-red-200'
                                        : gap.severity === 'medium'
                                          ? 'bg-amber-50 border-amber-200'
                                          : 'bg-blue-50 border-blue-200'
                                    }`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <AlertTriangle
                                        className={`shrink-0 mt-0.5 ${
                                          gap.severity === 'high'
                                            ? 'text-red-700'
                                            : gap.severity === 'medium'
                                              ? 'text-amber-700'
                                              : 'text-blue-700'
                                        }`}
                                        size={16}
                                      />
                                      <div className="flex-1">
                                        <p className="text-sm font-semibold text-slate-900">
                                          {gap.gap}
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-1.5">
                                          <Chip
                                            variant="soft"
                                            size="sm"
                                            className={`text-xs ${
                                              gap.severity === 'high'
                                                ? 'text-red-700 bg-red-100'
                                                : gap.severity === 'medium'
                                                  ? 'text-amber-700 bg-amber-100'
                                                  : 'text-blue-700 bg-blue-100'
                                            }`}
                                          >
                                            {gap.severity || 'medium'}
                                          </Chip>
                                          {gap.evidence_source_id && (
                                            <Chip
                                              variant="soft"
                                              size="sm"
                                              className="text-xs text-slate-600 bg-slate-100"
                                            >
                                              ID: {gap.evidence_source_id}
                                            </Chip>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {strengths.length === 0 && gapsOnly.length === 0 && (
                            <div className="p-4 text-center text-slate-500 text-sm">
                              No integrity gaps recorded
                            </div>
                          )}
                        </Card.Content>
                      </Card>
                    );
                  })}
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Full AI Audit Summary */}
          {(scoringResult1?.audit || scoringResult2?.audit) && (
            <Card className="border-2 border-indigo-200 shadow-md rounded-xl bg-linear-to-br from-indigo-50/30 to-white">
              <Card.Header className="flex items-center gap-3 pb-4">
                <div className="p-2.5 rounded-lg bg-linear-to-br from-indigo-100 to-indigo-200">
                  <Lightbulb className="text-indigo-700" size={20} />
                </div>
                <Card.Title className="font-bold text-lg text-slate-900">
                  AI Audit Summary
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[
                    { sr: scoringResult1, assessment: assessment1, color: 'emerald' },
                    { sr: scoringResult2, assessment: assessment2, color: 'blue' },
                  ].map(({ sr, assessment, color }) => {
                    const audit = sr?.audit || {};
                    if (!audit) return null;

                    return (
                      <Card key={assessment.id} className="border border-slate-200 bg-white">
                        <Card.Header className="pb-3">
                          <Card.Title className="font-bold text-slate-900">
                            {assessment.title}
                          </Card.Title>
                        </Card.Header>
                        <Card.Content className="space-y-5">
                          {/* Strengths */}
                          {audit.strengths && audit.strengths.length > 0 && (
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 mb-2">Strengths</h4>
                              <ul className="space-y-1">
                                {audit.strengths.map((strength, i) => (
                                  <li
                                    key={i}
                                    className="text-sm text-slate-700 flex items-start gap-2"
                                  >
                                    <CheckCircle2
                                      size={14}
                                      className="text-green-600 shrink-0 mt-0.5"
                                    />
                                    <span>{strength.aspect || strength}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Technical Recommendations */}
                          {audit.technical_recommendations &&
                            audit.technical_recommendations.length > 0 && (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <h4 className="text-sm font-bold text-blue-900 mb-2">
                                  Technical Recommendations
                                </h4>
                                <ul className="space-y-1">
                                  {audit.technical_recommendations.map((rec, i) => (
                                    <li key={i} className="text-sm text-blue-800 flex gap-2">
                                      <span className="text-blue-600">•</span>
                                      <span>{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                          {/* Improvement Roadmap */}
                          {audit.improvement_roadmap && audit.improvement_roadmap.length > 0 && (
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 mb-2">
                                Improvement Roadmap
                              </h4>
                              <div className="space-y-2">
                                {audit.improvement_roadmap.map((item, i) => (
                                  <div
                                    key={i}
                                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex gap-2"
                                  >
                                    <div
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                        item.priority === 1 || item.priority === '1'
                                          ? 'bg-red-100 text-red-700'
                                          : item.priority === 2 || item.priority === '2'
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-blue-100 text-blue-700'
                                      }`}
                                    >
                                      {item.priority}
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-slate-800">
                                        {item.action}
                                      </p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {item.target_factor && (
                                          <Chip
                                            size="sm"
                                            variant="soft"
                                            className="text-xs text-slate-600 bg-slate-100"
                                          >
                                            {formatFactorName(item.target_factor)}
                                          </Chip>
                                        )}
                                        {item.impact && (
                                          <Chip
                                            size="sm"
                                            variant="soft"
                                            className={`text-xs ${
                                              item.impact === 'high'
                                                ? 'text-green-700 bg-green-100'
                                                : item.impact === 'medium'
                                                  ? 'text-blue-700 bg-blue-100'
                                                  : 'text-slate-600 bg-slate-100'
                                            }`}
                                          >
                                            {item.impact} impact
                                          </Chip>
                                        )}
                                        {item.effort && (
                                          <Chip
                                            size="sm"
                                            variant="soft"
                                            className={`text-xs ${
                                              item.effort === 'low'
                                                ? 'text-green-700 bg-green-100'
                                                : item.effort === 'high'
                                                  ? 'text-red-700 bg-red-100'
                                                  : 'text-amber-700 bg-amber-100'
                                            }`}
                                          >
                                            {item.effort} effort
                                          </Chip>
                                        )}
                                        {item.timeframe && (
                                          <Chip
                                            size="sm"
                                            variant="soft"
                                            className="text-xs text-slate-500 bg-slate-50"
                                          >
                                            {item.timeframe}
                                          </Chip>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* SDG Alignment */}
                          {audit.sdg_alignment && audit.sdg_alignment.length > 0 && (
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 mb-2">
                                UN Sustainable Development Goals
                              </h4>
                              <div className="space-y-2">
                                {audit.sdg_alignment.map((sdg, i) => (
                                  <div
                                    key={i}
                                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex gap-2"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                      {sdg.sdg_number}
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-xs font-semibold text-slate-800">
                                        {sdg.sdg_name}
                                      </div>
                                      <div className="text-xs text-slate-500 mt-0.5">
                                        {sdg.rationale}
                                      </div>
                                      <Chip
                                        size="sm"
                                        variant="soft"
                                        className={`text-xs mt-1 ${
                                          sdg.relevance === 'high'
                                            ? 'text-green-700 bg-green-100'
                                            : sdg.relevance === 'medium'
                                              ? 'text-blue-700 bg-blue-100'
                                              : 'text-slate-500 bg-slate-100'
                                        }`}
                                      >
                                        {sdg.relevance} relevance
                                      </Chip>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Market Opportunity */}
                          {audit.market_opportunity_summary && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <h4 className="text-xs font-bold text-blue-800 mb-1 uppercase tracking-wide">
                                Market Opportunity
                              </h4>
                              <p className="text-sm text-blue-900">
                                {audit.market_opportunity_summary}
                              </p>
                            </div>
                          )}

                          {/* Key Metrics Comparison */}
                          {audit.key_metrics_comparison &&
                            Object.keys(audit.key_metrics_comparison).length > 0 && (
                              <div>
                                <h4 className="text-sm font-bold text-slate-900 mb-2">
                                  Key Metrics
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                  {Object.entries(audit.key_metrics_comparison).map(
                                    ([key, value]) => (
                                      <div
                                        key={key}
                                        className="p-2 bg-slate-50 border border-slate-200 rounded-lg"
                                      >
                                        <p className="text-xs text-slate-600 truncate font-semibold">
                                          {key}
                                        </p>
                                        <p className="text-sm font-bold text-slate-900 truncate">
                                          {value}
                                        </p>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                        </Card.Content>
                      </Card>
                    );
                  })}
                </div>
              </Card.Content>
            </Card>
          )}
        </Tabs.Panel>

        {/* DETAILS TAB */}
        <Tabs.Panel id="details" className="w-full px-4 sm:px-8 space-y-8">
          {/* Project Details */}
          <Card className="border-2 border-violet-200 shadow-md rounded-xl bg-linear-to-br from-violet-50/30 to-white">
            <Card.Header className="flex items-center gap-3 pb-4">
              <div className="p-2.5 rounded-lg bg-linear-to-br from-violet-100 to-violet-200">
                <FileText className="text-violet-700" size={20} />
              </div>
              <Card.Title className="font-bold text-lg text-slate-900">Project Details</Card.Title>
            </Card.Header>
            <Card.Content className="p-0">
              <Table
                aria-label="Project details table"
                removeWrapper
                classNames={{
                  th: 'bg-linear-to-r from-slate-50 to-slate-100 font-bold text-slate-700',
                  td: 'py-4',
                }}
              >
                <Table.Header>
                  <Table.Column className="w-[35%]">ATTRIBUTE</Table.Column>
                  <Table.Column className="text-center">{assessment1.title}</Table.Column>
                  <Table.Column className="text-center">{assessment2.title}</Table.Column>
                </Table.Header>
                <Table.Body>
                  <Table.Row className="hover:bg-slate-50/50 transition-colors duration-150">
                    <Table.Cell className="font-semibold text-slate-900">Industry</Table.Cell>
                    <Table.Cell className="text-center">
                      <Chip variant="secondary" size="sm" className="transition-all duration-200">
                        <Chip.Label>
                          {titleize(
                            scoringResult1?.metadata?.industry || assessment1.industry || '',
                          )}
                        </Chip.Label>
                      </Chip>
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <Chip variant="secondary" size="sm" className="transition-all duration-200">
                        <Chip.Label>
                          {titleize(
                            scoringResult2?.metadata?.industry || assessment2.industry || '',
                          )}
                        </Chip.Label>
                      </Chip>
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row className="hover:bg-slate-50/50 transition-colors duration-150">
                    <Table.Cell className="font-semibold text-slate-900">Scale</Table.Cell>
                    <Table.Cell className="text-center">
                      <Chip variant="secondary" size="sm" className="transition-all duration-200">
                        <Chip.Label>{titleize(scoringResult1?.metadata?.scale)}</Chip.Label>
                      </Chip>
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <Chip variant="secondary" size="sm" className="transition-all duration-200">
                        <Chip.Label>{titleize(scoringResult2?.metadata?.scale)}</Chip.Label>
                      </Chip>
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row className="hover:bg-slate-50/50 transition-colors duration-150">
                    <Table.Cell className="font-semibold text-slate-900">Strategy</Table.Cell>
                    <Table.Cell className="text-center">
                      <Chip variant="secondary" size="sm" className="transition-all duration-200">
                        <Chip.Label>{titleize(scoringResult1?.metadata?.r_strategy)}</Chip.Label>
                      </Chip>
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <Chip variant="secondary" size="sm" className="transition-all duration-200">
                        <Chip.Label>{titleize(scoringResult2?.metadata?.r_strategy)}</Chip.Label>
                      </Chip>
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row className="hover:bg-slate-50/50 transition-colors duration-150">
                    <Table.Cell className="font-semibold text-slate-900">Material</Table.Cell>
                    <Table.Cell className="text-center">
                      <Chip variant="secondary" size="sm" className="transition-all duration-200">
                        <Chip.Label>
                          {titleize(scoringResult1?.metadata?.primary_material)}
                        </Chip.Label>
                      </Chip>
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <Chip variant="secondary" size="sm" className="transition-all duration-200">
                        <Chip.Label>
                          {titleize(scoringResult2?.metadata?.primary_material)}
                        </Chip.Label>
                      </Chip>
                    </Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table>
            </Card.Content>
          </Card>

          {/* Gap Analysis Comparison */}
          {(scoringResult1?.gap_analysis?.has_benchmarks ||
            scoringResult2?.gap_analysis?.has_benchmarks) && (
            <Card className="border-2 border-amber-200 shadow-md rounded-xl bg-linear-to-br from-amber-50/30 to-white">
              <Card.Header className="flex items-center gap-3 pb-4">
                <div className="p-2.5 rounded-lg bg-linear-to-br from-amber-100 to-amber-200">
                  <Award className="text-amber-700" size={20} />
                </div>
                <Card.Title className="font-bold text-lg text-slate-900">
                  Gap Analysis vs Similar Projects
                </Card.Title>
              </Card.Header>
              <Card.Content className="p-0 overflow-x-auto">
                <Table
                  aria-label="Gap analysis comparison"
                  removeWrapper
                  classNames={{
                    th: 'bg-linear-to-r from-slate-50 to-slate-100 font-bold text-slate-700',
                    td: 'py-3 px-3',
                  }}
                  isCompact
                >
                  <Table.Header>
                    <Table.Column className="w-[35%]">FACTOR</Table.Column>
                    <Table.Column className="text-center">{assessment1.title}</Table.Column>
                    <Table.Column className="text-center">{assessment2.title}</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {Object.keys(
                      scoringResult1?.sub_scores || scoringResult2?.sub_scores || {},
                    ).map((factor) => {
                      const comp1 = scoringResult1?.gap_analysis?.comparisons?.[factor];
                      const comp2 = scoringResult2?.gap_analysis?.comparisons?.[factor];
                      const statusCls = (s) =>
                        s === 'above_average'
                          ? 'text-green-700 bg-green-100'
                          : s === 'below_average'
                            ? 'text-red-700 bg-red-100'
                            : 'text-blue-700 bg-blue-100';
                      return (
                        <Table.Row key={factor}>
                          <Table.Cell className="font-medium text-slate-900">
                            {formatFactorName(factor)}
                          </Table.Cell>
                          <Table.Cell className="text-center">
                            {comp1 ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-sm font-bold text-slate-800">
                                  {comp1.userScore}
                                </span>
                                <span
                                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusCls(comp1.status)}`}
                                >
                                  {comp1.status?.replace(/_/g, ' ') || '—'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </Table.Cell>
                          <Table.Cell className="text-center">
                            {comp2 ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-sm font-bold text-slate-800">
                                  {comp2.userScore}
                                </span>
                                <span
                                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusCls(comp2.status)}`}
                                >
                                  {comp2.status?.replace(/_/g, ' ') || '—'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table>
              </Card.Content>
            </Card>
          )}

          {/* Circular Economy Tier Comparison */}
          {(scoringResult1?.circular_economy_tier || scoringResult2?.circular_economy_tier) && (
            <Card className="border-2 border-green-200 shadow-md rounded-xl bg-white">
              <Card.Header className="flex items-center gap-3 pb-3">
                <Card.Title className="font-bold text-lg text-slate-900">
                  Circular Economy Tier
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { sr: scoringResult1, title: assessment1.title },
                    { sr: scoringResult2, title: assessment2.title },
                  ].map(({ sr, title }) => {
                    const tier = sr?.circular_economy_tier;
                    if (!tier)
                      return (
                        <div
                          key={title}
                          className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-sm"
                        >
                          No tier data
                        </div>
                      );
                    const tierCls =
                      tier.badge_color === 'green'
                        ? 'border-green-300 bg-green-50 text-green-700'
                        : tier.badge_color === 'blue'
                          ? 'border-blue-300 bg-blue-50 text-blue-700'
                          : tier.badge_color === 'amber'
                            ? 'border-amber-300 bg-amber-50 text-amber-700'
                            : 'border-red-300 bg-red-50 text-red-700';
                    return (
                      <div key={title} className={`p-4 rounded-xl border-2 ${tierCls}`}>
                        <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">
                          {title}
                        </p>
                        <p className="text-2xl font-bold">{tier.tier}</p>
                        <p className="text-xs opacity-70 mb-2">
                          {tier.range} · {tier.percentile_estimate}
                        </p>
                        <p className="text-xs leading-relaxed opacity-90">{tier.next_milestone}</p>
                      </div>
                    );
                  })}
                </div>
              </Card.Content>
            </Card>
          )}

          {/* R-Strategy Alignment Comparison */}
          {(scoringResult1?.r_strategy_alignment?.alignment_score != null ||
            scoringResult2?.r_strategy_alignment?.alignment_score != null) && (
            <Card className="border-2 border-purple-200 shadow-md rounded-xl bg-white">
              <Card.Header className="flex items-center gap-3 pb-3">
                <Card.Title className="font-bold text-lg text-slate-900">
                  R-Strategy Alignment
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { sr: scoringResult1, title: assessment1.title },
                    { sr: scoringResult2, title: assessment2.title },
                  ].map(({ sr, title }) => {
                    const ra = sr?.r_strategy_alignment;
                    if (!ra?.alignment_score)
                      return (
                        <div
                          key={title}
                          className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-sm"
                        >
                          No alignment data
                        </div>
                      );
                    const sc =
                      ra.alignment_score >= 75
                        ? 'text-green-600'
                        : ra.alignment_score >= 55
                          ? 'text-blue-600'
                          : 'text-amber-600';
                    return (
                      <div
                        key={title}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-200"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                          {title}
                        </p>
                        <p className="text-sm font-semibold text-slate-700 mb-1">
                          Strategy: {ra.strategy}
                        </p>
                        <div className="flex items-baseline gap-1 mb-1">
                          <span className={`text-2xl font-bold ${sc}`}>{ra.alignment_score}</span>
                          <span className="text-sm text-slate-400">/100</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-1">{ra.rating}</p>
                        <p className="text-xs text-slate-600 leading-relaxed">{ra.message}</p>
                      </div>
                    );
                  })}
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Parameter Consistency Comparison */}
          {(scoringResult1?.parameter_consistency || scoringResult2?.parameter_consistency) && (
            <Card className="border-2 border-indigo-200 shadow-md rounded-xl bg-white">
              <Card.Header className="flex items-center gap-3 pb-3">
                <Card.Title className="font-bold text-lg text-slate-900">
                  Self-Assessment Reliability
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { sr: scoringResult1, title: assessment1.title },
                    { sr: scoringResult2, title: assessment2.title },
                  ].map(({ sr, title }) => {
                    const pc = sr?.parameter_consistency;
                    if (!pc)
                      return (
                        <div
                          key={title}
                          className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-sm"
                        >
                          No data
                        </div>
                      );
                    const sc =
                      pc.score >= 85
                        ? 'text-green-600'
                        : pc.score >= 65
                          ? 'text-blue-600'
                          : 'text-amber-600';
                    return (
                      <div
                        key={title}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-200"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                          {title}
                        </p>
                        <div className="flex items-baseline gap-1 mb-1">
                          <span className={`text-2xl font-bold ${sc}`}>{pc.score}</span>
                          <span className="text-sm text-slate-400">/100</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-1">{pc.rating} Consistency</p>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {pc.interpretation}
                        </p>
                        {pc.issues?.length > 0 && (
                          <p className="text-xs text-amber-600 mt-1">
                            {pc.issues_found} issue{pc.issues_found !== 1 ? 's' : ''} detected
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Auditor's Verdict */}
          <Card className="border-2 border-green-200 shadow-md rounded-xl bg-linear-to-br from-green-50/30 to-white">
            <Card.Header className="flex gap-3 items-center pb-3">
              <div className="p-2.5 rounded-lg bg-linear-to-br from-green-100 to-green-200">
                <Lightbulb className="text-green-700" size={20} />
              </div>
              <Card.Title className="font-bold text-lg text-slate-900">
                Auditor&apos;s Verdict
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 pl-4 border-l-4 border-emerald-500 bg-linear-to-r from-emerald-50/50 to-white rounded-r-lg hover:shadow-md transition-all duration-200">
                  <p className="text-sm font-bold text-emerald-700 uppercase mb-2 tracking-wide">
                    {assessment1.title}
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {scoringResult1?.audit?.audit_verdict || 'No verdict available'}
                  </p>
                </div>

                <div className="p-5 pl-4 border-l-4 border-blue-500 bg-linear-to-r from-blue-50/50 to-white rounded-r-lg hover:shadow-md transition-all duration-200">
                  <p className="text-sm font-bold text-blue-700 uppercase mb-2 tracking-wide">
                    {assessment2.title}
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {scoringResult2?.audit?.audit_verdict || 'No verdict available'}
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Summary */}
          <Card className="border-2 border-teal-300 bg-linear-to-br from-teal-50/40 via-emerald-50/30 to-cyan-50/40 shadow-md rounded-xl">
            <Card.Content className="gap-4 p-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-linear-to-br from-teal-100 to-teal-200">
                  <Lightbulb className="text-teal-700" size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Summary</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <strong className="text-slate-900">Score Trend:</strong>
                  {scoringResult2?.overall_score > scoringResult1?.overall_score ? (
                    <Chip
                      color="success"
                      variant="soft"
                      size="sm"
                      className="transition-all duration-200"
                    >
                      <TrendingUp size={12} />
                      <Chip.Label className="font-semibold">Score improved</Chip.Label>
                    </Chip>
                  ) : scoringResult2?.overall_score < scoringResult1?.overall_score ? (
                    <Chip
                      color="danger"
                      variant="soft"
                      size="sm"
                      className="transition-all duration-200"
                    >
                      <TrendingDown size={12} />
                      <Chip.Label className="font-semibold">Score declined</Chip.Label>
                    </Chip>
                  ) : (
                    <Chip
                      color="default"
                      variant="soft"
                      size="sm"
                      className="transition-all duration-200"
                    >
                      <Minus size={12} />
                      <Chip.Label className="font-semibold">Score unchanged</Chip.Label>
                    </Chip>
                  )}
                </div>

                {(function () {
                  const a1 = scoringResult1?.metadata?.industry || assessment1.industry || '';
                  const a2 = scoringResult2?.metadata?.industry || assessment2.industry || '';
                  if (a1 && a2 && a1 !== a2) {
                    return (
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900">Industry Change:</strong>
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                          {titleize(a1)}
                          <ArrowRight size={12} />
                          {titleize(a2)}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="text-slate-600 pt-2 border-t border-slate-200">
                  <strong className="text-slate-900">Compared: </strong>
                  <span className="text-md font-bold">
                    {assessment1.title}
                    <span className="italic font-normal">
                      &nbsp;({formatTimestamp(assessment1.created_at)}) vs.&nbsp;
                    </span>
                    {assessment2.title}
                    <span className="italic font-normal">
                      &nbsp;({formatTimestamp(assessment2.created_at)})
                    </span>
                  </span>
                </div>
              </div>
            </Card.Content>
          </Card>
        </Tabs.Panel>

        {/* DATABASE EVIDENCE TAB */}
        <Tabs.Panel id="evidence" className="w-full px-4 sm:px-8 space-y-8">
          {[
            { sr: scoringResult1, assessment: assessment1, color: 'emerald' },
            { sr: scoringResult2, assessment: assessment2, color: 'blue' },
          ].map(({ sr, assessment, color }) => {
            const cases = sr?.similar_cases;
            const summaries = sr?.audit?.similar_cases_summaries || [];
            const border = color === 'emerald' ? 'border-emerald-200' : 'border-blue-200';
            const grad =
              color === 'emerald' ? 'from-emerald-100 to-emerald-200' : 'from-blue-100 to-blue-200';
            const icon = color === 'emerald' ? 'text-emerald-700' : 'text-blue-700';

            return (
              <Card
                key={assessment.id}
                className={`border-2 ${border} shadow-md rounded-xl bg-white`}
              >
                <Card.Header className="flex items-center gap-3 pb-3">
                  <div className={`p-2.5 rounded-lg bg-linear-to-br ${grad}`}>
                    <FileText className={icon} size={20} />
                  </div>
                  <Card.Title className="font-bold text-lg text-slate-900">
                    {assessment.title} — Similar Cases
                  </Card.Title>
                </Card.Header>
                <Card.Content>
                  {cases && cases.length > 0 ? (
                    <div className="space-y-5">
                      {cases.map((caseItem, idx) => {
                        const pct = Math.round((caseItem.similarity || 0) * 100);
                        const title = caseItem.title || summaries[idx] || `Related Case ${idx + 1}`;
                        const summ = summaries[idx] || caseItem.summary || '';
                        const strengthLabel =
                          pct >= 80
                            ? 'Very Strong Match'
                            : pct >= 60
                              ? 'Strong Match'
                              : pct >= 40
                                ? 'Moderate Match'
                                : 'Weak Match';
                        const strengthColor =
                          pct >= 80
                            ? '#22c55e'
                            : pct >= 60
                              ? '#3b82f6'
                              : pct >= 40
                                ? '#f59e0b'
                                : '#ef4444';

                        return (
                          <div
                            key={idx}
                            className="p-4 border border-slate-200 rounded-xl bg-slate-50"
                          >
                            {/* Header */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{title}</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {caseItem.year && (
                                    <Chip size="sm" variant="secondary" className="text-xs">
                                      {caseItem.year}
                                    </Chip>
                                  )}
                                  {caseItem.location && (
                                    <Chip size="sm" variant="secondary" className="text-xs">
                                      {caseItem.location}
                                    </Chip>
                                  )}
                                  {caseItem.use_type && (
                                    <Chip size="sm" variant="secondary" className="text-xs">
                                      {caseItem.use_type}
                                    </Chip>
                                  )}
                                  {caseItem.circular_strategy && (
                                    <Chip
                                      size="sm"
                                      variant="flat"
                                      color="success"
                                      className="text-xs"
                                    >
                                      {caseItem.circular_strategy}
                                    </Chip>
                                  )}
                                  {caseItem.materials && (
                                    <Chip size="sm" variant="secondary" className="text-xs">
                                      {caseItem.materials}
                                    </Chip>
                                  )}
                                </div>
                              </div>
                              <Chip
                                size="sm"
                                variant="flat"
                                color={pct >= 70 ? 'success' : pct >= 50 ? 'primary' : 'warning'}
                                className="shrink-0 text-xs"
                              >
                                {pct}% match
                              </Chip>
                            </div>

                            {/* Summary */}
                            {summ && (
                              <p className="text-xs text-slate-600 italic mb-3 leading-relaxed">
                                {summ}
                              </p>
                            )}

                            {/* Score comparison */}
                            {caseItem.case_scores && (
                              <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                <p className="text-xs font-semibold text-purple-700 mb-2">
                                  Case scores vs yours
                                </p>
                                <div className="grid grid-cols-4 gap-1">
                                  {Object.entries(caseItem.case_scores).map(
                                    ([factor, caseScore]) => (
                                      <div key={factor} className="text-xs text-slate-700">
                                        <strong>{formatFactorName(factor)}:</strong> {caseScore}
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Impact */}
                            {caseItem.impact && (
                              <div className="p-2 bg-blue-50 border-l-4 border-blue-400 rounded mb-2">
                                <p className="text-xs font-semibold text-blue-700 mb-0.5">Impact</p>
                                <p className="text-xs text-slate-700">{caseItem.impact}</p>
                              </div>
                            )}

                            {/* View Full Details drawer button */}
                            <div className="flex justify-end mt-2">
                              <Button
                                size="sm"
                                variant="light"
                                className="text-emerald-600"
                                onPress={() =>
                                  openResultsDatabaseEvidenceDetailsDrawer({
                                    assessmentId: assessment.id,
                                    caseItem,
                                    caseIndex: idx,
                                  })
                                }
                              >
                                View Full Details <ArrowRight className="ml-1" size={14} />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center text-slate-500">
                      <Frown size={32} />
                      <p className="text-sm">No similar cases found for this assessment.</p>
                    </div>
                  )}
                </Card.Content>
              </Card>
            );
          })}
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

AssessmentComparisonPage.propTypes = {};
