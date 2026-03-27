import Brand from '@/components/common/Brand';
import { BarChart3, CheckCircle2, Leaf, Zap } from 'lucide-react';

const TRUST_SIGNALS = [
  { icon: CheckCircle2, text: '40,000+ case studies indexed' },
  { icon: BarChart3, text: 'AI-powered multi-dimensional scoring' },
  { icon: Zap, text: 'Results in under 60 seconds' },
  { icon: Leaf, text: 'Grounded in real-world circular economy data' },
];

export default function AuthLeftPanel() {
  return (
    <div
      className="hidden md:flex flex-col justify-between h-full w-[52%] p-12 relative overflow-hidden"
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* Subtle decorative gradient blob — top right */}
      <div
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, oklch(0.68 0.08 68 / 0.12) 0%, transparent 70%)',
        }}
      />
      {/* Subtle gradient blob — bottom left */}
      <div
        className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, oklch(0.52 0.14 155 / 0.08) 0%, transparent 70%)',
        }}
      />

      {/* Top: Brand */}
      <div className="relative z-10">
        <Brand />
      </div>

      {/* Middle: editorial headline + trust signals */}
      <div className="relative z-10 space-y-8">
        <div>
          <p className="label-overline mb-4" style={{ color: 'var(--accent)' }}>
            CIRCULAR ECONOMY ASSESSOR
          </p>
          <h1
            className="heading-display"
            style={{ fontSize: 'clamp(28px, 3vw, 44px)', lineHeight: 1.1 }}
          >
            Where circular economy
            <br />
            meets{' '}
            <em className="italic" style={{ color: 'var(--accent)' }}>
              evidence.
            </em>
          </h1>
          <p
            className="mt-5 text-[15px] leading-relaxed max-w-xs"
            style={{ color: 'var(--muted)' }}
          >
            AI-powered evaluation grounded in 40,000+ real circular economy case studies and
            projects.
          </p>
        </div>

        {/* Trust signal list */}
        <ul className="space-y-3">
          {TRUST_SIGNALS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--accent-soft)' }}
              >
                <Icon size={14} style={{ color: 'var(--accent)' }} strokeWidth={2} />
              </div>
              <span className="text-[13px]" style={{ color: 'var(--foreground)' }}>
                {text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom: thin divider + tagline */}
      <div className="relative z-10">
        <div className="w-8 h-[1.5px] mb-4" style={{ backgroundColor: 'var(--accent)' }} />
        <p className="text-xs" style={{ color: 'var(--subtle)' }}>
          Trusted by sustainability researchers and entrepreneurs worldwide.
        </p>
      </div>
    </div>
  );
}
