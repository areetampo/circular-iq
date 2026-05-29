/**
 * Landing hero with animated background, CTAs, and links to methodology drawers.
 */

import { motion } from 'framer-motion';
import { BookOpen, Target } from 'lucide-react';
import PropTypes from 'prop-types';

import { Button, Tilt3D, SiteHeroHeading } from '@/components/common';
import { ShootingStars } from '@/components/ui/shooting-stars';
import { StarsBackground } from '@/components/ui/stars-background';
import { TextGenerateEffect } from '@/components/ui/text-generate-effect';
import { Vortex } from '@/components/ui/vortex';

/**
 * Renders the landing hero, trust metrics, and methodology drawer actions.
 */
export default function HeroSection({
  openAssessmentMethodologyDrawer,
  openEvaluationCriteriaDrawer,
}) {
  return (
    <>
      {/* Hero */}
      <section className="pt-20 pb-0">
        <ShootingStars
          starColor="#c2793a"
          trailColor="#e8c49a"
          minSpeed={8}
          maxSpeed={20}
          minDelay={2000}
          maxDelay={4000}
          starWidth={8}
          starHeight={1}
          className="z-0"
        />
        <StarsBackground
          starDensity={0.0008}
          allStarsTwinkle={true}
          twinkleProbability={0.6}
          minTwinkleSpeed={0.8}
          maxTwinkleSpeed={1.8}
          className="z-0"
        />
        <Vortex
          backgroundColor="transparent"
          baseHue={22}
          particleCount={300}
          baseSpeed={0.0}
          rangeSpeed={1.0}
          baseRadius={1.0}
          rangeRadius={2.0}
          rangeY={180}
        >
          <div className="mx-auto max-w-3xl px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            >
              {/* Hero heading */}
              <SiteHeroHeading className="font-bold **:text-[clamp(38px,5.5vw,60px)] **:leading-[1.1] **:tracking-[-0.03em]" />

              {/* Subtitle */}
              <TextGenerateEffect
                words="Get an evidence-backed circularity score in seconds, grounded in real-world case studies."
                className="mx-auto mb-10 max-w-lg text-center text-[1.0625rem] leading-relaxed text-(--color-text-muted)"
                duration={0.65}
              />

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
        </Vortex>
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

HeroSection.propTypes = {
  openAssessmentMethodologyDrawer: PropTypes.func.isRequired,
  openEvaluationCriteriaDrawer: PropTypes.func.isRequired,
};
