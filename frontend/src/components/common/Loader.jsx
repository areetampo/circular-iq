import { React, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Spiral,
  Bouncy,
  Ring2,
  BouncyArc,
  Hourglass,
  LineWobble,
  Infinity as InfinityLoader,
  Helix,
  Quantum,
  Trio,
  DotWave,
  Leapfrog,
  NewtonsCradle,
  DotStream,
  Metronome,
  Pinwheel,
} from 'ldrs/react';

// styles (required)
import 'ldrs/react/Spiral.css';
import 'ldrs/react/Bouncy.css';
import 'ldrs/react/Ring2.css';
import 'ldrs/react/BouncyArc.css';
import 'ldrs/react/Hourglass.css';
import 'ldrs/react/LineWobble.css';
import 'ldrs/react/Infinity.css';
import 'ldrs/react/Helix.css';
import 'ldrs/react/Quantum.css';
import 'ldrs/react/Trio.css';
import 'ldrs/react/DotWave.css';
import 'ldrs/react/Leapfrog.css';
import 'ldrs/react/NewtonsCradle.css';
import 'ldrs/react/DotStream.css';
import 'ldrs/react/Metronome.css';
import 'ldrs/react/Pinwheel.css';

const LOADERS = [
  () => <Spiral size="40" speed="0.9" color="black" />,
  () => <Bouncy size="45" speed="1.75" color="black" />,
  () => <Ring2 size="40" stroke="5" speed="0.8" color="black" />,
  () => <BouncyArc size="70" speed="1.65" color="black" />,
  () => <Hourglass size="40" speed="1.75" color="black" />,
  () => <LineWobble size="80" stroke="5" speed="1.75" color="black" />,
  () => <InfinityLoader size="55" stroke="4" speed="1.3" color="black" />,
  () => <Helix size="45" speed="2.5" color="black" />,
  () => <Quantum size="45" speed="1.75" color="black" />,
  () => <Trio size="40" speed="1.3" color="black" />,
  () => <DotWave size="47" speed="1" color="black" />,
  () => <Leapfrog size="40" speed="2.5" color="black" />,
  () => <NewtonsCradle size="78" speed="1.4" color="black" />,
  () => <DotStream size="60" speed="2.5" color="black" />,
  () => <Metronome size="40" speed="1.6" color="black" />,
  () => <Pinwheel size="35" stroke="3.5" speed="0.9" color="black" />,
];

const SWITCH_INTERVAL = 2200;
const FADE_DURATION = 250;

const getRandomIndex = (exclude) => {
  let idx;
  do {
    idx = Math.floor(Math.random() * LOADERS.length);
  } while (idx === exclude);
  return idx;
};

export default function Loader({
  heading = 'Loading...',
  message = 'Please wait while we retrieve your data...',
}) {
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

  const LoaderComponent = LOADERS[index];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div
        className={`transition-opacity duration-300 ease-in-out ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <LoaderComponent />
      </div>

      {heading && <h2 className="text-2xl font-semibold text-gray-800">{heading}</h2>}

      {message && <p className="text-base text-gray-600">{message}</p>}
    </div>
  );
}

Loader.propTypes = {
  heading: PropTypes.string,
  message: PropTypes.string,
};
