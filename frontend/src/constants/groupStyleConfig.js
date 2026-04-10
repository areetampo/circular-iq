import { CircleDollarSign, Cpu, Users } from 'lucide-react';

// Shared group style configuration for parameter-themed UI (icons + Tailwind classes)
export const GROUP_STYLE_CONFIG = {
  'Access Value': {
    Icon: Users,
    iconColor: 'text-(--color-info)',
    subtitle: 'Reach and participation across stakeholders',
    paramBg: 'bg-[oklch(0.28_0.05_150/_0.02)]',
    paramTextColor: 'text-[oklch(0.28_0.05_150/_0.65)]',
    paramBorder: 'border-[oklch(0.28_0.05_150/_0.25)]',
  },
  'Embedded Value': {
    Icon: CircleDollarSign,
    iconColor: 'text-(--color-accent)',
    subtitle: 'Material worth retained within the system',
    paramBg: 'bg-[oklch(0.96_0.014_68/_1)]',
    paramTextColor: 'text-(--color-accent)',
    paramBorder: 'border-(--color-accent)/50',
  },
  'Processing Value': {
    Icon: Cpu,
    iconColor: 'text-(--color-success)',
    subtitle: 'Efficiency and safety of circularity processes',
    paramBg: 'bg-[oklch(0.95_0.012_145/_0.4)]',
    paramTextColor: 'text-[var(--color-success)]',
    paramBorder: 'border-(--color-success)/50',
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
