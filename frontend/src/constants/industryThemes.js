/**
 * Industry themes mapping industry to color schemes
 * Used for consistent visual presentation across the app
 */
export const INDUSTRY_THEMES = {
  agriculture: {
    color: 'success',
    selectedBg: 'bg-[var(--success-soft)]',
    selectedText: 'text-[var(--success)]',
    selectedBorder: 'border-[var(--success)]',
    unselectedText: 'text-[var(--success)]',
    unselectedBorder: 'border-[var(--border)]',
    hoverClasses: 'hover:bg-[var(--success-soft)] hover:text-[var(--success)]',
  },
  construction: {
    color: 'warning',
    selectedBg: 'bg-[var(--warning-soft)]',
    selectedText: 'text-[var(--warning)]',
    selectedBorder: 'border-[var(--warning)]',
    unselectedText: 'text-[var(--warning)]',
    unselectedBorder: 'border-[var(--border)]',
    hoverClasses: 'hover:bg-[var(--warning-soft)] hover:text-[var(--warning)]',
  },
  electronics: {
    color: 'accent',
    selectedBg: 'bg-[var(--accent-soft)]',
    selectedText: 'text-[var(--accent-soft-fg)]',
    selectedBorder: 'border-[var(--accent)]',
    unselectedText: 'text-[var(--accent-soft-fg)]',
    unselectedBorder: 'border-[var(--border)]',
    hoverClasses: 'hover:bg-[var(--accent-soft)] hover:text-[var(--accent-soft-fg)]',
  },
  energy: {
    color: 'danger',
    selectedBg: 'bg-[var(--danger-soft)]',
    selectedText: 'text-[var(--danger)]',
    selectedBorder: 'border-[var(--danger)]',
    unselectedText: 'text-[var(--danger)]',
    unselectedBorder: 'border-[var(--border)]',
    hoverClasses: 'hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]',
  },
  manufacturing: {
    color: 'default',
    selectedBg: 'bg-[var(--surface)]',
    selectedText: 'text-[var(--foreground)]',
    selectedBorder: 'border-[var(--border)]',
    unselectedText: 'text-[var(--muted)]',
    unselectedBorder: 'border-[var(--border)]',
    hoverClasses: 'hover:bg-[var(--surface)] hover:text-[var(--foreground)]',
  },
  packaging: {
    color: 'warning',
    selectedBg: 'bg-[var(--warning-soft)]',
    selectedText: 'text-[var(--warning)]',
    selectedBorder: 'border-[var(--warning)]',
    unselectedText: 'text-[var(--warning)]',
    unselectedBorder: 'border-[var(--border)]',
    hoverClasses: 'hover:bg-[var(--warning-soft)] hover:text-[var(--warning)]',
  },
  textiles: {
    color: 'accent',
    selectedBg: 'bg-[var(--accent-soft)]',
    selectedText: 'text-[var(--accent-soft-fg)]',
    selectedBorder: 'border-[var(--accent)]',
    unselectedText: 'text-[var(--accent-soft-fg)]',
    unselectedBorder: 'border-[var(--border)]',
    hoverClasses: 'hover:bg-[var(--accent-soft)] hover:text-[var(--accent-soft-fg)]',
  },
  transportation: {
    color: 'default',
    selectedBg: 'bg-[var(--surface)]',
    selectedText: 'text-[var(--foreground)]',
    selectedBorder: 'border-[var(--border)]',
    unselectedText: 'text-[var(--muted)]',
    unselectedBorder: 'border-[var(--border)]',
    hoverClasses: 'hover:bg-[var(--surface)] hover:text-[var(--foreground)]',
  },
  waste_management: {
    color: 'success',
    selectedBg: 'bg-[var(--success-soft)]',
    selectedText: 'text-[var(--success)]',
    selectedBorder: 'border-[var(--success)]',
    unselectedText: 'text-[var(--success)]',
    unselectedBorder: 'border-[var(--border)]',
    hoverClasses: 'hover:bg-[var(--success-soft)] hover:text-[var(--success)]',
  },
  water: {
    color: 'accent',
    selectedBg: 'bg-[var(--accent-soft)]',
    selectedText: 'text-[var(--accent-soft-fg)]',
    selectedBorder: 'border-[var(--accent)]',
    unselectedText: 'text-[var(--accent-soft-fg)]',
    unselectedBorder: 'border-[var(--border)]',
    hoverClasses: 'hover:bg-[var(--accent-soft)] hover:text-[var(--accent-soft-fg)]',
  },
  general: {
    color: 'default',
    selectedBg: 'bg-[var(--surface)]',
    selectedText: 'text-[var(--foreground)]',
    selectedBorder: 'border-[var(--border)]',
    unselectedText: 'text-[var(--muted)]',
    unselectedBorder: 'border-[var(--border)]',
    hoverClasses: 'hover:bg-[var(--surface)] hover:text-[var(--foreground)]',
  },
  other: {
    color: 'default',
    selectedBg: 'bg-[var(--surface)]',
    selectedText: 'text-[var(--foreground)]',
    selectedBorder: 'border-[var(--border)]',
    unselectedText: 'text-[var(--muted)]',
    unselectedBorder: 'border-[var(--border)]',
    hoverClasses: 'hover:bg-[var(--surface)] hover:text-[var(--foreground)]',
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
