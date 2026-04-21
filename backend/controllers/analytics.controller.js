/**
 * Analytics Controller
 * Handles global dashboard stats, enhanced analytics, featured solutions,
 * document stats, and the global-stats endpoint used by the Dashboard page.
 */

import { spawn } from 'child_process';
import path from 'path';

import { filterSchema } from '#middleware/validation.middleware.js';
import {
  buildRecentMonths,
  formatMonthKey,
  safeNumber,
  sanitizeFilter,
} from '#utils/analyticsHelpers.js';

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

function computeStdDev(arr) {
  if (!arr || arr.length === 0) return 0;
  const n = arr.length;
  const mean = arr.reduce((s, v) => s + v, 0) / n;
  const variance =
    n > 1
      ? arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (n - 1)
      : arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n;
  return Number(Math.sqrt(variance).toFixed(2));
}

// Compute ISO week key YYYY-Www for a UTC date
function getISOWeekKey(date) {
  if (!date) return null;
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7; // Monday=1, Sunday=7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  const year = d.getUTCFullYear();
  return `${year}-W${String(weekNo).padStart(2, '0')}`;
}

// ------------------- controller handlers -------------------

export function getSummary(supabase) {
  return async (req, res) => {
    try {
      const industryFilter = sanitizeFilter(req.query.industry);
      const timeRangeRaw = String(req.query.timeRange || '').trim();
      const days = parseTimeRange(timeRangeRaw);

      let query = supabase
        .from('user_assessments')
        .select('industry, result_json, overall_score, created_at')
        .eq('is_public', true);

      if (industryFilter) {
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
        const industry = row.industry; // structured column only
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
      logger.error({ err }, 'Failed to fetch analytics');
      res.status(500).json({
        error: err?.message || 'Failed to fetch analytics',
        code: err?.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  };
}

export function getEnhanced(supabase) {
  return async (req, res) => {
    try {
      const timeRangeRaw = String(req.query.timeRange || '').trim();
      const days = parseTimeRange(timeRangeRaw);

      // Sanitize raw query values to handle arrays/objects, then validate with Zod
      let industryFilter;
      try {
        const parsed = filterSchema.parse({
          industry: sanitizeFilter(req.query.industry),
          category: sanitizeFilter(req.query.category),
          source: sanitizeFilter(req.query.source),
        });
        industryFilter = parsed.industry;
      } catch (err) {
        return res.status(400).json({ error: 'Invalid industry filter', details: err.errors });
      }

      let query = supabase
        .from('user_assessments')
        .select(
          'industry, result_json, overall_score, economic_viability, created_at, is_public, contribute_to_global_benchmarks',
        )
        .eq('is_public', true);

      if (industryFilter) {
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
      const viabilityScores = (assessments || []).map((a) => safeNumber(a.economic_viability));

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
        const industry = row.industry || 'Unknown'; // Explicitly group null as "Unknown"
        const score = getScoreFromRow(row);
        const viability = safeNumber(row.economic_viability);

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
        const volatility = computeStdDev(entry.scores);
        const marketShare =
          totalCount > 0 ? Number(((entry.count / totalCount) * 100).toFixed(1)) : 0;

        return {
          industry: entry.industry,
          count: entry.count,
          averageScore: entry.count ? Number((entry.totalScore / entry.count).toFixed(2)) : 0,
          avgViability: entry.count ? Number((entry.totalViability / entry.count).toFixed(2)) : 0,
          median,
          min: Math.min(...entry.scores, 100),
          max: Math.max(...entry.scores, 0),
          volatility,
          marketShare,
          topStrategies: Array.from(entry.strategies.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([strategy, count]) => ({ strategy, count })),
        };
      });

      // Time series bucketing based on requested granularity
      const granularity = String(req.query.granularity || 'weekly').toLowerCase();

      const makeBuckets = () => {
        const buckets = new Map();
        if (granularity === 'monthly') {
          const monthsToShow = 12;
          for (let i = monthsToShow - 1; i >= 0; i--) {
            const monthDate = new Date();
            monthDate.setMonth(monthDate.getMonth() - i);
            const key = `${monthDate.getUTCFullYear()}-${String(
              monthDate.getUTCMonth() + 1,
            ).padStart(2, '0')}`;
            buckets.set(key, {
              key,
              label: key,
              count: 0,
              totalScore: 0,
              totalViability: 0,
              scores: [],
            });
          }
        } else if (granularity === 'daily') {
          const daysToShow = 30;
          for (let i = daysToShow - 1; i >= 0; i--) {
            const dayDate = new Date();
            dayDate.setDate(dayDate.getDate() - i);
            const key = dayDate.toISOString().slice(0, 10);
            buckets.set(key, {
              key,
              label: key,
              count: 0,
              totalScore: 0,
              totalViability: 0,
              scores: [],
            });
          }
        } else {
          // weekly (ISO weeks)
          const weeksToShow = 12;
          for (let i = weeksToShow - 1; i >= 0; i--) {
            const ref = new Date();
            ref.setUTCDate(ref.getUTCDate() - i * 7);
            const key = getISOWeekKey(ref);
            buckets.set(key, {
              key,
              label: key,
              count: 0,
              totalScore: 0,
              totalViability: 0,
              scores: [],
              newAssessments: 0,
            });
          }
        }
        return buckets;
      };

      const bucketMap = makeBuckets();

      for (const row of assessments || []) {
        if (!row.created_at) continue;
        const date = new Date(row.created_at);
        let key;
        if (granularity === 'monthly') {
          key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
        } else if (granularity === 'daily') {
          key = date.toISOString().slice(0, 10);
        } else {
          // weekly - use ISO week key
          key = getISOWeekKey(date);
        }

        if (bucketMap.has(key)) {
          const bucket = bucketMap.get(key);
          const score = getScoreFromRow(row);
          bucket.count += 1;
          bucket.totalScore += score;
          bucket.totalViability += safeNumber(row.economic_viability);
          bucket.scores.push(score);
          if (bucket.newAssessments != null) bucket.newAssessments += 1;
        }
      }

      const timeSeries = Array.from(bucketMap.values()).map((entry) => {
        const average = entry.count ? Number((entry.totalScore / entry.count).toFixed(2)) : 0;
        const stdDev = computeStdDev(entry.scores);
        const ci = entry.count > 0 ? 1.96 * (stdDev / Math.sqrt(entry.count)) : 0;
        const upper = Number(Math.min(100, average + ci).toFixed(2));
        const lower = Number(Math.max(0, average - ci).toFixed(2));
        return {
          period: entry.key,
          label: entry.label,
          count: entry.count,
          averageScore: average,
          avgViability: entry.count ? Number((entry.totalViability / entry.count).toFixed(2)) : 0,
          stdDev,
          confidenceUpper: upper,
          confidenceLower: lower,
          growth: entry.newAssessments || 0,
        };
      });

      // compute industry market share for requested industry if present
      const requestedIndustry = industryFilter || null;
      let industryMarketShare = null;
      if (requestedIndustry) {
        const match = industryMetrics.find((m) => m.industry === requestedIndustry);
        industryMarketShare = match?.marketShare ?? null;
      } else {
        industryMarketShare = null;
      }

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

      const overallVolatility = computeStdDev(scores);

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
          overallVolatility,
        },
        // Convenience top-level fields for frontend consumption
        overallVolatility,
        industryMetrics,
        industryMarketShare,
        timeSeries,
        scoreDistribution: Object.entries(scoreRanges).map(([range, count]) => ({
          range,
          count,
          percentage: totalCount > 0 ? Number(((count / totalCount) * 100).toFixed(1)) : 0,
        })),
        strategyDistribution,
        scaleDistribution,
        trends: {
          recentGrowth: timeSeries.slice(-4).reduce((sum, w) => sum + (w.growth || 0), 0),
          scoreImprovement:
            timeSeries.length > 1
              ? Number(
                  (
                    timeSeries[timeSeries.length - 1].averageScore - timeSeries[0].averageScore
                  ).toFixed(2),
                )
              : 0,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to fetch enhanced analytics');
      res.status(500).json({
        error: err?.message || 'Failed to fetch enhanced analytics',
        code: err?.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  };
}

export function postEmbeddingsReindex() {
  return async (req, res) => {
    try {
      const scriptsDir = path.join(process.cwd(), 'backend');
      const child = spawn(process.execPath, ['scripts/embed_and_store.js'], {
        cwd: scriptsDir,
        detached: true,
        stdio: 'ignore',
      });
      child.unref();

      res.json({ started: true, pid: child.pid });
    } catch (err) {
      logger.error({ err }, 'Failed to start embedding pipeline');
      res.status(500).json({
        error: err?.message || 'Failed to start embedding pipeline',
        code: err?.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  };
}

/**
 * GET /api/analytics/global-stats
 *
 * Aggregate dashboard data from three sources:
 *   1. scoring_results_log (service-role) — all scoring calls, anon + auth,
 *      junk excluded. Widest possible data coverage.
 *   2. get_market_data() RPC — per-industry/scale/strategy benchmarks from
 *      opted-in saved assessments only.
 *   3. get_assessment_statistics() RPC (no user_uuid) — global saved
 *      assessment stats.
 *
 * Uses serviceSupabase — no RLS restriction, no PII returned.
 */
export function getGlobalStats(serviceSupabase) {
  return async (req, res) => {
    if (!serviceSupabase) {
      logger.error('Service client not available');
      return res.status(503).json({
        error: 'Service client not available',
        code: 'SERVICE_UNAVAILABLE',
        timestamp: new Date().toISOString(),
      });
    }

    try {
      // Run all three queries in parallel; partial failures are tolerated
      const [logResult, marketResult, statsResult] = await Promise.allSettled([
        // 1. scoring_results_log — all non-junk calls with a valid score
        serviceSupabase
          .from('scoring_results_log')
          .select(
            [
              'id',
              'created_at',
              'overall_score',
              'confidence_level',
              'technical_feasibility',
              'economic_viability',
              'circularity_potential',
              'parameter_consistency_score',
              'r_strategy_alignment_score',
              'risk_level',
              'industry',
              'r_strategy',
              'scale',
              'primary_material',
              'geographic_focus',
              'circular_economy_tier',
              'audit_is_junk_input',
            ].join(', '),
          )
          .or('audit_is_junk_input.is.null,audit_is_junk_input.eq.false')
          .not('overall_score', 'is', null),

        // 2. get_market_data() RPC
        serviceSupabase.rpc('get_market_data'),

        // 3. get_assessment_statistics() RPC — global (no user filter)
        serviceSupabase.rpc('get_assessment_statistics'),
      ]);

      // ── Process scoring_results_log ────────────────────────────────────────
      const logRows = logResult.status === 'fulfilled' ? logResult.value?.data || [] : [];
      if (logResult.status === 'rejected') {
        logger.error({ reason: logResult.reason }, '[getGlobalStats] log query failed');
      }

      const totalScoringCalls = logRows.length;
      const validScores = logRows.map((r) => safeNumber(r.overall_score)).filter((s) => s > 0);

      const avg = (arr) =>
        arr.length ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)) : null;

      // Score distribution — 4 bands
      const scoreDist = { '0-25': 0, '26-50': 0, '51-75': 0, '76-100': 0 };
      validScores.forEach((s) => {
        if (s <= 25) scoreDist['0-25']++;
        else if (s <= 50) scoreDist['26-50']++;
        else if (s <= 75) scoreDist['51-75']++;
        else scoreDist['76-100']++;
      });

      // Tier distribution from JSONB column
      const tierDist = {};
      logRows.forEach((r) => {
        const tier = r.circular_economy_tier?.tier || 'Unknown';
        tierDist[tier] = (tierDist[tier] || 0) + 1;
      });

      // Risk distribution
      const riskDist = {};
      logRows.forEach((r) => {
        const risk = r.risk_level || 'unknown';
        riskDist[risk] = (riskDist[risk] || 0) + 1;
      });

      // Industry distribution (top 12 by call count)
      const industryAcc = {};
      logRows.forEach((r) => {
        const ind = r.industry || 'other';
        if (!industryAcc[ind]) industryAcc[ind] = { count: 0, scores: [] };
        industryAcc[ind].count++;
        if (r.overall_score != null) industryAcc[ind].scores.push(safeNumber(r.overall_score));
      });
      const industryDist = Object.entries(industryAcc)
        .map(([industry, d]) => ({
          industry,
          count: d.count,
          avg_score: avg(d.scores),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);

      // R-strategy distribution
      const stratAcc = {};
      logRows.forEach((r) => {
        const s = r.r_strategy || 'unknown';
        stratAcc[s] = (stratAcc[s] || 0) + 1;
      });
      const strategyDist = Object.entries(stratAcc)
        .map(([strategy, count]) => ({ strategy, count }))
        .sort((a, b) => b.count - a.count);

      // Primary material distribution
      const materialAcc = {};
      logRows.forEach((r) => {
        const m = r.primary_material || 'unknown';
        materialAcc[m] = (materialAcc[m] || 0) + 1;
      });
      const materialDist = Object.entries(materialAcc)
        .map(([material, count]) => ({ material, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Geographic focus distribution
      const geoAcc = {};
      logRows.forEach((r) => {
        const g = r.geographic_focus || 'unknown';
        geoAcc[g] = (geoAcc[g] || 0) + 1;
      });
      const geoDist = Object.entries(geoAcc)
        .map(([geo, count]) => ({ geo, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Scale distribution
      const scaleAcc = {};
      logRows.forEach((r) => {
        const s = r.scale || 'unknown';
        scaleAcc[s] = (scaleAcc[s] || 0) + 1;
      });
      const scaleDist = Object.entries(scaleAcc)
        .map(([scale, count]) => ({ scale, count }))
        .sort((a, b) => b.count - a.count);

      // Junk input rate
      const junkCount = logRows.filter((r) => r.audit_is_junk_input === true).length;
      const junkRate =
        totalScoringCalls > 0 ? Number(((junkCount / totalScoringCalls) * 100).toFixed(1)) : 0;

      // Weekly trend — last 12 ISO weeks
      const weekBuckets = new Map();
      for (let i = 11; i >= 0; i--) {
        const ref = new Date();
        ref.setUTCDate(ref.getUTCDate() - i * 7);
        const key = getISOWeekKey(ref);
        if (key) weekBuckets.set(key, { week: key, count: 0, scores: [] });
      }
      logRows.forEach((r) => {
        if (!r.created_at) return;
        const key = getISOWeekKey(new Date(r.created_at));
        if (key && weekBuckets.has(key)) {
          const b = weekBuckets.get(key);
          b.count++;
          if (r.overall_score != null) b.scores.push(safeNumber(r.overall_score));
        }
      });
      const weeklyTrend = Array.from(weekBuckets.values()).map((b) => ({
        week: b.week,
        count: b.count,
        avg_score: avg(b.scores),
      }));

      // Average derived metrics (nulls excluded)
      const metricAvg = (key) => {
        const vals = logRows
          .map((r) => r[key])
          .filter((v) => v != null && Number.isFinite(Number(v)));
        return vals.length
          ? Number((vals.reduce((a, b) => a + Number(b), 0) / vals.length).toFixed(1))
          : null;
      };

      // ── Assemble response ──────────────────────────────────────────────────
      res.json({
        log_stats: {
          total_scoring_calls: totalScoringCalls,
          avg_score: avg(validScores),
          avg_metrics: {
            confidence_level: metricAvg('confidence_level'),
            technical_feasibility: metricAvg('technical_feasibility'),
            economic_viability: metricAvg('economic_viability'),
            circularity_potential: metricAvg('circularity_potential'),
            parameter_consistency_score: metricAvg('parameter_consistency_score'),
            r_strategy_alignment_score: metricAvg('r_strategy_alignment_score'),
          },
          score_distribution: scoreDist,
          tier_distribution: tierDist,
          risk_distribution: riskDist,
          industry_distribution: industryDist,
          strategy_distribution: strategyDist,
          material_distribution: materialDist,
          geo_distribution: geoDist,
          scale_distribution: scaleDist,
          junk_rate: junkRate,
          weekly_trend: weeklyTrend,
        },
        // From get_market_data RPC
        market_data: marketResult.status === 'fulfilled' ? marketResult.value?.data || [] : [],
        // From get_assessment_statistics RPC
        assessment_stats:
          statsResult.status === 'fulfilled' ? statsResult.value?.data?.[0] || null : null,
        generated_at: new Date().toISOString(),
      });
    } catch (err) {
      logger.error({ err }, '[getGlobalStats] unexpected error');
      res.status(500).json({
        error: err?.message || 'Failed to fetch global stats',
        code: err?.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  };
}
