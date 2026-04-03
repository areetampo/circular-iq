import { useState } from 'react';

import { AuthLeftPanel, AuthRightPanel } from './components';

export default function AuthPage() {
  const [view, setView] = useState('login');

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <AuthLeftPanel className="hidden md:block" /> {/* hidden on mobile */}
      <AuthRightPanel view={view} setView={setView} /> {/* full width on mobile */}
    </div>
  );
}

AuthPage.propTypes = {};
