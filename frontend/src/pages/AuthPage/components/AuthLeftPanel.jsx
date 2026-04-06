import { BarChart3, CheckCircle2, Leaf, Zap } from 'lucide-react';

import AuthBrandHeader from './AuthBrandHeader';

const TRUST_SIGNALS = [
  { icon: CheckCircle2, text: '40,000+ case studies indexed' },
  { icon: BarChart3, text: 'AI-powered multi-dimensional scoring' },
  { icon: Zap, text: 'Results in under 60 seconds' },
  { icon: Leaf, text: 'Grounded in real-world circular economy data' },
];

export default function AuthLeftPanel() {
  return (
    <div className="hidden md_lg:flex flex-col justify-center px-12 lg:px-16 min-h-screen relative bg-(--color-bg) gap-8">
      <AuthBrandHeader />

      {/* Large editorial headline */}
      <h1 className="font-(--font-display) text-[clamp(2rem,4vw,3.2rem)] text-(--color-text-primary) leading-[1.15] tracking-[-0.02em] mb-6 text-center italic font-semibold">
        Where circular economy meets <em className="text-accent-700">evidence.</em>
      </h1>

      {/* Feature list with subtle icons */}
      <ul className="space-y-4 max-w-md mx-auto">
        {TRUST_SIGNALS.map(({ icon: Icon, text }) => (
          <li
            key={text}
            className="flex items-center gap-3 text-[15px] text-(--color-text-secondary)"
          >
            <div className="w-2 h-2 rounded-full bg-(--color-accent) opacity-60"></div>
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
