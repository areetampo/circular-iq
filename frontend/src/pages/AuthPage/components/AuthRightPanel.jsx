import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';

import AuthMobileHeader from './AuthMobileHeader';

export default function AuthRightPanel({ view, setView }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-white p-8 md:p-16">
      <div className="w-full max-w-sm">
        {/* Mobile-only: mini editorial headline above the form */}
        <AuthMobileHeader />

        {/* Render the form — toggle between LoginForm / SignupForm as before */}
        {view === 'login' ? (
          <LoginForm onSwitchToSignup={() => setView('signup')} />
        ) : (
          <SignupForm onSwitchToLogin={() => setView('login')} />
        )}
      </div>
    </div>
  );
}
