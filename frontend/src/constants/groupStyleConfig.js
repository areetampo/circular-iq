/** Icons, subtitles, and Tailwind classes keyed by evaluation parameter group name. */

import { CircleDollarSign, Cpu, Users } from 'lucide-react';

import { cn } from '@/utils/cn.js';

import { parameterGroups } from './evaluationData.js';

/**
 * Parameter group style metadata used by landing-form accordions and score badges.
 * Each group provides an icon component, subtitle, and Tailwind classes for parameter chips.
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

/**
 * Fallback style metadata for unknown parameter keys or groups not found in `parameterGroups`.
 */
export const DEFAULT_CONFIG = {
  Icon: Cpu,
  iconColor: 'text-(--color-text-muted)',
  subtitle: '',
  paramBg: 'bg-(--color-accent-soft-ui)',
  paramTextColor: 'text-(--color-text-secondary)',
  paramBorder: 'border-(--color-border-ui)',
};

/**
 * Resolves chip styling for a scoring parameter.
 *
 * @param {string} paramKey - Evaluation parameter key such as `public_participation`; unmatched result labels use fallback styling.
 * @returns {string} Tailwind background, text-color, and border classes for the resolved group or fallback style.
 */
export function getParameterStyling(paramKey) {
  const category = Object.entries(parameterGroups).find(([, factors]) =>
    factors.includes(paramKey),
  )?.[0];
  const cfg = GROUP_STYLE_CONFIG[category] || DEFAULT_CONFIG;
  return cn(cfg.paramBg, cfg.paramTextColor, cfg.paramBorder);
}

/**
 * Resolves the progress-bar fill class for a scoring parameter.
 *
 * @param {string} paramKey - Evaluation parameter key such as `public_participation`.
 * @returns {string} Tailwind background-color class derived from the parameter group's text color.
 */
export function getProgressBarColor(paramKey) {
  const category = Object.entries(parameterGroups).find(([, factors]) =>
    factors.includes(paramKey),
  )?.[0];
  const cfg = GROUP_STYLE_CONFIG[category] || DEFAULT_CONFIG;
  return cfg.paramTextColor.replace('text-', 'bg-');
}
