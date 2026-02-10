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

function parseTimeRange(timeRange) {
  if (!timeRange) return null;
  const normalized = String(timeRange).trim().toLowerCase();
  if (!normalized || normalized === 'all') return null;
  const match = normalized.match(/^(\d+)d$/);
  if (!match) return null;
  const days = Number(match[1]);
  if (!Number.isFinite(days) || days <= 0) return null;
  return days;
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
      const industryFilter = String(req.query.industry || '').trim();
      const timeRangeRaw = String(req.query.timeRange || '').trim();
      const days = parseTimeRange(timeRangeRaw);

      let query = supabase
        .from('assessments')
        .select('industry, result_json, overall_score, created_at')
        .eq('is_public', true);

      if (industryFilter && industryFilter.toLowerCase() !== 'all') {
        query = query.eq('industry', industryFilter);
      }

      let startDate = null;
      if (days) {
        startDate = new Date();
        startDate.setUTCDate(startDate.getUTCDate() - days);
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data: assessments, error } = await query;

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

  // Enhanced analytics endpoint with detailed metrics
  router.get('/enhanced', async (req, res) => {
    try {
      const industryFilter = String(req.query.industry || '').trim();
      const timeRangeRaw = String(req.query.timeRange || '').trim();
      const days = parseTimeRange(timeRangeRaw);

      let query = supabase
        .from('assessments')
        .select(
          'industry, result_json, overall_score, business_viability_score, created_at, is_public, contribute_to_global_benchmarks',
        )
        .eq('is_public', true);

      if (industryFilter && industryFilter.toLowerCase() !== 'all') {
        query = query.eq('industry', industryFilter);
      }

      if (days) {
        const startDate = new Date();
        startDate.setUTCDate(startDate.getUTCDate() - days);
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data: assessments, error } = await query;
      if (error) throw error;

      const totalCount = assessments?.length || 0;
      const scores = (assessments || []).map(getScoreFromRow);
      const viabilityScores = (assessments || []).map((a) =>
        safeNumber(a.business_viability_score),
      );

      // Basic aggregate stats
      const averageScore = scores.length
        ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2))
        : 0;

      const avgViability = viabilityScores.length
        ? Number(
            (viabilityScores.reduce((sum, s) => sum + s, 0) / viabilityScores.length).toFixed(2),
          )
        : 0;

      // Score distribution
      const scoreRanges = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
      scores.forEach((score) => {
        if (score <= 20) scoreRanges['0-20']++;
        else if (score <= 40) scoreRanges['21-40']++;
        else if (score <= 60) scoreRanges['41-60']++;
        else if (score <= 80) scoreRanges['61-80']++;
        else scoreRanges['81-100']++;
      });

      // Industry metrics with more details
      const industryMap = new Map();
      for (const row of assessments || []) {
        const industry = row.industry || 'general';
        const score = getScoreFromRow(row);
        const viability = safeNumber(row.business_viability_score);

        if (!industryMap.has(industry)) {
          industryMap.set(industry, {
            industry,
            count: 0,
            totalScore: 0,
            totalViability: 0,
            scores: [],
            strategies: new Map(),
          });
        }
        const entry = industryMap.get(industry);
        entry.count += 1;
        entry.totalScore += score;
        entry.totalViability += viability;
        entry.scores.push(score);

        // Extract R-strategy if available
        const strategy = row.result_json?.metadata?.r_strategy || row.result_json?.r_strategy;
        if (strategy) {
          entry.strategies.set(strategy, (entry.strategies.get(strategy) || 0) + 1);
        }
      }

      const industryMetrics = Array.from(industryMap.values()).map((entry) => {
        const sortedScores = [...entry.scores].sort((a, b) => a - b);
        const median =
          sortedScores.length > 0 ? sortedScores[Math.floor(sortedScores.length / 2)] : 0;

        return {
          industry: entry.industry,
          count: entry.count,
          averageScore: entry.count ? Number((entry.totalScore / entry.count).toFixed(2)) : 0,
          avgViability: entry.count ? Number((entry.totalViability / entry.count).toFixed(2)) : 0,
          median,
          min: Math.min(...entry.scores, 100),
          max: Math.max(...entry.scores, 0),
          topStrategies: Array.from(entry.strategies.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([strategy, count]) => ({ strategy, count })),
        };
      });

      // Weekly time series (last 12 weeks)
      const weeklyMap = new Map();
      const weeksToShow = 12;
      for (let i = weeksToShow - 1; i >= 0; i--) {
        const weekDate = new Date();
        weekDate.setDate(weekDate.getDate() - i * 7);
        const weekKey = `${weekDate.getFullYear()}-W${Math.ceil((weekDate.getDate() + 6) / 7)}`;
        weeklyMap.set(weekKey, {
          week: weekKey,
          count: 0,
          totalScore: 0,
          totalViability: 0,
          newAssessments: 0,
        });
      }

      for (const row of assessments || []) {
        if (!row.created_at) continue;
        const date = new Date(row.created_at);
        const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() + 6) / 7)}`;

        if (weeklyMap.has(weekKey)) {
          const bucket = weeklyMap.get(weekKey);
          bucket.count += 1;
          bucket.totalScore += getScoreFromRow(row);
          bucket.totalViability += safeNumber(row.business_viability_score);
          bucket.newAssessments += 1;
        }
      }

      const weeklyTimeSeries = Array.from(weeklyMap.values()).map((entry) => ({
        period: entry.week,
        count: entry.count,
        averageScore: entry.count ? Number((entry.totalScore / entry.count).toFixed(2)) : 0,
        avgViability: entry.count ? Number((entry.totalViability / entry.count).toFixed(2)) : 0,
        growth: entry.newAssessments,
      }));

      // R-Strategy distribution
      const strategyMap = new Map();
      for (const row of assessments || []) {
        const strategy =
          row.result_json?.metadata?.r_strategy || row.result_json?.r_strategy || 'Unknown';
        const score = getScoreFromRow(row);

        if (!strategyMap.has(strategy)) {
          strategyMap.set(strategy, { strategy, count: 0, totalScore: 0 });
        }
        const entry = strategyMap.get(strategy);
        entry.count += 1;
        entry.totalScore += score;
      }

      const strategyDistribution = Array.from(strategyMap.values()).map((entry) => ({
        strategy: entry.strategy,
        count: entry.count,
        percentage: totalCount > 0 ? Number(((entry.count / totalCount) * 100).toFixed(1)) : 0,
        averageScore: entry.count ? Number((entry.totalScore / entry.count).toFixed(2)) : 0,
      }));

      // Scale distribution
      const scaleMap = new Map();
      for (const row of assessments || []) {
        const scale = row.result_json?.metadata?.scale || row.result_json?.scale || 'Unknown';
        if (!scaleMap.has(scale)) {
          scaleMap.set(scale, 0);
        }
        scaleMap.set(scale, scaleMap.get(scale) + 1);
      }

      const scaleDistribution = Array.from(scaleMap.entries()).map(([scale, count]) => ({
        scale,
        count,
        percentage: totalCount > 0 ? Number(((count / totalCount) * 100).toFixed(1)) : 0,
      }));

      // Public vs Private assessments
      const publicCount = (assessments || []).filter((a) => a.is_public).length;
      const contributingCount = (assessments || []).filter(
        (a) => a.contribute_to_global_benchmarks,
      ).length;

      res.json({
        aggregate: {
          totalCount,
          averageScore,
          avgViability,
          publicCount,
          contributingCount,
          medianScore:
            scores.length > 0
              ? [...scores].sort((a, b) => a - b)[Math.floor(scores.length / 2)]
              : 0,
        },
        industryMetrics,
        timeSeries: weeklyTimeSeries,
        scoreDistribution: Object.entries(scoreRanges).map(([range, count]) => ({
          range,
          count,
          percentage: totalCount > 0 ? Number(((count / totalCount) * 100).toFixed(1)) : 0,
        })),
        strategyDistribution,
        scaleDistribution,
        trends: {
          recentGrowth: weeklyTimeSeries.slice(-4).reduce((sum, w) => sum + w.growth, 0),
          scoreImprovement:
            weeklyTimeSeries.length > 1
              ? Number(
                  (
                    weeklyTimeSeries[weeklyTimeSeries.length - 1].averageScore -
                    weeklyTimeSeries[0].averageScore
                  ).toFixed(2),
                )
              : 0,
        },
      });
    } catch (err) {
      res.status(500).json(buildErrorResponse(err, 'Failed to fetch enhanced analytics'));
    }
  });

  // Featured solutions endpoint - Get diverse examples from documents dataset
  router.get('/featured-solutions', async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 3, 10); // Max 10, default 3

      // Get a sample of diverse documents from the dataset
      // Fetch documents and extract problem/solution pairs from metadata
      const { data: documents, error } = await supabase
        .from('documents')
        .select('id, content, metadata')
        .limit(limit * 5) // Fetch extra to ensure diversity
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Extract unique problem-solution pairs from metadata
      const solutions = [];
      const seenSources = new Set();

      for (const doc of documents || []) {
        if (!doc.metadata) continue;

        const sourceId = doc.metadata.source_id || doc.metadata.source_row;
        if (seenSources.has(sourceId)) continue;

        if (doc.metadata.chunk_type === 'problem_solution') {
          // Try to parse the content or extract from metadata
          const title = doc.metadata.fields?.problem
            ? doc.metadata.fields.problem.substring(0, 100) + '...'
            : `Solution ${solutions.length + 1}`;

          solutions.push({
            id: doc.id,
            title,
            problem: doc.metadata.fields?.problem || 'Problem statement available',
            solution: doc.metadata.fields?.solution || doc.content.substring(0, 200),
            category: doc.metadata.category || 'Circular Economy',
            wordCount: doc.metadata.word_count || 0,
            sourceId,
          });

          seenSources.add(sourceId);

          if (solutions.length >= limit) break;
        }
      }

      // If we don't have enough from documents, provide hardcoded examples
      if (solutions.length === 0) {
        solutions.push(
          {
            id: 1,
            title: 'Modular Construction Systems',
            problem:
              'The construction industry produces 1.3B tons of waste annually through single-use designs and frequent demolitions.',
            solution:
              'Design engineered components for easy assembly/disassembly and reuse across projects, reducing waste by 90% and construction time by 30-50%.',
            category: 'Construction & Real Estate',
            wordCount: 250,
          },
          {
            id: 2,
            title: 'Clothing Rental Subscription Service',
            problem:
              'Fast fashion drives massive production, transportation, and landfill waste from single-purchase clothing consumption.',
            solution:
              'Monthly subscription service with professional cleaning/repair between customers, extending garment lifecycle and creating continuous revenue streams.',
            category: 'Fashion & Textiles',
            wordCount: 180,
          },
          {
            id: 3,
            title: 'Book Swap Platform with Gamification',
            problem:
              'Digital platform shift increases data center energy consumption while physical books are produced once then discarded, causing deforestation.',
            solution:
              'Community book trading platform with digital tracking and reward credits, reducing new book production and promoting resource sharing culture.',
            category: 'Education & Publishing',
            wordCount: 200,
          },
        );
      }

      res.json({
        count: solutions.length,
        solutions: solutions.slice(0, limit),
      });
    } catch (err) {
      res.status(500).json(buildErrorResponse(err, 'Failed to fetch featured solutions'));
    }
  });

  return router;
}
