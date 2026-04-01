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
    <div className="hidden md:flex relative bg-transparent border-r border-(--color-border)">
      {/* Top-left logo */}
      <div className="absolute top-6 left-8 flex items-center gap-3">
        <img src="/siteLogo.png" alt="Site Logo" className="h-7 w-auto" />
        <span className="text-sm font-medium text-(--color-text-primary)">{SITE_FULL_NAME}</span>
      </div>

      {/* Content vertically centered */}
      <div className="flex flex-col justify-center px-12 lg:px-16 min-h-screen">
        {/* Eyebrow */}
        <p className="text-xs tracking-widest uppercase text-(--color-text-muted) mb-4">
          AI-POWERED · EVIDENCE-BASED · 40,000+ CASES
        </p>

        {/* Headline */}
        <h1 className="font-(--font-display) text-4xl lg:text-5xl text-(--color-text-primary) leading-tight mb-4">
          Where circular economy meets{' '}
          <em className="not-italic text-(--color-accent)">evidence.</em>
        </h1>

        {/* Subtitle */}
        <p className="text-sm text-(--color-text-secondary) leading-relaxed mb-8 max-w-sm">
          AI-powered evaluation grounded in 40,000+ real circular economy case studies and projects.
        </p>

        {/* Feature list */}
        <ul className="space-y-3">
          {TRUST_SIGNALS.map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="flex items-center gap-3 text-sm text-(--color-text-secondary)"
            >
              <div className="w-5 h-5 flex items-center justify-center text-(--color-accent)">
                <Icon size={14} strokeWidth={2} />
              </div>
              {text}
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom tagline */}
      <div className="absolute bottom-6 left-8">
        <p className="text-xs text-(--color-text-muted)">
          Trusted by sustainability researchers and entrepreneurs worldwide.
        </p>
      </div>
    </div>
  );
}
