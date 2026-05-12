// styles (required)
import 'ldrs/react/Bouncy.css';
import 'ldrs/react/BouncyArc.css';
import 'ldrs/react/DotPulse.css';
import 'ldrs/react/DotStream.css';
import 'ldrs/react/DotWave.css';
import 'ldrs/react/Grid.css';
import 'ldrs/react/Hourglass.css';
import 'ldrs/react/Infinity.css';
import 'ldrs/react/Jelly.css';
import 'ldrs/react/Leapfrog.css';
import 'ldrs/react/LineWobble.css';
import 'ldrs/react/Metronome.css';
import 'ldrs/react/Mirage.css';
import 'ldrs/react/Momentum.css';
import 'ldrs/react/NewtonsCradle.css';
import 'ldrs/react/Orbit.css';
import 'ldrs/react/Pinwheel.css';
import 'ldrs/react/Quantum.css';
import 'ldrs/react/Ring2.css';
import 'ldrs/react/Treadmill.css';
import 'ldrs/react/Trio.css';
import 'ldrs/react/Zoomies.css';

import {
  Bouncy,
  BouncyArc,
  DotPulse,
  DotStream,
  DotWave,
  Grid,
  Hourglass,
  Infinity as InfinityLoader,
  Jelly,
  Leapfrog,
  LineWobble,
  Metronome,
  Mirage,
  Momentum,
  NewtonsCradle,
  Orbit,
  Pinwheel,
  Quantum,
  Ring2,
  Treadmill,
  Trio,
  Zoomies,
} from 'ldrs/react';
import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';

import { cn } from '@/utils/cn';

// Create a factory function that generates loaders with resolved color
const createLoaders = (accentColor) => [
  ({ color }) => <Bouncy size="45" speed="1.75" color={color || accentColor} />,
  ({ color }) => <BouncyArc size="70" speed="1.65" color={color || accentColor} />,
  ({ color }) => <DotPulse size="60" speed="2.5" color={color || accentColor} />,
  ({ color }) => <DotStream size="60" speed="2.5" color={color || accentColor} />,
  ({ color }) => <DotWave size="47" speed="1" color={color || accentColor} />,
  ({ color }) => <Grid size="45" speed="1.75" color={color || accentColor} />,
  ({ color }) => <Hourglass size="40" speed="1.75" color={color || accentColor} />,
  ({ color }) => <InfinityLoader size="55" stroke="4" speed="1.3" color={color || accentColor} />,
  ({ color }) => <Jelly size="45" speed="1.75" color={color || accentColor} />,
  ({ color }) => <Leapfrog size="40" speed="2.5" color={color || accentColor} />,
  ({ color }) => <LineWobble size="70" stroke="5" speed="1.75" color={color || accentColor} />,
  ({ color }) => <Metronome size="40" speed="1.6" color={color || accentColor} />,
  ({ color }) => <Mirage size="45" speed="1.75" color={color || accentColor} />,
  ({ color }) => <Momentum size="45" speed="1.75" color={color || accentColor} />,
  ({ color }) => <NewtonsCradle size="78" speed="1.4" color={color || accentColor} />,
  ({ color }) => <Orbit size="45" speed="1.75" color={color || accentColor} />,
  ({ color }) => <Pinwheel size="35" stroke="3.5" speed="0.9" color={color || accentColor} />,
  ({ color }) => <Quantum size="40" speed="1.75" color={color || accentColor} />,
  ({ color }) => <Ring2 size="40" stroke="5" speed="0.8" color={color || accentColor} />,
  ({ color }) => <Treadmill size="45" speed="1.75" color={color || accentColor} />,
  ({ color }) => <Trio size="40" speed="1.3" color={color || accentColor} />,
  ({ color }) => <Zoomies size="45" speed="1.75" color={color || accentColor} />,
];

// Define the loader names in the exact order of createLoaders
const LOADER_NAMES = [
  'Bouncy',
  'BouncyArc',
  'DotPulse',
  'DotStream',
  'DotWave',
  'Grid',
  'Hourglass',
  'InfinityLoader',
  'Jelly',
  'Leapfrog',
  'LineWobble',
  'Metronome',
  'Mirage',
  'Momentum',
  'NewtonsCradle',
  'Orbit',
  'Pinwheel',
  'Quantum',
  'Ring2',
  'Treadmill',
  'Trio',
  'Zoomies',
];

