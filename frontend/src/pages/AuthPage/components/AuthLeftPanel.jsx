import { BarChart3, CheckCircle2, Leaf, Zap } from 'lucide-react';

import { SITE_FULL_NAME } from '@/components/common';

const TRUST_SIGNALS = [
  { icon: CheckCircle2, text: '40,000+ case studies indexed' },
  { icon: BarChart3, text: 'AI-powered multi-dimensional scoring' },
  { icon: Zap, text: 'Results in under 60 seconds' },
  { icon: Leaf, text: 'Grounded in real-world circular economy data' },
];

export default function AuthLeftPanel() {
  return (
    <div className="hidden md:flex relative bg-(--color-bg)">
      {/* Logo + brand name centered vertically, ~40px below top */}
      <div className="absolute top-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
        <img src="/siteLogo.png" alt="Site Logo" className="h-10 w-auto mb-2" />
        <span className="font-(--font-display) text-[22px] text-(--color-text-primary)">
          {SITE_FULL_NAME}
        </span>
      </div>

      {/* Content vertically centered */}
      <div className="flex flex-col justify-center px-12 lg:px-16 min-h-screen">
        {/* Eyebrow */}
        <p className="text-xs tracking-widest uppercase text-(--color-text-muted) mb-4 text-center">
          AI-POWERED · EVIDENCE-BASED · 40,000+ CASES
        </p>

        {/* Large editorial headline */}
        <h1 className="font-(--font-display) text-[clamp(2rem,4vw,3.2rem)] text-(--color-text-primary) leading-[1.15] tracking-[-0.02em] mb-6 text-center">
          Where circular economy meets{' '}
          <em className="not-italic text-(--color-accent)">evidence.</em>
        </h1>

        {/* Subheadline */}
        <p className="text-[15px] text-(--color-text-secondary) leading-relaxed mb-12 max-w-md mx-auto text-center">
          AI-powered evaluation grounded in 40,000+ real circular economy case studies and projects.
        </p>

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

      {/* Footer attribution text at bottom-left */}
      <div className="absolute bottom-8 left-12 lg:left-16">
        <p className="text-[12px] text-(--color-text-muted)">
          Trusted by sustainability researchers and entrepreneurs worldwide.
        </p>
      </div>
    </div>
  );
}
