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
              className="text-[1.0625rem] leading-relaxed max-w-lg mx-auto mb-10 font-normal"
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
                    className="text-[1.75rem] font-semibold leading-none mb-2"
                    style={{
                      color: 'var(--color-text-primary)',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {value}
                  </p>
                  <p
                    className="text-[0.6875rem] leading-snug whitespace-pre-line"
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
      <div className="w-full flex items-center justify-center">
        <div className="flex items-center justify-center gap-6 flex-wrap py-5 mb-2 border-b-[1.5px] border-border w-4/5">
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
