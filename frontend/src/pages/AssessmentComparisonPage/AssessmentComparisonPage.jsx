import { Button, Chip } from '@heroui/react';
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

import ErrorDisplay from '@/components/common/ErrorDisplay';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useAssessmentComparison } from '@/features/assessments/hooks/useAssessmentComparison';
import { reconstructScoringResult } from '@/features/assessments/utils';
import { exportComparisonCSV } from '@/features/export';
import { formatTimestamp, getCurrentTimestampFormatted, titleize } from '@/lib/formatting';

import { ComparisonSkeleton, DatabaseEvidenceTab } from './components';

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
    <div className="space-y-0 w-full">
      {/* STICKY COMPARISON HEADER */}
      <div
        className="sticky top-14 z-40 w-full border-b transition-all duration-200 blur-md"
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
            className="border-2 shadow-md rounded-xl hover:shadow-lg transition-all duration-300"
            style={{
              background: 'linear-gradient(to bottom right, var(--success-soft), var(--surface))',
              borderColor: 'var(--success)',
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
            </div>
          </div>

          <div className="hidden md:flex items-center justify-center px-4">
            <div className="text-center">
              <Chip
                color="default"
                variant="secondary"
                size="lg"
                className="text-lg font-bold px-5 py-3 shadow-md"
                style={{
                  background:
                    'linear-gradient(to right, var(--success-soft), var(--accent-soft), var(--info-soft))',
                  color: 'var(--foreground)',
                }}
              >
                <Chip.Label>VS</Chip.Label>
              </Chip>
            </div>
          </div>

          <div
            className="border-2 shadow-md rounded-xl hover:shadow-lg transition-all duration-300"
            style={{
              background: 'linear-gradient(to bottom right, var(--accent-soft), var(--surface))',
              borderColor: 'var(--accent)',
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
            </div>
          </div>
        </div>
      </div>

      {/* Vertical Content - 2 column layout */}
      <div className="max-w-7xl mx-auto px-0 sm:px-6 space-y-8">
        {/* Overview Section */}
        <div className="w-full">
          {/* Section heading */}
          <div className="border-b border-border pb-3 mb-6">
            <span className="label-overline">OVERVIEW</span>
          </div>

          {/* 2-column split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-0 lg:divide-x divide-border">
            <div className="lg:pr-6">
              <div className="space-y-4">
                <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  Assessment 1
                </h3>
                <div className="space-y-2">
                  <p style={{ color: 'var(--muted)' }}>
                    Score: {scoringResult1?.overall_score || 0}/100
                  </p>
                  <p style={{ color: 'var(--muted)' }}>
                    Confidence: {scoringResult1?.confidence_level || 0}%
                  </p>
                  <p style={{ color: 'var(--muted)' }}>
                    Created: {formatTimestamp(assessment1.created_at)}
                  </p>
                </div>
                {insights
                  .filter((i) => i.type === 'positive')
                  .map((insight, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <insight.icon size={16} style={{ color: 'var(--success)' }} />
                      <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                        {insight.text}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="lg:pl-6">
              <div className="space-y-4">
                <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  Assessment 2
                </h3>
                <div className="space-y-2">
                  <p style={{ color: 'var(--muted)' }}>
                    Score: {scoringResult2?.overall_score || 0}/100
                  </p>
                  <p style={{ color: 'var(--muted)' }}>
                    Confidence: {scoringResult2?.confidence_level || 0}%
                  </p>
                  <p style={{ color: 'var(--muted)' }}>
                    Created: {formatTimestamp(assessment2.created_at)}
                  </p>
                </div>
                {insights
                  .filter((i) => i.type === 'negative')
                  .map((insight, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <insight.icon size={16} style={{ color: 'var(--warning)' }} />
                      <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                        {insight.text}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div className="divider-warm my-10" />

        {/* Factor Analysis Section */}
        <div className="w-full">
          {/* Section heading */}
          <div className="border-b border-border pb-3 mb-6">
            <span className="label-overline">FACTOR ANALYSIS</span>
          </div>

          {/* 2-column split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-0 lg:divide-x divide-border">
            <div className="lg:pr-6">
              <div className="space-y-4">
                <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  Assessment 1 Performance
                </h3>
                <div className="space-y-2">
                  {Object.entries(scoringResult1?.sub_scores || {}).map(([factor, score]) => (
                    <div key={factor} className="flex justify-between">
                      <span className="text-sm" style={{ color: 'var(--muted)' }}>
                        {titleize(factor)}
                      </span>
                      <span className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>
                        {score}/100
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:pl-6">
              <div className="space-y-4">
                <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  Assessment 2 Performance
                </h3>
                <div className="space-y-2">
                  {Object.entries(scoringResult2?.sub_scores || {}).map(([factor, score]) => (
                    <div key={factor} className="flex justify-between">
                      <span className="text-sm" style={{ color: 'var(--muted)' }}>
                        {titleize(factor)}
                      </span>
                      <span className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>
                        {score}/100
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="divider-warm my-10" />

        {/* Database Evidence Section */}
        <div className="w-full">
          {/* Section heading */}
          <div className="border-b border-border pb-3 mb-6">
            <span className="label-overline">DATABASE EVIDENCE</span>
          </div>

          {/* 2-column split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-0 lg:divide-x divide-border">
            <div className="lg:pr-6">
              <div className="space-y-4">
                <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  Assessment 1 Evidence
                </h3>
                <DatabaseEvidenceTab
                  assessment1={assessment1}
                  assessment2={null}
                  scoringResult1={scoringResult1}
                  scoringResult2={null}
                  openResultsDatabaseEvidenceDetailsDrawer={
                    openResultsDatabaseEvidenceDetailsDrawer
                  }
                />
              </div>
            </div>
            <div className="lg:pl-6">
              <div className="space-y-4">
                <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  Assessment 2 Evidence
                </h3>
                <DatabaseEvidenceTab
                  assessment1={null}
                  assessment2={assessment2}
                  scoringResult1={null}
                  scoringResult2={scoringResult2}
                  openResultsDatabaseEvidenceDetailsDrawer={
                    openResultsDatabaseEvidenceDetailsDrawer
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="w-full px-4 sm:px-8 flex flex-col md:flex-row justify-between items-center gap-4 py-6 border-t-2"
          style={{ borderColor: 'var(--border)' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
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
    </div>
  );
}