// Helper to get random index from allowed set, excluding current
const getRandomIndex = (exclude, allowedIndices) => {
  const candidates = allowedIndices.filter((idx) => idx !== exclude);
  if (candidates.length === 0) return exclude; // fallback (shouldn't happen)
  const randomPos = Math.floor(Math.random() * candidates.length);
  return candidates[randomPos];
};

const SWITCH_INTERVAL = 6000;
const FADE_DURATION = 400;

/**
 * LoaderIcon component that displays animated loading indicators
 * Automatically switches between different loader animations for visual variety
 *
 * @param {Object} props - Component props
 * @param {string} [props.color='#8b6f47'] - Color for the loader
 * @param {boolean} [props.isButton=false] - Whether the loader is used in a button context
 * @param {string[]} [props.allowedLoaderNames] - Array of specific loader names to use (e.g., ['Spiral', 'Bouncy'])
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element} Rendered LoaderIcon component
 *
 * @example
 * Basic usage
 * <LoaderIcon />
 *
 * @example
 * Custom color and size
 * <LoaderIcon color="#ff0000" className="w-8 h-8" />
 *
 * @example
 * Specific loaders only
 * <LoaderIcon allowedLoaderNames={['Bouncy', 'Spiral']} />
 */
export default function LoaderIcon({
  color = '#8b6f47',
  isButton = false,
  allowedLoaderNames, // array of strings like ['Spiral', 'Bouncy']
  className,
  ...props
}) {
  const [visible, setVisible] = useState(true);

  // Resolve CSS variable at render time
  const accentColor = useMemo(() => {
    if (typeof window === 'undefined') return '#8b6f47';
    const cssValue = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-ui-brown')
      .trim();
    return cssValue || '#8b6f47';
  }, []);

  // Get loaders with resolved color
  const loaders = useMemo(() => createLoaders(accentColor), [accentColor]);

  // Convert allowed loader names to indices
  const availableIndices = useMemo(() => {
    const total = loaders.length;
    if (allowedLoaderNames && Array.isArray(allowedLoaderNames) && allowedLoaderNames.length > 0) {
      const indices = allowedLoaderNames
        .map((name) => {
          const idx = LOADER_NAMES.indexOf(name);
          return idx !== -1 ? idx : null;
        })
        .filter((idx) => idx !== null && idx >= 0 && idx < total);
      // If after filtering we have at least one valid index, use them; otherwise fallback to all.
      if (indices.length > 0) return indices;
    }
    // Default: all loaders
    return Array.from({ length: total }, (_, i) => i);
  }, [allowedLoaderNames, loaders.length]);

  // Initial random index from allowed set
  const [index, setIndex] = useState(() => {
    const randomPos = Math.floor(Math.random() * availableIndices.length);
    return availableIndices[randomPos];
  });
  // for ordered loaders:
  // const [cursor, setCursor] = useState(0);
  // const index = availableIndices[cursor];

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);

      setTimeout(() => {
        setIndex((prev) => getRandomIndex(prev, availableIndices));
        // setCursor((prev) => (prev + 1) % availableIndices.length);
        setVisible(true);
      }, FADE_DURATION);
    }, SWITCH_INTERVAL);

    return () => clearInterval(timer);
  }, [availableIndices]);

  const Icon = loaders[index];

  // useEffect(() => {
  //   const el = document.getElementById('loader-icon');
  //   logger.log(LOADER_NAMES[index], `: Wd ${el.offsetWidth}px, Ht ${el.offsetHeight}px`);
  // });

  return (
    <div
      id="loader-icon"
      className={cn(
        `flex shrink-0 items-center justify-center transition-all duration-300 ease-in-out`,
        isButton ? 'size-5.5' : 'mx-auto size-24',
        visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
        className,
      )}
      {...props}
    >
      <div className={cn(isButton && 'scale-[0.45] transform')}>
        <Icon color={color || ''} className="size-full" />
      </div>
    </div>
  );
}

LoaderIcon.propTypes = {
  color: PropTypes.string,
  isButton: PropTypes.bool,
  allowedLoaderNames: PropTypes.arrayOf(PropTypes.string),
  className: PropTypes.string,
};
