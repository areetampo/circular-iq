/**
 * Left marketing panel on the auth page with brand and feature highlights.
 */

import { BarChart3, CheckCircle2, Leaf, Zap } from 'lucide-react';
import PropTypes from 'prop-types';

import { SiteHeroHeading } from '@/components/common';

import AuthBrandHeader from './AuthBrandHeader';
import AuthNavButtons from './AuthNavButtons';

/**
 * Renders the desktop-only auth brand panel with product proof points and navigation buttons.
 */
export default function AuthLeftPanel() {
  const AUTH_PAGE_POINTS = [
    { icon: CheckCircle2, text: '40,000+ case studies indexed' },
    { icon: BarChart3, text: 'AI-powered multi-dimensional scoring' },
    { icon: Zap, text: 'Results in under 60 seconds' },
    { icon: Leaf, text: 'Grounded in real-world circular economy data' },
  ];

  return (
    <div className="relative hidden min-h-screen flex-col justify-center gap-8 px-12 md_lg:flex lg:px-16">
      <AuthBrandHeader />

      <SiteHeroHeading className="text-center font-semibold **:text-[clamp(2rem,3.5vw,3.2rem)] **:leading-[1.15] **:tracking-[-0.02em]" />

      {/* Feature list with subtle icons */}
      <ul className="mx-auto -mt-4 max-w-md space-y-4">
        {AUTH_PAGE_POINTS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3 text-lg text-(--color-text-secondary)">
            <Icon size={16} strokeWidth={2.5} className="text-(--color-success)/75" />
            <span className="font-handwritten">{text}</span>
          </li>
        ))}
      </ul>

      <AuthNavButtons />
    </div>
  );
}

AuthLeftPanel.propTypes = {
  className: PropTypes.string,
};
