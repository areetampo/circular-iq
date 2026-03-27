import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';

import AuthMobileHeader from './AuthMobileHeader';

export default function AuthRightPanel({ view, setView }) {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center h-full overflow-y-auto p-8 md:p-12 min-h-screen md:min-h-full"
      style={{
        backgroundColor: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
      }}
    >
      <div className="w-full max-w-[360px]">
        <AuthMobileHeader />

        {/* Form card */}
        <div
          className="rounded-xl p-8"
          style={{
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
          }}
        >
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
