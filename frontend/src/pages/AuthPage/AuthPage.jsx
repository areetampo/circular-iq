import { useState } from 'react';

import { AuthLeftPanel, AuthRightPanel } from './components';

export default function AuthPage() {
  const [view, setView] = useState('login');

  return (
    <div className="h-screen flex overflow-hidden">
      <AuthLeftPanel />
      <AuthRightPanel view={view} setView={setView} />
    </div>
  );
}

AuthPage.propTypes = {};
