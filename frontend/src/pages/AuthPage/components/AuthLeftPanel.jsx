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
    <div className="hidden lg:flex flex-col h-full bg-transparent relative">
      {/* Subtle right border */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-(--color-border)" />

      {/* Top: Logo + Site Name */}
      <div className="flex items-center gap-3 p-6">
        <img src="/siteLogo.png" alt="Site Logo" className="h-7 w-auto" />
        <span className="font-(--font-display) text-sm text-(--color-text-primary)">
          {SITE_FULL_NAME}
        </span>
      </div>

      {/* Main content: vertically centered, left-aligned */}
      <div className="flex-1 flex flex-col justify-center px-6">
        {/* Eyebrow */}
        <p className="text-xs tracking-widest text-(--color-text-muted) uppercase font-(--font-body) mb-4">
          CIRCULAR ECONOMY ASSESSOR
        </p>

        {/* Headline */}
        <h1 className="font-(--font-display) text-4xl leading-tight text-(--color-text-primary) mb-3">
          Where circular economy
          <br />
          meets <em className="italic text-(--color-accent)">evidence.</em>
        </h1>

        {/* Subtitle */}
        <p className="text-sm text-(--color-text-secondary) mt-3 max-w-xs leading-relaxed">
          AI-powered evaluation grounded in 40,000+ real circular economy case studies and projects.
        </p>

        {/* Feature list */}
        <ul className="space-y-3 mt-8">
          {TRUST_SIGNALS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-(--color-accent-light)">
                <Icon size={12} className="text-(--color-accent)" strokeWidth={2} />
              </div>
              <span className="text-sm text-(--color-text-secondary)">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom: Horizontal rule + tagline */}
      <div className="p-6">
        <div className="h-px bg-(--color-border) mb-4" />
        <p className="text-xs text-(--color-text-muted)">
          Trusted by sustainability researchers and entrepreneurs worldwide.
        </p>
      </div>
    </div>
  );
}
