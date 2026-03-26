import Brand from '@/components/common/Brand';

export default function AuthLeftPanel() {
  return (
    <div
      className="hidden md:flex flex-col justify-between w-[55%] p-12"
      style={{ backgroundColor: '#F6F1EA' }}
    >
      {/* Top: Brand */}
      <div>
        <Brand />
      </div>

      {/* Middle: Editorial headline */}
      <div>
        <p className="label-overline mb-4">CIRCULAR ECONOMY ASSESSOR</p>
        <h1
          className="heading-display leading-[1.1]"
          style={{ fontSize: 'clamp(32px, 3.5vw, 48px)' }}
        >
          Where circular economy
          <br />
          meets <em className="italic">evidence.</em>
        </h1>
        <p
          className="mt-5 text-[15px] max-w-xs leading-relaxed"
          style={{ color: 'var(--muted)' }}
        >
          AI-powered evaluation grounded in 40,000+ real circular economy case studies and
          projects.
        </p>
      </div>

      {/* Bottom: Trust signal */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          40,000+ case studies indexed
        </span>
      </div>
    </div>
  );
}
