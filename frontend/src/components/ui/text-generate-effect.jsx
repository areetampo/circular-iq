'use client';
/**
 * @module text-generate-effect
 * @description Animated text reveal effect that progressively unblurs and fades words into view.
 */
import { motion, stagger, useAnimate } from 'motion/react';
import PropTypes from 'prop-types';
import { useEffect } from 'react';

/**
 * TextGenerateEffect animates words so each word is revealed with blur removal and fade-in.
 * @param {Object} props
 * @param {string} props.words - Text content to animate.
 * @param {string} [props.className] - Optional container CSS classes.
 * @param {boolean} [props.filter=true] - Whether to apply blur filter during animation.
 * @param {number} [props.duration=0.5] - Animation duration in seconds.
 * @returns {JSX.Element}
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
