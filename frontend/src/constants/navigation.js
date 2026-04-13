/**
 * Navigation constants for the application
 */

import { formatTimestamp } from '@/lib/formatting';

export const navigationItems = [
  { id: 'assessments', name: 'My Assessments', path: '/assessments' },
  { id: 'dashboard', name: 'Dashboard', path: '/dashboard' },
  { id: 'guide', name: 'Guide', path: '/guide' },
  { id: 'share', name: 'Share', path: '/assessments/share' },
  { id: 'compare', name: 'Compare', path: '/assessments/compare' },
];

export const navItemsSecondary = [
  {
    id: 'unsaved-results',
    name: 'Recover Calculation',
    path: '/results',
    type: 'link',
    condition: 'hasResults',
    tooltipEnabled: 'View the results of your last calculation',
    tooltipDisabled: 'No previous calculation results found to display',
  },
];

/**
 * Get tooltip text for navItemsSecondary based on session data
 * @param {Object} item - Navigation item
 * @param {Object} sessionData - Session data from getSession()
 * @returns {string} Tooltip text
 */
export function getTooltipTextForNavItemsSecondary(item, sessionData) {
  const hasResults = Boolean(sessionData?.results);
  const isDisabled = item.condition === 'hasResults' && !hasResults;

  if (isDisabled) return item.tooltipDisabled;
  if (hasResults && sessionData?.results?.processing_info?.timestamp) {
    const formattedTimestamp = formatTimestamp(sessionData.results.processing_info.timestamp);
    return `View the results of your last calculation\nfrom [${formattedTimestamp}]`;
  }
  return item.tooltipEnabled;
}
