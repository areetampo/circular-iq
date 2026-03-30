export default function HeroSection() {
  return (
    <div className="text-center py-8 md:py-10">
      <p className="label-overline mb-4">AI-Powered · Evidence-Based · 40,000+ Cases</p>
      <h1
        className="heading-display max-w-2xl mx-auto leading-[1.1]"
        style={{ fontSize: 'clamp(32px, 5vw, 52px)' }}
      >
        Evaluate your circular
        <br className="hidden sm:block" /> economy initiative.
      </h1>
      <p
        className="mt-4 text-[15px] max-w-md mx-auto leading-relaxed"
        style={{ color: 'var(--muted)' }}
      >
        Get an evidence-backed circularity score in minutes, grounded in real-world case studies.
      </p>
    </div>
  );
}
