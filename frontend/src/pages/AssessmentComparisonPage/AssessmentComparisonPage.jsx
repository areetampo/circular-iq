import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exportComparisonCSV } from '@/features/export';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import { formatTimestamp, getCurrentTimestampFormatted, titleize } from '@/lib/formatting';
import { useAssessmentComparison } from '@/features/assessments';
import { Card, Chip, Tabs, Select, Label, ListBox, Skeleton } from '@heroui/react';
import { Button } from '@/components/common/Button';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Progress } from '@heroui/progress';
import RadarChart from '@/components/charts/RadarChart';
import BarChart from '@/components/charts/BarChart';
import {
  AlertTriangle,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  ArrowRight,
  Upload,
  Lightbulb,
  Target,
  Dumbbell,
  BarChart3,
  Search,
  Activity,
  Award,
  FileText,
  GitCompare,
  TrendingUpDown,
  Zap,
} from 'lucide-react';

// Skeleton Loader Component
function ComparisonSkeleton() {
  return (
    <div className="space-y-6 mt-4 w-full">
      {/* Header Skeleton */}
      <div className="w-full px-4 sm:px-8">
        <div className="flex items-center justify-center gap-4">
          <Skeleton animationType="shimmer" className="h-10 w-32 rounded-lg" />
          <Skeleton animationType="shimmer" className="h-10 w-24 rounded-lg" />
        </div>
      </div>

      {/* Assessment Headers Skeleton */}
      <div className="w-full px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-center">
          <Skeleton animationType="shimmer" className="h-32 rounded-xl" />
          <Skeleton
            animationType="shimmer"
            className="hidden lg:block h-16 w-16 rounded-full mx-auto"
          />
          <Skeleton animationType="shimmer" className="h-32 rounded-xl" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="w-full px-4 sm:px-8">
        <div className="flex justify-center mb-6">
          <Skeleton animationType="shimmer" className="h-12 w-96 rounded-xl" />
        </div>

        {/* Content Cards Skeleton */}
        <div className="space-y-6">
          <Skeleton animationType="shimmer" className="h-64 rounded-xl" />
          <Skeleton animationType="shimmer" className="h-48 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton animationType="shimmer" className="h-96 rounded-xl" />
            <Skeleton animationType="shimmer" className="h-96 rounded-xl" />
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

  // Derive metrics
  const factorDiffs = Object.entries(comparisonData.factorDiffs || {}).map(([factor, diff]) => {
    const a1 = assessment1.result_json?.sub_scores?.[factor] || 0;
    const a2 = assessment2.result_json?.sub_scores?.[factor] || 0;
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
    const score1 = assessment1.result_json?.overall_score || 0;
    const score2 = assessment2.result_json?.overall_score || 0;
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

    const sub2 = assessment2.result_json?.sub_scores || {};
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
  const factors = Object.keys(assessment1.result_json?.sub_scores || {});
  const radarChartData = factors.map((factor) => ({
    subject: titleize(factor),
    [assessment1.title]: assessment1.result_json?.sub_scores?.[factor] || 0,
    [assessment2.title]: assessment2.result_json?.sub_scores?.[factor] || 0,
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
          <Card className="border-2 border-emerald-200 shadow-md rounded-xl bg-gradient-to-br from-emerald-50/50 to-white hover:shadow-lg transition-all duration-300">
            <Card.Content className="gap-3 p-0">
              <h2 className="text-lg font-bold text-slate-900 wrap-break-word">
                {assessment1.title}
              </h2>
              <p className="text-xs text-slate-600 font-medium italic">
                {formatTimestamp(assessment1.created_at)}
              </p>
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
                className="text-lg font-bold px-5 py-3 bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100 text-slate-900 shadow-md"
              >
                <Chip.Label>VS</Chip.Label>
              </Chip>
            </div>
          </div>

          <Card className="border-2 border-blue-200 shadow-md rounded-xl bg-gradient-to-br from-blue-50/50 to-white hover:shadow-lg transition-all duration-300">
            <Card.Content className="gap-3 p-0">
              <h2 className="text-lg font-bold text-slate-900 wrap-break-word">
                {assessment2.title}
              </h2>
              <p className="text-xs text-slate-600 font-medium italic">
                {formatTimestamp(assessment2.created_at)}
              </p>
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
          <Select value={selectedTab} onChange={setSelectedTab} variant="primary" className="w-2/5">
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
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        {/* Desktop Tabs */}
        <Tabs.ListContainer className="my-4 hidden md:flex justify-center">
          <Tabs.List
            aria-label="Comparison sections"
            className="bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-200 rounded-full shadow-sm *:font-semibold"
          >
            <Tabs.Tab id="overview">
              Overview
              <Tabs.Indicator className="bg-gradient-to-r from-emerald-200 to-teal-200" />
            </Tabs.Tab>
            <Tabs.Tab id="analysis">
              Factor Analysis
              <Tabs.Indicator className="bg-gradient-to-r from-emerald-200 to-teal-200" />
            </Tabs.Tab>
            <Tabs.Tab id="details">
              Details
              <Tabs.Indicator className="bg-gradient-to-r from-emerald-200 to-teal-200" />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        {/* OVERVIEW TAB */}
        <Tabs.Panel id="overview" className="w-full px-0 md:px-4 space-y-8">
          {/* Input Data Comparison */}
          <Card className="border-2 border-indigo-200 shadow-md rounded-xl bg-gradient-to-br from-indigo-50/30 to-white">
            <Card.Header className="flex items-center gap-3 pb-4">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200">
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
                    <Table
                      aria-label="Business problem comparison"
                      removeWrapper
                      classNames={{
                        th: 'bg-gradient-to-r from-slate-50 to-slate-100 font-bold text-slate-700',
                        td: 'py-4',
                      }}
                    >
                      <TableHeader>
                        <TableColumn className="w-1/2">Assessment 1</TableColumn>
                        <TableColumn className="w-1/2">Assessment 2</TableColumn>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="hover:bg-slate-50/50 transition-colors duration-150">
                          <TableCell className="align-top">
                            <div>
                              <p className="text-sm font-semibold text-slate-900 mb-2">
                                {assessment1?.title || 'Assessment 1'}
                              </p>
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {assessment1?.business_problem || 'N/A'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div>
                              <p className="text-sm font-semibold text-slate-900 mb-2">
                                {assessment2?.title || 'Assessment 2'}
                              </p>
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {assessment2?.business_problem || 'N/A'}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableBody>
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
                        th: 'bg-gradient-to-r from-slate-50 to-slate-100 font-bold text-slate-700',
                        td: 'py-4',
                      }}
                    >
                      <TableHeader>
                        <TableColumn className="w-1/2">Assessment 1</TableColumn>
                        <TableColumn className="w-1/2">Assessment 2</TableColumn>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="hover:bg-slate-50/50 transition-colors duration-150">
                          <TableCell className="align-top">
                            <div>
                              <p className="text-sm font-semibold text-slate-900 mb-2">
                                {assessment1?.title || 'Assessment 1'}
                              </p>
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {assessment1?.business_solution || 'N/A'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div>
                              <p className="text-sm font-semibold text-slate-900 mb-2">
                                {assessment2?.title || 'Assessment 2'}
                              </p>
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {assessment2?.business_solution || 'N/A'}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Card.Content>
                </Card>
              </div>

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
                      th: 'bg-gradient-to-r from-slate-50 to-slate-100 font-bold text-slate-700',
                      td: 'py-3',
                    }}
                  >
                    <TableHeader>
                      <TableColumn className="w-2/5">PARAMETER</TableColumn>
                      <TableColumn className="text-center w-1.5/5">
                        {assessment1?.title || 'Assessment 1'}
                      </TableColumn>
                      <TableColumn className="text-center w-1.5/5">
                        {assessment2?.title || 'Assessment 2'}
                      </TableColumn>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(assessment1?.result_json?.input_parameters || {}).map(
                        ([key, value1]) => {
                          const value2 = assessment2?.result_json?.input_parameters?.[key];
                          return (
                            <TableRow
                              key={key}
                              className="hover:bg-slate-50/50 transition-colors duration-150"
                            >
                              <TableCell className="font-medium text-slate-900 capitalize">
                                {key.replace(/_/g, ' ')}
                              </TableCell>
                              <TableCell className="text-center text-slate-600">
                                {String(value1).substring(0, 30)}
                                {String(value1).length > 30 ? '...' : ''}
                              </TableCell>
                              <TableCell className="text-center text-slate-600">
                                {String(value2 || '').substring(0, 30)}
                                {String(value2 || '').length > 30 ? '...' : ''}
                              </TableCell>
                            </TableRow>
                          );
                        },
                      )}
                    </TableBody>
                  </Table>
                </Card.Content>
              </Card>
            </Card.Content>
          </Card>

          {/* Key Insights */}
          {insights && insights.length > 0 && (
            <Card className="border-2 border-teal-200 shadow-md rounded-xl bg-gradient-to-br from-teal-50/30 to-white">
              <Card.Header className="flex items-center gap-3 pb-4">
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-teal-100 to-teal-200">
                  <Lightbulb className="text-teal-700" size={20} />
                </div>
                <Card.Title className="font-bold text-lg text-slate-900">Key Insights</Card.Title>
              </Card.Header>
              <Card.Content className="gap-3 flex flex-col">
                {insights.map((insight, idx) => {
                  const IconComponent = insight.icon;
                  const colorClass =
                    insight.type === 'positive'
                      ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-l-emerald-500 text-emerald-700'
                      : insight.type === 'negative'
                        ? 'bg-gradient-to-r from-red-50 to-orange-50 border-l-red-500 text-red-700'
                        : 'bg-gradient-to-r from-slate-50 to-gray-50 border-l-slate-400 text-slate-700';

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

          {/* Change Snapshot */}
          <Card className="border-2 border-orange-200 shadow-md rounded-xl bg-gradient-to-br from-orange-50/30 to-white">
            <Card.Header className="flex items-center gap-3 pb-4">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200">
                <Target className="text-orange-700" size={20} />
              </div>
              <Card.Title className="font-bold text-lg text-slate-900">
                Scores & Change Snapshot
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Assessment 1 Score */}
                <div className="p-5 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                  <p className="text-xs text-slate-600 mb-2 font-semibold uppercase tracking-wide truncate">
                    {assessment1.title}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-bold ${
                        (assessment1.result_json?.overall_score || 0) >= 75
                          ? 'text-emerald-700'
                          : (assessment1.result_json?.overall_score || 0) >= 50
                            ? 'text-amber-600'
                            : 'text-red-600'
                      }`}
                    >
                      {assessment1.result_json?.overall_score || 0}
                    </span>
                    <span className="text-sm text-slate-500 font-medium">/100</span>
                  </div>
                  <Progress
                    value={assessment1.result_json?.overall_score || 0}
                    color={getScoreColor(assessment1.result_json?.overall_score || 0)}
                    className={`mt-2 h-2 rounded-full border-2 ${
                      (assessment1.result_json?.overall_score || 0) >= 75
                        ? 'border-emerald-400'
                        : (assessment1.result_json?.overall_score || 0) >= 50
                          ? 'border-amber-400'
                          : 'border-red-400'
                    }`}
                  />
                </div>

                {/* Assessment 2 Score */}
                <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                  <p className="text-xs text-slate-600 mb-2 font-semibold uppercase tracking-wide truncate">
                    {assessment2.title}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-bold ${
                        (assessment2.result_json?.overall_score || 0) >= 75
                          ? 'text-emerald-700'
                          : (assessment2.result_json?.overall_score || 0) >= 50
                            ? 'text-amber-600'
                            : 'text-red-600'
                      }`}
                    >
                      {assessment2.result_json?.overall_score || 0}
                    </span>
                    <span className="text-sm text-slate-500 font-medium">/100</span>
                  </div>
                  <Progress
                    value={assessment2.result_json?.overall_score || 0}
                    color={getScoreColor(assessment2.result_json?.overall_score || 0)}
                    className={`mt-2 h-2 rounded-full border-2 ${
                      (assessment2.result_json?.overall_score || 0) >= 75
                        ? 'border-emerald-400'
                        : (assessment2.result_json?.overall_score || 0) >= 50
                          ? 'border-amber-400'
                          : 'border-red-400'
                    }`}
                  />
                </div>

                {/* Overall Change */}
                <div className="p-5 bg-gradient-to-br from-slate-50 to-white border-2 border-slate-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
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
                  <div className="p-5 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
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
                  <div className="p-5 bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                    <p className="text-xs text-slate-600 mb-2 font-semibold uppercase tracking-wide">
                      Biggest Drop
                    </p>
                    <p className="text-4xl font-bold text-red-700">{biggestDrop.diff}</p>
                    <p className="text-xs text-slate-600 truncate mt-1 font-medium">
                      {biggestDrop.label}
                    </p>
                  </div>
                )}

                <div className="p-5 bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
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
        </Tabs.Panel>

        {/* ANALYSIS TAB */}
        <Tabs.Panel id="analysis" className="w-full px-0 md:px-4 space-y-8">
          {/* Visual Comparison Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <Card className="border-2 border-blue-200 shadow-md rounded-xl bg-gradient-to-br from-blue-50/30 to-white">
              <Card.Header className="flex items-center gap-3 pb-0">
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200">
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
            <Card className="border-2 border-purple-200 shadow-md rounded-xl bg-gradient-to-br from-purple-50/30 to-white">
              <Card.Header className="flex items-center gap-3 pb-0">
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200">
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
          <Card className="border-2 border-indigo-200 shadow-md rounded-xl bg-gradient-to-br from-indigo-50/30 to-white">
            <Card.Header className="flex items-center gap-3 pb-0">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200">
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
                      <Progress
                        value={factor.a1}
                        color="success"
                        size="sm"
                        className="h-2.5 rounded-full"
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
                      <Progress
                        value={factor.a2}
                        color="warning"
                        size="sm"
                        className="h-2.5 rounded-full"
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
          <Card className="border-2 border-cyan-200 shadow-md rounded-xl bg-gradient-to-br from-cyan-50/30 to-white">
            <Card.Header className="flex gap-3 items-center pb-3">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-200">
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
                  th: 'bg-gradient-to-r from-slate-50 to-slate-100 font-bold text-slate-700',
                  td: 'py-4',
                }}
              >
                <TableHeader>
                  <TableColumn className="w-[35%]">FACTOR</TableColumn>
                  <TableColumn className="text-center">{assessment1.title}</TableColumn>
                  <TableColumn className="text-center">{assessment2.title}</TableColumn>
                  <TableColumn className="text-center">CHANGE</TableColumn>
                </TableHeader>
                <TableBody>
                  {Object.entries(assessment1.result_json?.sub_scores || {}).map(
                    ([factor, val1]) => {
                      const val2 = assessment2.result_json?.sub_scores?.[factor] || 0;
                      const diff = val2 - val1;
                      return (
                        <TableRow
                          key={factor}
                          className="hover:bg-slate-50/50 transition-colors duration-150"
                        >
                          <TableCell className="font-semibold text-slate-900">
                            {titleize(factor)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Chip
                              color={getScoreColor(val1)}
                              variant="soft"
                              size="md"
                              className="transition-all duration-200"
                            >
                              <Chip.Label className="font-bold">{val1}</Chip.Label>
                            </Chip>
                          </TableCell>
                          <TableCell className="text-center">
                            <Chip
                              color={getScoreColor(val2)}
                              variant="soft"
                              size="md"
                              className="transition-all duration-200"
                            >
                              <Chip.Label className="font-bold">{val2}</Chip.Label>
                            </Chip>
                          </TableCell>
                          <TableCell className="text-center">
                            {renderChangeIndicator(diff)}
                          </TableCell>
                        </TableRow>
                      );
                    },
                  )}
                </TableBody>
              </Table>
            </Card.Content>
          </Card>
        </Tabs.Panel>

        {/* DETAILS TAB */}
        <Tabs.Panel id="details" className="w-full px-4 sm:px-8 space-y-8">
          {/* Project Details */}
          <Card className="border-2 border-violet-200 shadow-md rounded-xl bg-gradient-to-br from-violet-50/30 to-white">
            <Card.Header className="flex items-center gap-3 pb-4">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-violet-100 to-violet-200">
                <FileText className="text-violet-700" size={20} />
              </div>
              <Card.Title className="font-bold text-lg text-slate-900">Project Details</Card.Title>
            </Card.Header>
            <Card.Content className="p-0">
              <Table
                aria-label="Project details table"
                removeWrapper
                classNames={{
                  th: 'bg-gradient-to-r from-slate-50 to-slate-100 font-bold text-slate-700',
                  td: 'py-4',
                }}
              >
                <TableHeader>
                  <TableColumn className="w-[35%]">ATTRIBUTE</TableColumn>
                  <TableColumn className="text-center">{assessment1.title}</TableColumn>
                  <TableColumn className="text-center">{assessment2.title}</TableColumn>
                </TableHeader>
                <TableBody>
                  <TableRow className="hover:bg-slate-50/50 transition-colors duration-150">
                    <TableCell className="font-semibold text-slate-900">Industry</TableCell>
                    <TableCell className="text-center">
                      <Chip variant="secondary" size="sm" className="transition-all duration-200">
                        <Chip.Label>
                          {titleize(assessment1.result_json?.metadata?.industry)}
                        </Chip.Label>
                      </Chip>
                    </TableCell>
                    <TableCell className="text-center">
                      <Chip variant="secondary" size="sm" className="transition-all duration-200">
                        <Chip.Label>
                          {titleize(assessment2.result_json?.metadata?.industry)}
                        </Chip.Label>
                      </Chip>
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-slate-50/50 transition-colors duration-150">
                    <TableCell className="font-semibold text-slate-900">Scale</TableCell>
                    <TableCell className="text-center">
                      <Chip variant="secondary" size="sm" className="transition-all duration-200">
                        <Chip.Label>
                          {titleize(assessment1.result_json?.metadata?.scale)}
                        </Chip.Label>
                      </Chip>
                    </TableCell>
                    <TableCell className="text-center">
                      <Chip variant="secondary" size="sm" className="transition-all duration-200">
                        <Chip.Label>
                          {titleize(assessment2.result_json?.metadata?.scale)}
                        </Chip.Label>
                      </Chip>
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-slate-50/50 transition-colors duration-150">
                    <TableCell className="font-semibold text-slate-900">Strategy</TableCell>
                    <TableCell className="text-center">
                      <Chip variant="secondary" size="sm" className="transition-all duration-200">
                        <Chip.Label>
                          {titleize(assessment1.result_json?.metadata?.r_strategy)}
                        </Chip.Label>
                      </Chip>
                    </TableCell>
                    <TableCell className="text-center">
                      <Chip variant="secondary" size="sm" className="transition-all duration-200">
                        <Chip.Label>
                          {titleize(assessment2.result_json?.metadata?.r_strategy)}
                        </Chip.Label>
                      </Chip>
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-slate-50/50 transition-colors duration-150">
                    <TableCell className="font-semibold text-slate-900">Material</TableCell>
                    <TableCell className="text-center">
                      <Chip variant="secondary" size="sm" className="transition-all duration-200">
                        <Chip.Label>
                          {titleize(assessment1.result_json?.metadata?.primary_material)}
                        </Chip.Label>
                      </Chip>
                    </TableCell>
                    <TableCell className="text-center">
                      <Chip variant="secondary" size="sm" className="transition-all duration-200">
                        <Chip.Label>
                          {titleize(assessment2.result_json?.metadata?.primary_material)}
                        </Chip.Label>
                      </Chip>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card.Content>
          </Card>

          {/* Benchmarking */}
          {assessment1.result_json?.gap_analysis?.overall_benchmarks &&
            assessment2.result_json?.gap_analysis?.overall_benchmarks && (
              <Card className="border-2 border-amber-200 shadow-md rounded-xl bg-gradient-to-br from-amber-50/30 to-white">
                <Card.Header className="flex items-center gap-3 pb-4">
                  <div className="p-2.5 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200">
                    <Award className="text-amber-700" size={20} />
                  </div>
                  <Card.Title className="font-bold text-lg text-slate-900">
                    Benchmarking vs. Similar Projects
                  </Card.Title>
                </Card.Header>
                <Card.Content className="p-0 overflow-x-auto">
                  <div className="min-w-full">
                    <Table
                      aria-label="Benchmarking table"
                      removeWrapper
                      classNames={{
                        th: 'bg-gradient-to-r from-slate-50 to-slate-100 font-bold text-slate-700',
                        td: 'py-4 px-2 sm:px-4',
                      }}
                      isCompact
                    >
                      <TableHeader>
                        <TableColumn className="min-w-30 sm:min-w-auto">BENCHMARK</TableColumn>
                        <TableColumn className="text-center min-w-20">
                          {assessment1.title}
                        </TableColumn>
                        <TableColumn className="text-center min-w-20">
                          {assessment2.title}
                        </TableColumn>
                        <TableColumn className="text-center min-w-16">CHANGE</TableColumn>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="hover:bg-slate-50/50 transition-colors duration-150">
                          <TableCell className="font-semibold text-slate-900">
                            vs. Similar Avg
                          </TableCell>
                          <TableCell className="text-center">
                            <Chip
                              color={getScoreColor(
                                Math.round(
                                  assessment1.result_json?.gap_analysis.overall_benchmarks.average,
                                ),
                              )}
                              variant="soft"
                              size="md"
                              className="transition-all duration-200"
                            >
                              <Chip.Label className="font-bold">
                                {Math.round(
                                  assessment1.result_json?.gap_analysis.overall_benchmarks.average,
                                )}
                              </Chip.Label>
                            </Chip>
                          </TableCell>
                          <TableCell className="text-center">
                            <Chip
                              color={getScoreColor(
                                Math.round(
                                  assessment2.result_json?.gap_analysis.overall_benchmarks.average,
                                ),
                              )}
                              variant="soft"
                              size="md"
                              className="transition-all duration-200"
                            >
                              <Chip.Label className="font-bold">
                                {Math.round(
                                  assessment2.result_json?.gap_analysis.overall_benchmarks.average,
                                )}
                              </Chip.Label>
                            </Chip>
                          </TableCell>
                          <TableCell className="text-center">
                            {renderChangeIndicator(
                              Math.round(
                                assessment2.result_json?.gap_analysis.overall_benchmarks.average,
                              ) -
                                Math.round(
                                  assessment1.result_json?.gap_analysis.overall_benchmarks.average,
                                ),
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow className="hover:bg-slate-50/50 transition-colors duration-150">
                          <TableCell className="font-semibold text-slate-900">
                            vs. Top 10%
                          </TableCell>
                          <TableCell className="text-center">
                            <Chip
                              color={getScoreColor(
                                assessment1.result_json?.gap_analysis.overall_benchmarks
                                  .top_10_percentile,
                              )}
                              variant="soft"
                              size="md"
                              className="transition-all duration-200"
                            >
                              <Chip.Label className="font-bold">
                                {
                                  assessment1.result_json?.gap_analysis.overall_benchmarks
                                    .top_10_percentile
                                }
                              </Chip.Label>
                            </Chip>
                          </TableCell>
                          <TableCell className="text-center">
                            <Chip
                              color={getScoreColor(
                                assessment2.result_json?.gap_analysis.overall_benchmarks
                                  .top_10_percentile,
                              )}
                              variant="soft"
                              size="md"
                              className="transition-all duration-200"
                            >
                              <Chip.Label className="font-bold">
                                {
                                  assessment2.result_json?.gap_analysis.overall_benchmarks
                                    .top_10_percentile
                                }
                              </Chip.Label>
                            </Chip>
                          </TableCell>
                          <TableCell className="text-center">
                            {renderChangeIndicator(
                              assessment2.result_json?.gap_analysis.overall_benchmarks
                                .top_10_percentile -
                                assessment1.result_json?.gap_analysis.overall_benchmarks
                                  .top_10_percentile,
                            )}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </Card.Content>
              </Card>
            )}

          {/* Auditor's Verdict */}
          <Card className="border-2 border-green-200 shadow-md rounded-xl bg-gradient-to-br from-green-50/30 to-white">
            <Card.Header className="flex gap-3 items-center pb-3">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-green-100 to-green-200">
                <Lightbulb className="text-green-700" size={20} />
              </div>
              <Card.Title className="font-bold text-lg text-slate-900">
                Auditor&apos;s Verdict
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 pl-4 border-l-4 border-emerald-500 bg-gradient-to-r from-emerald-50/50 to-white rounded-r-lg hover:shadow-md transition-all duration-200">
                  <p className="text-sm font-bold text-emerald-700 uppercase mb-2 tracking-wide">
                    {assessment1.title}
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {assessment1.result_json?.audit?.audit_verdict || 'No verdict available'}
                  </p>
                </div>

                <div className="p-5 pl-4 border-l-4 border-blue-500 bg-gradient-to-r from-blue-50/50 to-white rounded-r-lg hover:shadow-md transition-all duration-200">
                  <p className="text-sm font-bold text-blue-700 uppercase mb-2 tracking-wide">
                    {assessment2.title}
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {assessment2.result_json?.audit?.audit_verdict || 'No verdict available'}
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Summary */}
          <Card className="border-2 border-teal-300 bg-gradient-to-br from-teal-50/40 via-emerald-50/30 to-cyan-50/40 shadow-md rounded-xl">
            <Card.Content className="gap-4 p-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-teal-100 to-teal-200">
                  <Lightbulb className="text-teal-700" size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Summary</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <strong className="text-slate-900">Score Trend:</strong>
                  {assessment2.result_json?.overall_score >
                  assessment1.result_json?.overall_score ? (
                    <Chip
                      color="success"
                      variant="soft"
                      size="sm"
                      className="transition-all duration-200"
                    >
                      <TrendingUp size={12} />
                      <Chip.Label className="font-semibold">Score improved</Chip.Label>
                    </Chip>
                  ) : assessment2.result_json?.overall_score <
                    assessment1.result_json?.overall_score ? (
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

                {assessment1.result_json?.metadata?.industry !==
                  assessment2.result_json?.metadata?.industry && (
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900">Industry Change:</strong>
                    <span className="flex items-center gap-1 text-slate-600 font-medium">
                      {titleize(assessment1.result_json?.metadata?.industry)}
                      <ArrowRight size={12} />
                      {titleize(assessment2.result_json?.metadata?.industry)}
                    </span>
                  </div>
                )}

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
      </Tabs>

      {/* Footer */}
      <div className="w-full px-4 sm:px-8 flex flex-col md:flex-row justify-between items-center gap-4 py-6 border-t-2 border-slate-200">
        <p className="text-xs text-slate-600 font-medium">
          Last updated: {getCurrentTimestampFormatted()}
        </p>
        <div className="flex gap-2">
          <Button variant="teal" onPress={() => exportComparisonCSV([assessment1, assessment2])}>
            <Upload size={16} />
            Export CSV
          </Button>
          <Button variant="neutral" onPress={handleBack}>
            <ArrowLeft size={16} />
            Back to Assessments
          </Button>
        </div>
      </div>
    </div>
  );
}

AssessmentComparisonPage.propTypes = {};
