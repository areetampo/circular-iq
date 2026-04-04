import { CircleDollarSign, Cpu, Users } from 'lucide-react';

// Shared group style configuration for parameter-themed UI (icons + Tailwind classes)
export const GROUP_STYLE_CONFIG = {
  'Access Value': {
    Icon: Users,
    // Icon colour — use a token class or inline style
    // We can't use arbitrary tokens as class names easily, so use a data attr approach:
    iconColor: 'text-[var(--color-info)]',
    subtitle: 'Reach and participation across stakeholders',
    // Label chip for the parameter (e.g. "Public Participation")
    paramBg: 'bg-[oklch(0.28_0.05_150/_0.02)]', // cool dark-greenish
    paramTextColor: 'text-[oklch(0.28_0.05_150/_0.65)]',
  },
  'Embedded Value': {
    Icon: CircleDollarSign,
    iconColor: 'text-[var(--color-accent)]',
    subtitle: 'Material worth retained within the system',
    paramBg: 'bg-[oklch(0.96_0.014_68/_1)]', // warm amber-cream
    paramTextColor: 'text-[var(--color-accent)]',
  },
  'Processing Value': {
    Icon: Cpu,
    iconColor: 'text-[var(--color-success)]',
    subtitle: 'Efficiency and safety of circularity processes',
    paramBg: 'bg-[oklch(0.95_0.012_145/_0.4)]', // muted sage
    paramTextColor: 'text-[var(--color-success)]',
  },
};

export const DEFAULT_CONFIG = {
  Icon: Cpu,
  iconColor: 'text-[var(--color-text-muted)]',
  subtitle: '',
  paramBg: 'bg-[var(--color-accent-soft)]',
  paramTextColor: 'text-[var(--color-text-secondary)]',
};
