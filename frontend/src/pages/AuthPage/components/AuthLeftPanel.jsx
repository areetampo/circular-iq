import { BarChart3, CheckCircle2, Leaf, MoveRight, Telescope, TextSearch, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';

import { Button } from '@/components/common';

import AuthBrandHeader from './AuthBrandHeader';

const TRUST_SIGNALS = [
  { icon: CheckCircle2, text: '40,000+ case studies indexed' },
  { icon: BarChart3, text: 'AI-powered multi-dimensional scoring' },
  { icon: Zap, text: 'Results in under 60 seconds' },
  { icon: Leaf, text: 'Grounded in real-world circular economy data' },
];

export default function AuthLeftPanel() {
  return (
    <div className="relative hidden min-h-screen flex-col justify-center gap-8 bg-(--color-bg-alpha-50) px-12 md_lg:flex lg:px-16">
      <AuthBrandHeader />

      {/* Large editorial headline */}
      <h1 className="mb-6 text-center font-display text-[clamp(2rem,4vw,3.2rem)] leading-[1.15] font-semibold tracking-[-0.02em] text-(--color-text-primary) italic">
        Where circular economy meets <em className="text-accent-700">evidence.</em>
      </h1>

      {/* Feature list with subtle icons */}
      <ul className="mx-auto max-w-md space-y-4">
        {TRUST_SIGNALS.map(({ icon: Icon, text }) => (
          <li
            key={text}
            className="flex items-center gap-3 text-[0.9375rem] text-(--color-text-secondary)"
          >
            <div className="size-2 rounded-full bg-(--color-accent) opacity-60"></div>
            {text}
          </li>
        ))}
      </ul>

      {/* Buttons */}
      <div className="flex flex-col items-center justify-center gap-3">
        <Button variant="results-action" as={HashLink} to="/#ce-assessment-form" smooth>
          <MoveRight size={16} strokeWidth={2} />
          <span>Start an Assessment</span>
        </Button>
        <div className="flex items-center justify-center gap-3">
          <Button variant="success-soft" as={Link} to="/guide">
            <TextSearch size={16} strokeWidth={2} />
            <span>View Guide</span>
          </Button>
          <Button variant="success-soft" as={Link} to="/solutions">
            <Telescope size={16} strokeWidth={2} />
            <span>Explore Solutions</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
