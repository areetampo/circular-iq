import { Bot, ChartColumn, CircleCheck, Search } from 'lucide-react';

export const ASSESSMENT_METHODOLOGY_CONTENT = {
  items: [
    {
      icon: Search,
      title: 'Semantic Analysis',
      description:
        'Uses OpenAI text-embedding-3-small (1536 dimensions) to find the most relevant projects matching your business model and problem space.',
      accentBorder: 'border-blue-400',
      gradientFrom: 'from-blue-50',
      gradientTo: 'to-cyan-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      icon: Bot,
      title: 'AI Reasoning',
      description:
        'GPT-4o-mini analyzes your submission against 3 similar cases with strict evidence-based reasoning and integrity checking.',
      accentBorder: 'border-emerald-400',
      gradientFrom: 'from-emerald-50',
      gradientTo: 'to-green-50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      icon: ChartColumn,
      title: 'Multi-Dimensional Scoring',
      description:
        'Evaluates across 8 weighted parameters covering material innovation, circularity loops, market viability, and environmental impact.',
      accentBorder: 'border-orange-400',
      gradientFrom: 'from-orange-50',
      gradientTo: 'to-amber-50',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    {
      icon: CircleCheck,
      title: 'Integrity Validation',
      description:
        'Cross-references your self-assessed scores against real-world benchmarks to identify overestimations and provide honest feedback.',
      accentBorder: 'border-purple-400',
      gradientFrom: 'from-purple-50',
      gradientTo: 'to-pink-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
  ],
};
