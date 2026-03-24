import { useState } from 'react';

import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import Brand from '@/components/common/Brand';

export default function AuthPage() {
  const [view, setView] = useState('login');

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL — hidden on mobile */}
      <div
        className="hidden md:flex flex-col justify-between w-[55%] p-12"
        style={{ backgroundColor: '#F6F1EA' }}
      >
        {/* Top: Brand */}
        <div>
          <Brand />
        </div>

        {/* Middle: Editorial headline */}
        <div>
          <p className="label-overline mb-4">CIRCULAR ECONOMY ASSESSOR</p>
          <h1 className="heading-display text-[42px] sm:text-[48px] max-w-md">
            Where circular economy
            <br />
            meets <em style={{ fontStyle: 'italic' }}>evidence.</em>
          </h1>
          <p
            className="mt-5 text-[15px] max-w-xs leading-relaxed"
            style={{ color: 'var(--muted)' }}
          >
            AI-powered evaluation grounded in 40,000+ real circular economy case studies and
            projects.
          </p>
        </div>

        {/* Bottom: Trust signal */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            40,000+ case studies indexed
          </span>
        </div>
      </div>

      {/* RIGHT PANEL — form */}
      <div className="flex-1 flex items-center justify-center bg-white p-8 md:p-16">
        <div className="w-full max-w-sm">
          {/* Mobile-only: mini editorial headline above the form */}
          <div className="md:hidden mb-8">
            <h1 className="heading-display text-[28px]">
              Where circular economy
              <br />
              meets <em>evidence.</em>
            </h1>
            <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>
              AI-powered circular economy evaluation.
            </p>
          </div>

          {/* Render the form — toggle between LoginForm / SignupForm as before */}
          {view === 'login' ? (
            <LoginForm onSwitchToSignup={() => setView('signup')} />
          ) : (
            <SignupForm onSwitchToLogin={() => setView('login')} />
          )}
        </div>
      </div>
    </div>
  );
}

AuthPage.propTypes = {};
