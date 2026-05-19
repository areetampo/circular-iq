/**
 * @module AuthLeftPanel
 * @description Left marketing panel on the auth page with brand and feature highlights.
 */

import { BarChart3, CheckCircle2, Leaf, MoveRight, Telescope, TextSearch, Zap } from 'lucide-react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';

import { Button, Tilt3D } from '@/components/common';
import { FlipWords } from '@/components/ui/flip-words';
import { cn } from '@/utils/cn';

import AuthBrandHeader from './AuthBrandHeader';

/**
 * Left marketing panel on the auth page with brand and feature highlights.
 * @returns {import('react').ReactElement}
 */
export default function AuthLeftPanel({ className }) {
  return (
    <div
      className={cn(
        'relative hidden min-h-screen flex-col justify-center gap-8 px-12 md_lg:flex lg:px-16',
        className,
      )}
    >
      <AuthBrandHeader />

      {/* Large editorial headline */}
      <Tilt3D shadowMode="text">
        <h1 className="mb-6 text-center font-semibold **:font-display **:text-[clamp(2rem,3.5vw,3.2rem)] **:leading-[1.15] **:tracking-[-0.02em]">
          <span className="block text-(--color-text-primary)">Where circular economy</span>
          <FlipWords
            words={['meets evidence.', 'drives impact.', 'builds purpose.', 'creates value.']}
            duration={2000}
            className="text-orange-700 italic"
          />
        </h1>
      </Tilt3D>

      {/* Feature list with subtle icons */}
      <ul className="mx-auto -mt-4 max-w-md space-y-4">
        {[
          { icon: CheckCircle2, text: '40,000+ case studies indexed' },
          { icon: BarChart3, text: 'AI-powered multi-dimensional scoring' },
          { icon: Zap, text: 'Results in under 60 seconds' },
          { icon: Leaf, text: 'Grounded in real-world circular economy data' },
        ].map(({ icon: Icon, text }) => (
          <li
            key={text}
            className="flex items-center gap-3 text-[0.9375rem] text-(--color-text-secondary)"
          >
            <Icon size={16} strokeWidth={2} className="text-(--color-success)/75" />
            {text}
          </li>
        ))}
      </ul>

      {/* Buttons */}
      <div className="flex flex-col items-center justify-center gap-3">
        <Button variant="bordered" as={HashLink} to="/#ce-assessment-form" smooth icon={MoveRight}>
          Start an Assessment
        </Button>
        <div className="flex items-center justify-center gap-3">
          <Button variant="success-soft" as={Link} to="/guide" icon={TextSearch}>
            View Guide
          </Button>
          <Button variant="success-soft" as={Link} to="/solutions" icon={Telescope}>
            Explore Solutions
          </Button>
        </div>
      </div>
    </div>
  );
}

AuthLeftPanel.propTypes = {
  className: PropTypes.string,
};
