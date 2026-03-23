import { useState } from 'react';

import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';

export default function AuthPage() {
  const [view, setView] = useState('login');

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="relative z-10 px-4 w-full flex justify-center">
        {view === 'login' ? (
          <LoginForm onSwitchToSignup={() => setView('signup')} />
        ) : (
          <SignupForm onSwitchToLogin={() => setView('login')} />
        )}
      </div>
    </div>
  );
}

AuthPage.propTypes = {};
