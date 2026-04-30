import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import DriftingShapesBackground from '@/components/background/DriftingShapesBackground';

import { AuthLeftPanel, AuthRightPanel } from './components';

export default function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState('login');

  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'login' || viewParam === 'signup') {
      setView(viewParam);
    } else {
      setView('login');
      setSearchParams({ view: 'login' });
    }
  }, [searchParams]); // Re-run whenever URL params change

  const handleViewChange = (newView) => {
    setView(newView);
    setSearchParams({ view: newView });
  };

  return (
    <div className="grid min-h-screen grid-cols-1 md_lg:grid-cols-2">
      <DriftingShapesBackground />
      <AuthLeftPanel className="hidden md_lg:block" /> {/* hidden on mobile */}
      <AuthRightPanel view={view} setView={handleViewChange} className="md_lg:col-span-1" />
    </div>
  );
}

AuthPage.propTypes = {};
