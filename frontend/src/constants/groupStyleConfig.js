/**
 * @module groupStyleConfig
 * @description Styling configuration for parameter groups in the UI.
 * Provides icons, colors, and Tailwind classes for the three main parameter
 * categories: Access Value, Embedded Value, and Processing Value.
 */

import { CircleDollarSign, Cpu, Users } from 'lucide-react';

import { cn } from '@/utils/cn.js';

import { parameterGroups } from './evaluationData.js';

/**
 * Shared group style configuration for parameter-themed UI (icons + Tailwind classes).
 * @type {Object}
 */
export const GROUP_STYLE_CONFIG = {
  'Access Value': {
    Icon: Users,
    iconColor: 'text-(--color-info)',
    subtitle: 'Reach and participation across stakeholders',
    paramBg: 'bg-[oklch(0.28_0.05_150/_0.02)]',
    paramTextColor: 'text-(--color-info)',
    paramBorder: 'border-(--color-info-alpha-50)',
  },
  'Embedded Value': {
    Icon: CircleDollarSign,
    iconColor: 'text-(--color-accent)',
    subtitle: 'Material worth retained within the system',
    paramBg: 'bg-[oklch(0.96_0.014_68/_1)]',
    paramTextColor: 'text-(--color-accent)',
    paramBorder: 'border-(--color-accent-alpha-50)',
  },
  'Processing Value': {
    Icon: Cpu,
    iconColor: 'text-(--color-success)',
    subtitle: 'Efficiency and safety of circularity processes',
    paramBg: 'bg-[oklch(0.95_0.012_145/_0.4)]',
    paramTextColor: 'text-(--color-success)',
    paramBorder: 'border-(--color-success-alpha-50)',
  },
};

export const DEFAULT_CONFIG = {
  Icon: Cpu,
  iconColor: 'text-(--color-text-muted)',
  subtitle: '',
  paramBg: 'bg-(--color-accent-soft-ui)',
  paramTextColor: 'text-(--color-text-secondary)',
  paramBorder: 'border-(--color-border-ui)',
};

/**
 * Helper function to get parameter styling classes based on parameter key
 * @param {string} paramKey - The parameter key (e.g., 'public_participation')
 * @returns {string} - Combined Tailwind classes for background, text, and border
 */
export function getParameterStyling(paramKey) {
  const category = Object.entries(parameterGroups).find(([, factors]) =>
    factors.includes(paramKey),
  )?.[0];
  const cfg = GROUP_STYLE_CONFIG[category] || DEFAULT_CONFIG;
  return cn(cfg.paramBg, cfg.paramTextColor, cfg.paramBorder);
}

/**
 * Helper function to get progress bar background color based on parameter key
 * @param {string} paramKey - The parameter key (e.g., 'public_participation')
 * @returns {string} - Background color class for progress bar
 */
export function getProgressBarColor(paramKey) {
  const category = Object.entries(parameterGroups).find(([, factors]) =>
    factors.includes(paramKey),
  )?.[0];
  const cfg = GROUP_STYLE_CONFIG[category] || DEFAULT_CONFIG;
  return cfg.paramTextColor.replace('text-', 'bg-');
}
