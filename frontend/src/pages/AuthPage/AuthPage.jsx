import React, { useState } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { SignupForm } from '@/components/auth/signup-form';

export default function AuthPage() {
  const [view, setView] = useState('login');

  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-svh bg-muted md:p-10">
      {view === 'login' ? (
        <LoginForm onSwitchToSignup={() => setView('signup')} />
      ) : (
        <SignupForm onSwitchToLogin={() => setView('login')} />
      )}
    </div>
  );
}
