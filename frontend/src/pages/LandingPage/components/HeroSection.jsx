import { motion } from 'framer-motion';
import { BookOpen, Target } from 'lucide-react';

export default function HeroSection({
  openAssessmentMethodologyDrawer,
  openEvaluationCriteriaDrawer,
}) {
  return (
    <>
      {/* Hero */}
      <section className="pt-20 pb-0">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            {/* Main heading */}
            <h1
              className="heading-display leading-[1.08] mb-6"
              style={{ fontSize: 'clamp(38px, 5.5vw, 60px)' }}
            >
              Where circular economy
              <br />
              meets{' '}
              <em className="italic" style={{ color: 'var(--color-accent-700)' }}>
                evidence.
              </em>
            </h1>

            {/* Subtitle */}
            <p
              className="text-[17px] leading-relaxed max-w-lg mx-auto mb-10 font-normal"
              style={{ color: 'var(--muted)' }}
            >
              Get an evidence-backed circularity score in seconds, grounded in real-world case
              studies.
            </p>

            {/* Trust signal strip — 3 statistics, editorial style */}
            <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap mt-10 mb-8">
              {[
                { value: '40K+', label: 'Circular economy\ncases analysed' },
                { value: '97%', label: 'Confidence\nscore accuracy' },
                { value: '8', label: 'Weighted evaluation\ndimensions' },
              ].map(({ value, label }) => (
                <div key={value} className="text-center">
                  <p
                    className="text-[28px] font-semibold leading-none mb-1"
                    style={{
                      color: 'var(--color-text-primary)',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {value}
                  </p>
                  <p
                    className="text-[11px] leading-snug whitespace-pre-line"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Meta strip — Assessment Methodology · features · Evaluation Criteria */}
      <div className="flex items-center justify-center gap-10 flex-wrap py-5 mb-2 border-b-[1.5px] border-border">
        {[
          {
            key: 'assessment',
            label: 'Assessment Methodology',
            icon: BookOpen,
            onClick: openAssessmentMethodologyDrawer,
          },
          {
            key: 'evaluation',
            label: 'Evaluation Criteria',
            icon: Target,
            onClick: openEvaluationCriteriaDrawer,
          },
        ].map(({ key, label, icon: Icon, onClick }) => (
          <button
            key={key}
            onClick={onClick}
            className="flex items-center gap-1.5 text-[11px] tracking-widest cursor-pointer uppercase bg-accent-50 px-3 py-2 rounded-xl
             transition-colors hover:text-(--foreground) hover:bg-slate-50/50 hover:shadow-sm"
            style={{ color: 'var(--muted)' }}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
