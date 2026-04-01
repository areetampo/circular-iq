import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { SITE_FULL_NAME } from '@/components/common';

export default function AuthRightPanel({ view, setView }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 md:px-12 lg:px-16">
      <div className="w-full max-w-sm">
        {/* Mobile only: small logo + site name at top */}
        <div className="mb-8 md:hidden">
          <div className="flex items-center gap-3">
            <img src="/siteLogo.png" alt="Site Logo" className="h-7 w-auto" />
            <span className="text-sm font-medium text-(--color-text-primary)">
              {SITE_FULL_NAME}
            </span>
          </div>
        </div>

        {/* Form directly on background - no card wrapper */}
        {view === 'login' ? (
          <LoginForm onSwitchToSignup={() => setView('signup')} />
        ) : (
          <SignupForm onSwitchToLogin={() => setView('login')} />
        )}
      </div>
    </div>
  );
}
