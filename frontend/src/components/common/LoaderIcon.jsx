// styles (required)
import 'ldrs/react/Bouncy.css';
import 'ldrs/react/BouncyArc.css';
import 'ldrs/react/ChaoticOrbit.css';
import 'ldrs/react/DotStream.css';
import 'ldrs/react/DotWave.css';
import 'ldrs/react/Grid.css';
import 'ldrs/react/Helix.css';
import 'ldrs/react/Hourglass.css';
import 'ldrs/react/Infinity.css';
import 'ldrs/react/Jelly.css';
import 'ldrs/react/JellyTriangle.css';
import 'ldrs/react/Leapfrog.css';
import 'ldrs/react/LineWobble.css';
import 'ldrs/react/Metronome.css';
import 'ldrs/react/Mirage.css';
import 'ldrs/react/Momentum.css';
import 'ldrs/react/NewtonsCradle.css';
import 'ldrs/react/Orbit.css';
import 'ldrs/react/Pinwheel.css';
import 'ldrs/react/Quantum.css';
import 'ldrs/react/Reuleaux.css';
import 'ldrs/react/Ring2.css';
import 'ldrs/react/Spiral.css';
import 'ldrs/react/Superballs.css';
import 'ldrs/react/TailChase.css';
import 'ldrs/react/Treadmill.css';
import 'ldrs/react/Trefoil.css';
import 'ldrs/react/Trio.css';
import 'ldrs/react/Zoomies.css';

import {
  Bouncy,
  BouncyArc,
  ChaoticOrbit,
  DotStream,
  DotWave,
  Grid,
  Hourglass,
  Infinity as InfinityLoader,
  Jelly,
  JellyTriangle,
  Leapfrog,
  LineWobble,
  Metronome,
  Mirage,
  Momentum,
  NewtonsCradle,
  Orbit,
  Pinwheel,
  Quantum,
  Reuleaux,
  Ring2,
  Spiral,
  Superballs,
  TailChase,
  Treadmill,
  Trefoil,
  Trio,
  Zoomies,
} from 'ldrs/react';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

import { cn } from '@/utils/cn';

const LOADERS = [
  ({ color = '#10b981' }) => <Spiral size="40" speed="0.9" color={color || '#10b981'} />,
  ({ color = '#059669' }) => <Bouncy size="45" speed="1.75" color={color || '#059669'} />,
  ({ color = '#10b981' }) => <Ring2 size="40" stroke="5" speed="0.8" color={color || '#10b981'} />,
  ({ color = '#34d399' }) => <BouncyArc size="70" speed="1.65" color={color || '#34d399'} />,
  ({ color = '#10b981' }) => <Hourglass size="40" speed="1.75" color={color || '#10b981'} />,
  ({ color = '#059669' }) => (
    <LineWobble size="70" stroke="5" speed="1.75" color={color || '#059669'} />
  ),
  ({ color = '#10b981' }) => (
    <InfinityLoader size="55" stroke="4" speed="1.3" color={color || '#10b981'} />
  ),
  ({ color = '#10b981' }) => <Quantum size="40" speed="1.75" color={color || '#10b981'} />,
  ({ color = '#059669' }) => <Trio size="40" speed="1.3" color={color || '#059669'} />,
  ({ color = '#10b981' }) => <DotWave size="47" speed="1" color={color || '#10b981'} />,
  ({ color = '#34d399' }) => <Leapfrog size="40" speed="2.5" color={color || '#34d399'} />,
  ({ color = '#10b981' }) => <NewtonsCradle size="78" speed="1.4" color={color || '#10b981'} />,
  ({ color = '#059669' }) => <DotStream size="60" speed="2.5" color={color || '#059669'} />,
  ({ color = '#10b981' }) => <Metronome size="40" speed="1.6" color={color || '#10b981'} />,
  ({ color = '#34d399' }) => (
    <Pinwheel size="35" stroke="3.5" speed="0.9" color={color || '#34d399'} />
  ),
  ({ color = '#10b981' }) => <Jelly size="45" speed="1.75" color={color || '#10b981'} />,
  ({ color = '#059669' }) => <JellyTriangle size="45" speed="1.75" color={color || '#059669'} />,
  ({ color = '#34d399' }) => <Mirage size="45" speed="1.75" color={color || '#34d399'} />,
  ({ color = '#10b981' }) => <Momentum size="45" speed="1.75" color={color || '#10b981'} />,
  ({ color = '#059669' }) => <Superballs size="45" speed="1.75" color={color || '#059669'} />,
  ({ color = '#34d399' }) => <Orbit size="45" speed="1.75" color={color || '#34d399'} />,
  ({ color = '#10b981' }) => <ChaoticOrbit size="45" speed="1.75" color={color || '#10b981'} />,
  ({ color = '#059669' }) => <Grid size="45" speed="1.75" color={color || '#059669'} />,
  ({ color = '#34d399' }) => <Trefoil size="45" speed="1.75" color={color || '#34d399'} />,
  ({ color = '#10b981' }) => <Treadmill size="45" speed="1.75" color={color || '#10b981'} />,
  ({ color = '#059669' }) => <TailChase size="45" speed="1.75" color={color || '#059669'} />,
  ({ color = '#34d399' }) => <Reuleaux size="45" speed="1.75" color={color || '#34d399'} />,
  ({ color = '#10b981' }) => <Zoomies size="45" speed="1.75" color={color || '#10b981'} />,
];

const SWITCH_INTERVAL = 3000;
const FADE_DURATION = 400;

const getRandomIndex = (exclude) => {
  let idx;
  do {
    idx = Math.floor(Math.random() * LOADERS.length);
  } while (idx === exclude);
  return idx;
};

export default function LoaderIcon({ color = '', isButton = false }) {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * LOADERS.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);

      setTimeout(() => {
        setIndex((prev) => getRandomIndex(prev));
        setVisible(true);
      }, FADE_DURATION);
    }, SWITCH_INTERVAL);

    return () => clearInterval(timer);
  }, []);

  const Icon = LOADERS[index];

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-in-out flex items-center justify-center shrink-0',
        // If it's a button, use a small fixed square. If not, use the large 24x24 square.
        isButton ? 'h-5.5 w-5.5' : 'h-24 w-24 mx-auto',
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
      )}
    >
      {/* We scale the actual SVG down if it's in a button so the "70px" icons don't overflow */}
      <div className={cn(isButton && 'scale-[0.45] transform')}>
        <Icon color={color || ''} />
      </div>
    </div>
  );
}

LoaderIcon.propTypes = {
  color: PropTypes.string,
  isButton: PropTypes.bool,
};
