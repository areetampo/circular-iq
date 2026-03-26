import { useState } from 'react';

import { AuthLeftPanel, AuthRightPanel } from './components';

export default function AuthPage() {
  const [view, setView] = useState('login');

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL — hidden on mobile */}
      <AuthLeftPanel />

      {/* RIGHT PANEL — form */}
      <AuthRightPanel view={view} setView={setView} />
    </div>
  );
}

AuthPage.propTypes = {};
