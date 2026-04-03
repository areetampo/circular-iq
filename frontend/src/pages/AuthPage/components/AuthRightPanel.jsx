import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';

export default function AuthRightPanel({ view, setView }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[rgba(250,247,242,0.6)] border-l border-[rgba(180,160,130,0.18)] md:border-l-0 px-8 md:px-12 lg:px-16">
      <div className="w-full max-w-105 md:max-w-md lg:max-w-105">
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
