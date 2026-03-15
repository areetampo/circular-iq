import path from 'path';
import { spawn } from 'child_process';
import { BACKEND_CONFIG } from '#config/backend.config.js';
import { filterSchema } from '#middleware/validation.middleware.js';
import { VECTOR_SEARCH_VECTOR_WEIGHT } from '#config/embedding.js';
import { documentsRepository } from '#database/index.js';

// -- helper utilities copied from former route file --------------------------------

// Validate that request query filter values are simple strings or null
function sanitizeFilter(val) {
  if (val == null) return null;
  if (Array.isArray(val)) return null;
  if (typeof val === 'object') return null;
  const str = String(val).trim();
  if (str === '' || str.toLowerCase() === 'all') return null;
  return str;
}

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

function buildErrorResponse(error, defaultMessage = 'Internal server error') {
  return {
    error: error?.message || defaultMessage,
    timestamp: new Date().toISOString(),
    code: error?.code || 'INTERNAL_ERROR',
  };
}

// OpenAI client helpers (used for featured solutions)
let openaiClient = null;
export function setOpenAIClient(client) {
  openaiClient = client;
}

async function ensureOpenAIClient() {
  if (openaiClient) return openaiClient;
  if (!BACKEND_CONFIG.openai.apiKey) return null;
  try {
    const { default: OpenAI } = await import('openai');
    openaiClient = new OpenAI({ apiKey: BACKEND_CONFIG.openai.apiKey });
    return openaiClient;
  } catch (e) {
    console.error('Failed to initialize OpenAI client:', e);
    openaiClient = null;
    return null;
  }
}

// ------------------- controller handlers -------------------

export function getSummary(supabase) {
  return async (req, res) => {
    try {
      const industryFilter = sanitizeFilter(req.query.industry);
      const timeRangeRaw = String(req.query.timeRange || '').trim();
      const days = parseTimeRange(timeRangeRaw);

      let query = supabase
        .from('assessments')
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
      res.status(500).json(buildErrorResponse(err, 'Failed to fetch analytics'));
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
        .from('assessments')
        .select(
          'industry, result_json, overall_score, business_viability_score, created_at, is_public, contribute_to_global_benchmarks',
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
        const industry = row.industry || 'Unknown'; // Explicitly group null as "Unknown"
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
          bucket.totalViability += safeNumber(row.business_viability_score);
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
      res.status(500).json(buildErrorResponse(err, 'Failed to fetch enhanced analytics'));
    }
  };
}

export function getFeaturedSolutions(supabase) {
  return async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 3, 10); // Max 10, default 3
      let industryFilter = sanitizeFilter(req.query.industry);
      let categoryFilter = sanitizeFilter(req.query.category);
      let sourceFilter = sanitizeFilter(req.query.source);
      const q = req.query.q ? String(req.query.q).trim() : null;

      // enforce strict filter contract - strings or null only
      try {
        const parsed = filterSchema.parse({
          industry: industryFilter,
          category: categoryFilter,
          source: sourceFilter,
        });
        industryFilter = parsed.industry;
        categoryFilter = parsed.category;
        sourceFilter = parsed.source;
      } catch (err) {
        return res.status(400).json({ error: 'Invalid filter parameters', details: err.errors });
      }

      // If a query is provided, perform semantic/hybrid search using DB RPCs
      if (q) {
        // Create query embedding via OpenAI
        const openai = await ensureOpenAIClient();
        if (!openai) {
          return res
            .status(500)
            .json(buildErrorResponse({ message: 'OpenAI client not available' }));
        }
        const embeddingResp = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: q,
        });

        const queryEmbedding = embeddingResp.data?.[0]?.embedding || null;

        if (!queryEmbedding) {
          return res
            .status(500)
            .json(buildErrorResponse({ message: 'Failed to create query embedding' }));
        }

        // Use hybrid search that combines vector and keyword matching (server-side RPC)
        const rpcParams = {
          query_embedding: queryEmbedding,
          keyword_filter: q,
          industry_filter: industryFilter || null,
          category_filter: categoryFilter || null,
          source_filter: sourceFilter || null,
          match_count: Math.max(limit * 5, 10),
          vector_weight: VECTOR_SEARCH_VECTOR_WEIGHT,
          similarity_threshold: 0.0,
        };

        // use repository abstraction to hide the underlying database
        const rpcResults = await documentsRepository.searchHybrid(
          queryEmbedding,
          q,
          industryFilter || null,
          categoryFilter || null,
          sourceFilter || null,
          Math.max(limit * 5, 10),
          VECTOR_SEARCH_VECTOR_WEIGHT,
          0.0,
        );

        const solutions = [];
        const seen = new Set();

        // repository results already filtered by industry/category/source
        for (const r of rpcResults || []) {
          if (!r || !r.metadata) continue;
          const sourceId = r.metadata.source_id || r.metadata.source_row || r.id;
          if (seen.has(sourceId)) continue;

          // Prefer structured/title or content fields; avoid relying on metadata for core fields
          const title =
            r.title ||
            (r.content
              ? String(r.content).substring(0, 100) + '...'
              : `Solution ${solutions.length + 1}`);

          solutions.push({
            id: r.id,
            title,
            industry: r.industry || null,
            category: r.category || null,
            source: r.source || null,
            similarity: r.similarity || r.combined_score || 0,
            rrf_score: r.rrf_score || null,
            // keep minimal textual fields but do not depend on metadata for structured values
            problem: r.content ? String(r.content).substring(0, 200) : '',
            solution: r.content ? String(r.content).substring(0, 200) : '',
            wordCount: r.word_count ?? r.metadata?.word_count ?? 0,
          });

          seen.add(sourceId);

          if (solutions.length >= limit) break;
        }

        return res.json({ count: solutions.length, solutions: solutions.slice(0, limit) });
      }

      // No query provided — fall back to sampling recent documents with structured column filters
      const documents = await documentsRepository.findRecent(limit * 8, {
        industry: industryFilter && industryFilter !== 'all' ? industryFilter : undefined,
        category: categoryFilter && categoryFilter !== 'all' ? categoryFilter : undefined,
        source: sourceFilter && sourceFilter !== 'all' ? sourceFilter : undefined,
      });

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
            industry: doc.industry || null,
            category: doc.category || null,
            source: doc.source || null,
            similarity: null,
            rrf_score: null,
            // legacy fields preserved if needed
            problem: doc.metadata.fields?.problem || 'Problem statement available',
            solution: doc.metadata.fields?.solution || doc.content.substring(0, 200),
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
      res.status(500).json(buildErrorResponse(err, 'Failed to start embedding pipeline'));
    }
  };
}

export function getDocumentsSummary() {
  return async (req, res) => {
    try {
      const [byIndustry, byCategory, byRStrategy, byScale, bySource] = await Promise.all([
        documentsRepository.countBy('industry'),
        documentsRepository.countBy('category'),
        documentsRepository.countBy("metadata->>'r_strategy'"),
        documentsRepository.countBy("metadata->>'scale'"),
        documentsRepository.countBy('source'),
      ]);
      res.json({ byIndustry, byCategory, byRStrategy, byScale, bySource });
    } catch (err) {
      res.status(500).json(buildErrorResponse(err, 'Failed to fetch document summary'));
    }
  };
}

export function getDocumentsStats(/*supabase*/) {
  return async (req, res) => {
    try {
      const data = await documentsRepository.getStatistics();
      res.json({ stats: data });
    } catch (err) {
      res.status(500).json(buildErrorResponse(err, 'Failed to fetch document stats'));
    }
  };
}
