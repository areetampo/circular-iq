/**
 * Global Activity chart transforms: CSS var resolution and analytics payload → Recharts shapes.
 */

/**
 * Resolves a CSS custom-property reference against the current document root.
 *
 * @param {string} varString - CSS variable reference such as `var(--color-primary)`, or a raw color value.
 * @param {string} [fallback='#000000'] - Color returned when the CSS variable cannot be resolved.
 * @returns {string} Resolved CSS color value, or the fallback when the variable is unavailable.
 */
export function resolveCSSVar(varString, fallback = '#000000') {
  if (typeof window === 'undefined') return fallback; // SSR fallback
  if (!varString || !varString.startsWith('var(')) return varString;

  const varName = varString.slice(4, -1); // Extract '--color-primary' from 'var(--color-primary)'
  const cssValue = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return cssValue || fallback;
}

// ─── Colours ──────────────────────────────────────────────────────────────────
// Factory functions to resolve CSS variables at render time

/**
 * CE tier palette resolved from current CSS variables.
 *
 * @returns {string[]} Ordered colors for circular-economy tier charts.
 */
export const getTierColors = () => [
  resolveCSSVar('var(--chart-2)', '#4a7c59'), // muted forest green
  resolveCSSVar('var(--color-info)', '#455771'), // slate blue (matches actual --color-info value)
  resolveCSSVar('var(--chart-3)', '#b07d3a'), // muted amber
  resolveCSSVar('var(--chart-4)', '#8b3a3a'), // muted terracotta
  resolveCSSVar('var(--chart-6)', '#9a8f82'), // text muted
];

/**
 * Risk-level palette for pie/bar charts on the activity page.
 *
 * @returns {string[]} Ordered colors for low-to-high risk buckets.
 */
export const getRiskColors = () => [
  resolveCSSVar('var(--chart-2)', '#4a7c59'),
  resolveCSSVar('var(--chart-3)', '#b07d3a'),
  resolveCSSVar('var(--chart-4)', '#8b3a3a'),
  resolveCSSVar('var(--chart-6)', '#9a8f82'),
];

/**
 * Overall score band colours resolved from the active chart theme.
 *
 * @returns {string[]} Ordered colors for low-to-high score bands.
 */
export const getScoreColors = () => [
  resolveCSSVar('var(--chart-4)', '#8b3a3a'),
  resolveCSSVar('var(--chart-3)', '#b07d3a'),
  resolveCSSVar('var(--color-info)', '#5a7a9a'), // fixed from --chart-5
  resolveCSSVar('var(--chart-2)', '#4a7c59'),
];

/**
 * Business-scale distribution palette for multi-segment charts.
 *
 * @returns {string[]} Extended color set for scale distribution segments.
 */
export const getScaleColors = () => [
  resolveCSSVar('var(--chart-4)', '#8b3a3a'), // muted terracotta
  resolveCSSVar('var(--chart-3)', '#b07d3a'), // muted amber
  resolveCSSVar('var(--color-info)', '#5a7a9a'), // fixed from --chart-5
  resolveCSSVar('var(--chart-2)', '#4a7c59'), // muted forest green
  resolveCSSVar('var(--chart-1)', '#b8916a'), // warm accent brown
  resolveCSSVar('var(--chart-6)', '#9a8f82'), // text muted
];

// Note: Use getter functions directly instead of Proxy exports
// Example: getTierColors()[0] instead of TIER_COLORS[0]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Checks whether pie data has enough total volume for a meaningful multi-slice chart.
 *
 * @param {Array<{ value?: number|null }>} data - Pie segment objects with numeric `value` fields.
 * @returns {boolean} True when there are at least two non-empty segments worth rendering.
 */
export function usablePie(data) {
  if (!data || data.length < 2) return false;
  const total = data.reduce((s, d) => s + (d.value ?? 0), 0);
  return total >= 2;
}

/**
 * Checks whether bar data has at least one positive value for a configured metric.
 *
 * @param {Array<Record<string, number|null|undefined>>} data - Bar row objects to scan for visible values.
 * @param {string} [key='count'] - Numeric field to test for positive bars.
 * @returns {boolean} True when at least one bar has a positive value.
 */
export function usableBar(data, key = 'count') {
  if (!data || !Array.isArray(data) || data.length === 0) return false;
  return data.some((d) => (d[key] ?? 0) > 0);
}

/**
 * Converts score-band counts into positive Recharts pie/bar segments.
 *
 * @param {Record<string, number|string>} scoreDistribution - Map of score band label to count.
 * @returns {Array<{name: string, value: number}>} Positive-count score bands for Recharts.
 */
export function transformScoreDistribution(scoreDistribution) {
  if (!scoreDistribution || typeof scoreDistribution !== 'object') {
    return [];
  }
  return Object.entries(scoreDistribution)
    .map(([name, count]) => ({ name, value: Number(count) }))
    .filter((d) => d.value > 0);
}

