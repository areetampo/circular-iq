import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';

import AuthMobileHeader from './AuthMobileHeader';

export default function AuthRightPanel({ view, setView }) {
  return (
    <div className="bg-transparent flex flex-col items-center justify-center h-full overflow-y-auto px-8">
      <div className="w-full max-w-sm mx-auto">
        {/* Mobile header - logo + site name above form on mobile */}
        <div className="lg:hidden mb-8">
          <AuthMobileHeader />
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
