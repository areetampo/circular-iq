import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';

import AuthMobileHeader from './AuthMobileHeader';

export default function AuthRightPanel({ view, setView }) {
  return (
    <div
      className="w-1/2 flex flex-col items-center justify-center h-full overflow-y-auto px-12 py-10"
      style={{
        backgroundColor: 'var(--background)',
        borderLeft: '1px solid var(--border)',
      }}
    >
      <div className="w-full max-w-sm">
        {/* Mobile header — renders only on mobile, hidden md+ */}
        <AuthMobileHeader />

        {/* Form directly on background — no card wrapper */}
        {view === 'login' ? (
          <LoginForm onSwitchToSignup={() => setView('signup')} />
        ) : (
          <SignupForm onSwitchToLogin={() => setView('login')} />
        )}
      </div>
    </div>
  );
}
