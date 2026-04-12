import { useState } from 'react';

import DriftingShapesBackground from '@/components/background/DriftingShapesBackground';

import { AuthLeftPanel, AuthRightPanel } from './components';

export default function AuthPage() {
  const [view, setView] = useState('login');

  return (
    <div className="grid min-h-screen grid-cols-1 md_lg:grid-cols-2">
      <DriftingShapesBackground />
      <AuthLeftPanel className="hidden md_lg:block" /> {/* hidden on mobile */}
      <AuthRightPanel view={view} setView={setView} className="md_lg:col-span-1" />
    </div>
  );
}

AuthPage.propTypes = {};
