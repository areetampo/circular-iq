/**
 * Industry themes mapping industry to color schemes
 * Used for consistent visual presentation across the app
 */
export const INDUSTRY_THEMES = {
  agriculture: {
    color: 'success',
    selectedBg: 'bg-green-100',
    selectedText: 'text-green-800',
    selectedBorder: 'border-green-400',
    unselectedText: 'text-green-600',
    unselectedBorder: 'border-gray-200',
    hoverClasses: 'hover:bg-green-100 hover:text-green-800',
  },
  construction: {
    color: 'warning',
    selectedBg: 'bg-amber-100',
    selectedText: 'text-amber-800',
    selectedBorder: 'border-amber-400',
    unselectedText: 'text-amber-600',
    unselectedBorder: 'border-gray-200',
    hoverClasses: 'hover:bg-amber-100 hover:text-amber-800',
  },
  electronics: {
    color: 'accent',
    selectedBg: 'bg-indigo-100',
    selectedText: 'text-indigo-800',
    selectedBorder: 'border-indigo-400',
    unselectedText: 'text-indigo-600',
    unselectedBorder: 'border-gray-200',
    hoverClasses: 'hover:bg-indigo-100 hover:text-indigo-800',
  },
  energy: {
    color: 'danger',
    selectedBg: 'bg-rose-100',
    selectedText: 'text-rose-800',
    selectedBorder: 'border-rose-400',
    unselectedText: 'text-rose-600',
    unselectedBorder: 'border-gray-200',
    hoverClasses: 'hover:bg-rose-100 hover:text-rose-800',
  },
  manufacturing: {
    color: 'default',
    selectedBg: 'bg-slate-100',
    selectedText: 'text-slate-800',
    selectedBorder: 'border-slate-400',
    unselectedText: 'text-slate-600',
    unselectedBorder: 'border-gray-200',
    hoverClasses: 'hover:bg-slate-100 hover:text-slate-800',
  },
  packaging: {
    color: 'warning',
    selectedBg: 'bg-orange-100',
    selectedText: 'text-orange-800',
    selectedBorder: 'border-orange-400',
    unselectedText: 'text-orange-600',
    unselectedBorder: 'border-gray-200',
    hoverClasses: 'hover:bg-orange-100 hover:text-orange-800',
  },
  textiles: {
    color: 'accent',
    selectedBg: 'bg-teal-100',
    selectedText: 'text-teal-800',
    selectedBorder: 'border-teal-400',
    unselectedText: 'text-teal-600',
    unselectedBorder: 'border-gray-200',
    hoverClasses: 'hover:bg-teal-100 hover:text-teal-800',
  },
  transportation: {
    color: 'default',
    selectedBg: 'bg-blue-100',
    selectedText: 'text-blue-800',
    selectedBorder: 'border-blue-400',
    unselectedText: 'text-blue-600',
    unselectedBorder: 'border-gray-200',
    hoverClasses: 'hover:bg-blue-100 hover:text-blue-800',
  },
  waste_management: {
    color: 'success',
    selectedBg: 'bg-emerald-100',
    selectedText: 'text-emerald-800',
    selectedBorder: 'border-emerald-400',
    unselectedText: 'text-emerald-600',
    unselectedBorder: 'border-gray-200',
    hoverClasses: 'hover:bg-emerald-100 hover:text-emerald-800',
  },
  water: {
    color: 'accent',
    selectedBg: 'bg-cyan-100',
    selectedText: 'text-cyan-800',
    selectedBorder: 'border-cyan-400',
    unselectedText: 'text-cyan-600',
    unselectedBorder: 'border-gray-200',
    hoverClasses: 'hover:bg-cyan-100 hover:text-cyan-800',
  },
  general: {
    color: 'default',
    selectedBg: 'bg-gray-100',
    selectedText: 'text-gray-800',
    selectedBorder: 'border-gray-400',
    unselectedText: 'text-gray-600',
    unselectedBorder: 'border-gray-200',
    hoverClasses: 'hover:bg-gray-100 hover:text-gray-800',
  },
  other: {
    color: 'default',
    selectedBg: 'bg-neutral-100',
    selectedText: 'text-neutral-800',
    selectedBorder: 'border-neutral-400',
    unselectedText: 'text-neutral-600',
    unselectedBorder: 'border-neutral-200',
    hoverClasses: 'hover:bg-neutral-100 hover:text-neutral-800',
  },
};

/**
 * Get theme for an industry
 * @param {string} industry - The industry key
 * @returns {Object} Theme object with color and styles
 */
export function getIndustryTheme(industry) {
  return INDUSTRY_THEMES[industry] || INDUSTRY_THEMES.other;
}
