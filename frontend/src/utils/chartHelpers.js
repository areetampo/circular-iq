/**
 * Chart utility functions to reduce code duplication
 */

// ─── Colours ──────────────────────────────────────────────────────────────────
export const TIER_COLORS = [
  'var(--success)',
  'var(--info)',
  'var(--warning)',
  'var(--danger)',
  'var(--muted)',
];

export const RISK_COLORS = ['var(--success)', 'var(--warning)', 'var(--danger)', 'var(--muted)'];

export const SCORE_COLORS = ['var(--danger)', 'var(--warning)', 'var(--info)', 'var(--success)'];

export const SCALE_COLORS = [
  'var(--danger)',
  'var(--warning)',
  'var(--info)',
  'var(--success)',
  'var(--accent)',
  'var(--muted)',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Only show a PieChart when we have ≥ 2 distinct values with total ≥ 2
 * @param {Array} data - Chart data array
 * @returns {boolean} - Whether pie chart is usable
 */
export function usablePie(data) {
  if (!data || data.length < 2) return false;
  const total = data.reduce((s, d) => s + (d.value ?? 0), 0);
  return total >= 2;
}

/**
 * Only show a BarChart when we have ≥ 1 bar with count/value > 0
 * @param {Array} data - Chart data array
 * @param {string} key - Key to check for value (default: 'count')
 * @returns {boolean} - Whether bar chart is usable
 */
export function usableBar(data, key = 'count') {
  if (!data || !Array.isArray(data) || data.length === 0) return false;
  return data.some((d) => (d[key] ?? 0) > 0);
}

/**
 * Transforms score distribution object to chart data
 * @param {Object} scoreDistribution - Score distribution object
 * @returns {Array} - Chart data array
 */
export function transformScoreDistribution(scoreDistribution) {
  return Object.entries(scoreDistribution)
    .map(([name, count]) => ({ name, value: Number(count) }))
    .filter((d) => d.value > 0);
}

/**
 * Transforms tier distribution object to chart data
 * @param {Object} tierDistribution - Tier distribution object
 * @returns {Array} - Chart data array
 */
export function transformTierDistribution(tierDistribution) {
  return Object.entries(tierDistribution)
    .filter(([t]) => t && t !== 'Unknown')
    .map(([tier, count]) => ({ name: tier, value: Number(count) }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Transforms risk distribution object to chart data
 * @param {Object} riskDistribution - Risk distribution object
 * @returns {Array} - Chart data array
 */
export function transformRiskDistribution(riskDistribution) {
  return Object.entries(riskDistribution)
    .filter(([r]) => r && r !== 'unknown')
    .map(([risk, count]) => ({
      name: risk.charAt(0).toUpperCase() + risk.slice(1),
      value: Number(count),
    }));
}

/**
 * Transforms weekly trend data to chart data
 * @param {Array} weeklyTrend - Weekly trend array
 * @returns {Array} - Chart data array
 */
export function transformWeeklyTrend(weeklyTrend) {
  return weeklyTrend.map((w) => ({
    period: w.week,
    count: Number(w.count),
    averageScore: w.avg_score != null ? Number(w.avg_score) : 0,
  }));
}

/**
 * Transforms industry distribution to chart data
 * @param {Array} industryDistribution - Industry distribution array
 * @param {number} limit - Maximum number of items to include
 * @returns {Array} - Chart data array
 */
export function transformIndustryDistribution(industryDistribution, limit = 10) {
  return industryDistribution
    .filter((d) => d.industry && d.industry !== 'other' && d.industry !== 'general')
    .slice(0, limit)
    .map((d) => ({ name: d.industry, count: Number(d.count) }));
}

/**
 * Transforms material distribution to chart data
 * @param {Array} materialDistribution - Material distribution array
 * @param {number} limit - Maximum number of items to include
 * @returns {Array} - Chart data array
 */
export function transformMaterialDistribution(materialDistribution, limit = 8) {
  return (materialDistribution || [])
    .filter((d) => d.material && d.material !== 'unknown')
    .slice(0, limit)
    .map((d) => ({ name: d.material, value: Number(d.count) }));
}

/**
 * Transforms geographic distribution to chart data
 * @param {Array} geoDistribution - Geographic distribution array
 * @param {number} limit - Maximum number of items to include
 * @returns {Array} - Chart data array
 */
export function transformGeoDistribution(geoDistribution, limit = 8) {
  return (geoDistribution || [])
    .filter((d) => d.geo && d.geo !== 'unknown')
    .slice(0, limit)
    .map((d) => ({ name: d.geo, value: Number(d.count) }));
}

/**
 * Transforms scale distribution to chart data
 * @param {Array} scaleDistribution - Scale distribution array
 * @param {number} limit - Maximum number of items to include
 * @returns {Array} - Chart data array
 */
export function transformScaleDistribution(scaleDistribution, limit = 6) {
  return (scaleDistribution || [])
    .filter((d) => d.scale && d.scale !== 'unknown')
    .slice(0, limit)
    .map((d) => ({ name: d.scale, value: Number(d.count) }));
}
