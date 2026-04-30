import { useEffect, useRef } from 'react';

import { cn } from '@/utils/cn';

import { AuthBrandHeader, LoginForm, SignupForm } from './index';

export default function AuthRightPanel({ view, setView }) {
  const formRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Enter') return;
      if (document.activeElement?.tagName === 'BUTTON' && document.activeElement?.type === 'submit')
        return;

      formRef.current?.click(); // <-- click() instead of submit()
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 md:px-12 lg:px-16">
      <AuthBrandHeader className={cn('md_lg:hidden', view === 'login' && '-mt-36')} layout="row" />
      <div className="w-full max-w-105 md:max-w-md lg:max-w-105">
        {view === 'login' ? (
          <LoginForm ref={formRef} onSwitchToSignup={() => setView('signup')} />
        ) : (
          <SignupForm ref={formRef} onSwitchToLogin={() => setView('login')} />
        )}
      </div>
    </div>
  );
}
