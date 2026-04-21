import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { cn } from '@/utils/cn';

import AuthBrandHeader from './AuthBrandHeader';

export default function AuthRightPanel({ view, setView }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 md:px-12 lg:px-16">
      <AuthBrandHeader className={cn('md_lg:hidden', view === 'login' && '-mt-36')} layout="row" />
      <div className="w-full max-w-105 md:max-w-md lg:max-w-105">
        {view === 'login' ? (
          <LoginForm onSwitchToSignup={() => setView('signup')} />
        ) : (
          <SignupForm onSwitchToLogin={() => setView('login')} />
        )}
      </div>
    </div>
  );
}
