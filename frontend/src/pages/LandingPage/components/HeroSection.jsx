import { motion } from 'framer-motion';
import { BookOpen, Target } from 'lucide-react';

import { Button, Tilt3D } from '@/components/common';

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
            <Tilt3D shadowMode="text">
              <h1 className="mb-6 font-display text-[clamp(38px,5.5vw,60px)] leading-[1.1] font-bold tracking-[-0.03em] text-(--color-text-primary)">
                Where circular economy meets <em className="text-accent-700 italic">evidence.</em>
              </h1>
            </Tilt3D>

            {/* Subtitle */}
            <p className="mx-auto mb-10 max-w-lg text-[1.0625rem] leading-relaxed font-normal text-(--color-text-muted)">
              Get an evidence-backed circularity score in seconds, grounded in real-world case
              studies.
            </p>

            {/* Trust signal strip */}
            <div className="mt-10 mb-8 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              {[
                { value: '40K+', label: 'Circular economy\ncases analysed' },
                { value: '97%', label: 'Confidence\nscore accuracy' },
                { value: '8', label: 'Weighted evaluation\ndimensions' },
              ].map(({ value, label }) => (
                <div key={value} className="text-center">
                  <Tilt3D
                    rotateRange={{ x: 20, y: 30 }}
                    block
                    shadowMode="text"
                    className="mb-2 font-sniglet text-[1.75rem] leading-none font-medium text-(--color-text-primary)"
                  >
                    {value}
                  </Tilt3D>
                  <p className="text-xs/snug whitespace-pre-line text-(--color-text-muted)">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Meta strip */}
      <div className="flex w-full items-center justify-center">
        <div className="mb-2 flex w-4/5 flex-wrap items-center justify-center gap-6 py-5">
          {[
            {
              key: 'assessment',
              label: 'Assessment Methodology',
              icon: BookOpen,
              onPress: openAssessmentMethodologyDrawer,
            },
            {
              key: 'evaluation',
              label: 'Evaluation Criteria',
              icon: Target,
              onPress: openEvaluationCriteriaDrawer,
            },
          ].map(({ key, label, icon: Icon, onPress }) => (
            <Button key={key} onPress={onPress} variant="ghost" icon={Icon} iconSize={14}>
              {label}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
}
