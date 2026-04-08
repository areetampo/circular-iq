import { motion } from 'framer-motion';
import { BookOpen, Target } from 'lucide-react';

import { Button } from '@/components/common';

export default function HeroSection({
  openAssessmentMethodologyDrawer,
  openEvaluationCriteriaDrawer,
}) {
  return (
    <>
      {/* Hero */}
      <section className="pt-20 pb-0">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            {/* Main heading */}
            <h1 className="text-[var(--foreground)]; mb-6 font-display text-[clamp(38px,5.5vw,60px)] leading-[1.1] font-bold tracking-[-0.03em]">
              Where circular economy meets <em className="text-accent-700 italic">evidence.</em>
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mb-10 max-w-lg text-[1.0625rem] leading-relaxed font-normal text-(--color-text-muted)">
              Get an evidence-backed circularity score in seconds, grounded in real-world case
              studies.
            </p>

            {/* Trust signal strip — 3 statistics, editorial style */}
            <div className="mt-10 mb-8 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              {[
                { value: '40K+', label: 'Circular economy\ncases analysed' },
                { value: '97%', label: 'Confidence\nscore accuracy' },
                { value: '8', label: 'Weighted evaluation\ndimensions' },
              ].map(({ value, label }) => (
                <div key={value} className="text-center">
                  <p className="mb-2 text-[1.75rem] leading-none font-semibold text-(--color-text-primary)">
                    {value}
                  </p>
                  <p className="text-[0.6875rem] leading-snug whitespace-pre-line text-(--color-text-muted)">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Meta strip — Assessment Methodology · features · Evaluation Criteria */}
      <div className="flex w-full items-center justify-center">
        <div className="mb-2 flex w-4/5 flex-wrap items-center justify-center gap-6 py-5">
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
            <Button key={key} onClick={onClick} variant="ghost">
              <Icon size={12} />
              {label}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
}
