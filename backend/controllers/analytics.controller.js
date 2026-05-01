/**
 * Analytics Controller
 * Handles global dashboard stats, enhanced analytics, featured solutions,
 * document stats, and the global-stats endpoint used by the Dashboard page.
 */

import { spawn } from 'child_process';
import path from 'path';

import { safeNumber } from '#utils/analyticsHelpers.js';

/**
 * Parse time range string to extract number of days
 * @param {string} timeRange - Time range string (e.g., "30d", "90d", "all")
 * @returns {number|null} Number of days or null if invalid
 */
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

/**
 * Extract overall score from a database row
 * @param {Object} row - Database row containing score information
 * @returns {number} Overall score or 0 if not found
 */
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

/**
 * Calculate standard deviation of an array of numbers
 * @param {Array<number>} arr - Array of numbers
 * @returns {number} Standard deviation rounded to 2 decimal places
 */
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

/**
 * Compute ISO week key in format YYYY-Www for a UTC date
 * @param {Date} date - Date object
 * @returns {string|null} ISO week key (e.g., "2024-W01") or null if invalid
 */
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

/**
 * POST /api/analytics/embeddings/reindex
 *
 * Starts the embedding pipeline reindex process in the background
 * Returns immediately with process ID for tracking
 *
 * @returns {Function} Express middleware handler
 */
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
