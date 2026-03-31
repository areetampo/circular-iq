import { useState } from 'react';

import { AuthLeftPanel, AuthRightPanel } from './components';

export default function AuthPage() {
  const [view, setView] = useState('login');

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left panel - 55% width, hidden on mobile */}
      <div className="hidden lg:flex lg:w-[55%] h-full">
        <AuthLeftPanel />
      </div>

      {/* Right panel - 45% width on desktop, full width on mobile */}
      <div className="w-full lg:w-[45%] h-full">
        <AuthRightPanel view={view} setView={setView} />
      </div>
    </div>
  );
}

AuthPage.propTypes = {};
