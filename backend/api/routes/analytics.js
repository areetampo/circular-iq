import express from 'express';

function safeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function formatMonthKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function buildRecentMonths(count = 6) {
  const now = new Date();
  const months = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    const monthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push({
      key: formatMonthKey(monthDate),
      label: monthDate.toISOString().slice(0, 7),
    });
  }

  return months;
}

function getScoreFromRow(row) {
  if (!row) return 0;
  if (row.result_json && row.result_json.overall_score != null) {
    return safeNumber(row.result_json.overall_score);
  }
  if (row.overall_score != null) {
    return safeNumber(row.overall_score);
  }
  return 0;
}

function buildErrorResponse(error, defaultMessage = 'Internal server error') {
  return {
    error: error?.message || defaultMessage,
    timestamp: new Date().toISOString(),
    code: error?.code || 'INTERNAL_ERROR',
  };
}

export default function createAnalyticsRouter(supabase) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const { data: assessments, error } = await supabase
        .from('assessments')
        .select('industry, result_json, overall_score, created_at');

      if (error) throw error;

      const totalCount = assessments?.length || 0;
      const scores = (assessments || []).map(getScoreFromRow);
      const averageScore = scores.length
        ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2))
        : 0;

      const industryMap = new Map();
      for (const row of assessments || []) {
        const industry = row.industry || 'general';
        const score = getScoreFromRow(row);
        if (!industryMap.has(industry)) {
          industryMap.set(industry, { industry, count: 0, totalScore: 0 });
        }
        const entry = industryMap.get(industry);
        entry.count += 1;
        entry.totalScore += score;
      }

      const industryMetrics = Array.from(industryMap.values()).map((entry) => ({
        industry: entry.industry,
        count: entry.count,
        averageScore: entry.count ? Number((entry.totalScore / entry.count).toFixed(2)) : 0,
      }));

      const recentMonths = buildRecentMonths(6);
      const monthStats = new Map(
        recentMonths.map((month) => [month.key, { ...month, count: 0, totalScore: 0 }]),
      );

      for (const row of assessments || []) {
        if (!row.created_at) continue;
        const createdDate = new Date(row.created_at);
        if (Number.isNaN(createdDate.getTime())) continue;
        const monthKey = formatMonthKey(
          new Date(Date.UTC(createdDate.getUTCFullYear(), createdDate.getUTCMonth(), 1)),
        );
        if (!monthStats.has(monthKey)) continue;
        const bucket = monthStats.get(monthKey);
        bucket.count += 1;
        bucket.totalScore += getScoreFromRow(row);
      }

      const timeSeries = Array.from(monthStats.values()).map((entry) => ({
        month: entry.key,
        label: entry.label,
        count: entry.count,
        averageScore: entry.count ? Number((entry.totalScore / entry.count).toFixed(2)) : 0,
      }));

      res.json({
        aggregate: {
          totalCount,
          averageScore,
        },
        industryMetrics,
        timeSeries,
      });
    } catch (err) {
      res.status(500).json(buildErrorResponse(err, 'Failed to fetch analytics'));
    }
  });

  return router;
}
