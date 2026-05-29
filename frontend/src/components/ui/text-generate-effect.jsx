'use client';
/** Animated text reveal that unblurs and fades each word into view. */
import { motion, stagger, useAnimate } from 'motion/react';
import PropTypes from 'prop-types';
import { useEffect } from 'react';

/**
 * Reveals text one word at a time with blur removal and fade-in motion.
 */
export const TextGenerateEffect = ({ words, className, filter = true, duration = 0.5 }) => {
  const [scope, animate] = useAnimate();
  const wordsArray = words.split(' ');

  useEffect(() => {
    animate(
      'span',
      { opacity: 1, filter: filter ? 'blur(0px)' : 'none' },
      {
        duration: duration || 1,
        delay: stagger(0.15, { startDelay: 1 }),
      },
    );
  }, [scope.current]);
  return (
    <>
      <div className={className}>
        <motion.div ref={scope}>
          {wordsArray.map((word, idx) => (
            <motion.span
              key={word + idx}
              className="inline"
              style={{
                opacity: 0,
                filter: filter ? 'blur(10px)' : 'none',
              }}
            >
              {word}{' '}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </>
  );
};

TextGenerateEffect.propTypes = {
  words: PropTypes.string.isRequired,
  className: PropTypes.string,
  filter: PropTypes.bool,
  duration: PropTypes.number,
};
