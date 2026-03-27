import { Bot, ChartColumn, CircleCheck, Search } from 'lucide-react';

export const ASSESSMENT_METHODOLOGY_CONTENT = {
  title: 'Assessment Methodology',
  subtitle: 'How we evaluate circular economy initiatives',
  items: [
    {
      icon: Search,
      title: 'Semantic Analysis',
      description:
        'Uses OpenAI text-embedding-3-small (1536 dimensions) to find the most relevant projects matching your business model and problem space.',
      accentBorder: 'border-[var(--accent)]',
      gradientFrom: '',
      gradientTo: '',
      iconBg: '',
      iconColor: 'text-[var(--accent)]',
    },
    {
      icon: Bot,
      title: 'AI Reasoning',
      description:
        'GPT-4o-mini analyzes your submission against 3 similar cases with strict evidence-based reasoning and integrity checking.',
      accentBorder: 'border-[var(--accent)]',
      gradientFrom: '',
      gradientTo: '',
      iconBg: '',
      iconColor: 'text-[var(--accent)]',
    },
    {
      icon: ChartColumn,
      title: 'Multi-Dimensional Scoring',
      description:
        'Evaluates across 8 weighted parameters covering material innovation, circularity loops, market viability, and environmental impact.',
      accentBorder: 'border-[var(--accent)]',
      gradientFrom: '',
      gradientTo: '',
      iconBg: '',
      iconColor: 'text-[var(--accent)]',
    },
    {
      icon: CircleCheck,
      title: 'Integrity Validation',
      description:
        'Cross-references your self-assessed scores against real-world benchmarks to identify overestimations and provide honest feedback.',
      accentBorder: 'border-[var(--accent)]',
      gradientFrom: '',
      gradientTo: '',
      iconBg: '',
      iconColor: 'text-[var(--accent)]',
    },
  ],
};
