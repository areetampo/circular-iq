/**
 * Sign-in and registration page with split brand and form panels.
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';

import DriftingShapesBackground from '@/components/background/DriftingShapesBackground';
import { ShootingStars } from '@/components/ui/shooting-stars';
import { StarsBackground } from '@/components/ui/stars-background';
import { Vortex } from '@/components/ui/vortex';
import { usePageTitle } from '@/hooks';

import { AuthLeftPanel, AuthRightPanel } from './components';

/**
 * Renders the auth page and keeps login/signup mode synchronized with the `view` query param.
 */
export default function AuthPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState('login');

  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'login' || viewParam === 'signup') {
      setView(viewParam);
    } else {
      setView('login');
      // Preserve router state so post-auth redirects survive invalid or missing view params.
      setSearchParams({ view: 'login' }, { state: location.state, replace: true });
    }
  }, [searchParams]); // Re-run whenever URL params change

  usePageTitle(view === 'signup' ? 'Sign Up' : 'Sign In');

  const handleViewChange = (newView) => {
    setView(newView);
    setSearchParams({ view: newView }, { state: location.state, replace: true });
  };

  return (
    <Vortex
      backgroundColor="transparent"
      baseHue={22}
      particleCount={150}
      baseSpeed={0.0}
      rangeSpeed={1.0}
      baseRadius={1.0}
      rangeRadius={2.0}
      rangeY={180}
      className="grid min-h-screen grid-cols-1 md_lg:grid-cols-2"
    >
      <ShootingStars
        starColor="#c2793a"
        trailColor="#e8c49a"
        minSpeed={8}
        maxSpeed={20}
        minDelay={2000}
        maxDelay={4000}
        starWidth={8}
        starHeight={1}
        className="z-0"
      />
      <StarsBackground
        starDensity={0.0008}
        allStarsTwinkle={true}
        twinkleProbability={0.6}
        minTwinkleSpeed={0.8}
        maxTwinkleSpeed={1.8}
        className="z-0"
      />
      <DriftingShapesBackground />
      <AuthLeftPanel /> {/* hidden on mobile */}
      <AuthRightPanel view={view} setView={handleViewChange} className="md_lg:col-span-1" />
    </Vortex>
  );
}

AuthPage.propTypes = {};
