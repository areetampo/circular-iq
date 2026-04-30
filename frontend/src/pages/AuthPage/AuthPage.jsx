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
      // Set default view to login and update URL if no valid view parameter exists
      setView('login');
      setSearchParams({ view: 'login' });
    }
  }, []); // Run only once on mount

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
