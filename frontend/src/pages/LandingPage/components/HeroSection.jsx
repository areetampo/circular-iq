export default function HeroSection() {
  return (
    <div className="text-center pt-16 pb-8">
      {/* Eyebrow text */}
      <p className="text-xs tracking-widest text-(--color-text-muted) uppercase mb-4">
        AI-POWERED · EVIDENCE-BASED · 40,000+ CASES
      </p>

      {/* Main headline */}
      <h1 className="font-(--font-display) text-5xl md:text-6xl text-(--color-text-primary) leading-tight text-center max-w-4xl mx-auto">
        Evaluate Your Circular Economy Business
      </h1>

      {/* Subheadline */}
      <p className="text-base text-(--color-text-secondary) text-center max-w-lg mx-auto mt-3 leading-relaxed">
        Get an evidence-backed circularity score in minutes, grounded in real-world case studies.
      </p>
    </div>
  );
}