/**
 * Converts tier counts into visible Recharts segments, excluding unknown tiers.
 *
 * @param {Record<string, number|string>} tierDistribution - Map of tier label to count.
 * @returns {Array<{name: string, value: number}>} Known tiers sorted by descending count.
 */
export function transformTierDistribution(tierDistribution) {
  if (!tierDistribution || typeof tierDistribution !== 'object') {
    return [];
  }
  return Object.entries(tierDistribution)
    .filter(([t]) => t && t !== 'Unknown')
    .map(([tier, count]) => ({ name: tier, value: Number(count) }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Converts risk counts into display labels for Recharts, excluding unknown risks.
 *
 * @param {Record<string, number|string>} riskDistribution - Map of lowercase risk label to count.
 * @returns {Array<{name: string, value: number}>} Risk bands with capitalized labels.
 */
export function transformRiskDistribution(riskDistribution) {
  if (!riskDistribution || typeof riskDistribution !== 'object') {
    return [];
  }
  return Object.entries(riskDistribution)
    .filter(([r]) => r && r !== 'unknown')
    .map(([risk, count]) => ({
      name: risk.charAt(0).toUpperCase() + risk.slice(1),
      value: Number(count),
    }));
}

/**
 * Normalizes weekly trend API rows for Recharts line-series keys.
 *
 * @param {Array<{ week: string, count: number|string, avg_score: number|string|null }>} weeklyTrend - API rows with `week`, `count`, and nullable `avg_score`.
 * @returns {Array<{period: string, count: number, averageScore: number}>} Weekly trend rows for line charts.
 */
export function transformWeeklyTrend(weeklyTrend) {
  if (!Array.isArray(weeklyTrend)) {
    return [];
  }
  return weeklyTrend.map((w) => ({
    period: w.week,
    count: Number(w.count),
    averageScore: w.avg_score !== null ? Number(w.avg_score) : 0,
  }));
}

/**
 * Keeps the top named industries and normalizes counts/average scores for charts.
 *
 * @param {Array<{ industry?: string|null, count: number|string, avg_score?: number|null }>} industryDistribution - API rows with industry, count, and average score.
 * @param {number} [limit=10] - Maximum number of named industries to include.
 * @returns {Array<{name: string, count: number, avgScore: number|null}>} Top industry rows excluding generic buckets.
 */
export function transformIndustryDistribution(industryDistribution, limit = 10) {
  if (!Array.isArray(industryDistribution)) {
    return [];
  }
  return industryDistribution
    .filter((d) => d.industry && d.industry !== 'other' && d.industry !== 'general')
    .slice(0, limit)
    .map((d) => ({ name: d.industry, count: Number(d.count), avgScore: d.avg_score ?? null }));
}

/**
 * Keeps the top named materials and normalizes counts for Recharts segments.
 *
 * @param {Array<{ material?: string|null, count: number|string }>} materialDistribution - API rows with `material` and `count`.
 * @param {number} [limit=8] - Maximum number of named materials to include.
 * @returns {Array<{name: string, value: number}>} Top material rows excluding unknown values.
 */
export function transformMaterialDistribution(materialDistribution, limit = 8) {
  return (materialDistribution || [])
    .filter((d) => d.material && d.material !== 'unknown')
    .slice(0, limit)
    .map((d) => ({ name: d.material, value: Number(d.count) }));
}

/**
 * Keeps the top named geographies and normalizes counts for Recharts segments.
 *
 * @param {Array<{ geo?: string|null, count: number|string }>} geoDistribution - API rows with `geo` and `count`.
 * @param {number} [limit=8] - Maximum number of named geographies to include.
 * @returns {Array<{name: string, value: number}>} Top geography rows excluding unknown values.
 */
export function transformGeoDistribution(geoDistribution, limit = 8) {
  return (geoDistribution || [])
    .filter((d) => d.geo && d.geo !== 'unknown')
    .slice(0, limit)
    .map((d) => ({ name: d.geo, value: Number(d.count) }));
}

/**
 * Keeps the top named business-scale buckets and normalizes counts for Recharts segments.
 *
 * @param {Array<{ scale?: string|null, count: number|string }>} scaleDistribution - API rows with `scale` and `count`.
 * @param {number} [limit=6] - Maximum number of named scale buckets to include.
 * @returns {Array<{name: string, value: number}>} Top scale rows excluding unknown values.
 */
export function transformScaleDistribution(scaleDistribution, limit = 6) {
  return (scaleDistribution || [])
    .filter((d) => d.scale && d.scale !== 'unknown')
    .slice(0, limit)
    .map((d) => ({ name: d.scale, value: Number(d.count) }));
}
