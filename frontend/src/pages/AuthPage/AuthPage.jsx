import { useState } from 'react';

import { AuthLeftPanel, AuthRightPanel } from './components';

export default function AuthPage() {
  const [view, setView] = useState('login');

  return (
    <div className="min-h-screen grid grid-cols-1 md_lg:grid-cols-2">
      <AuthLeftPanel className="hidden md_lg:block" /> {/* hidden on mobile */}
      <AuthRightPanel
        view={view}
        setView={setView}
        className="md:col-span-full md_lg:col-span-1"
      />{' '}
      {/* full width on medium, normal on larger */}
    </div>
  );
}

AuthPage.propTypes = {};
