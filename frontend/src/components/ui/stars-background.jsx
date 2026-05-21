'use client';

/**
 * @module stars-background
 * @description Resize-aware twinkling starfield canvas background for hero sections.
 */

import PropTypes from 'prop-types';
import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/utils/cn';

/**
 * Full-bleed canvas starfield that regenerates on resize and twinkles per star config.
 *
 * @param {Object} props
 * @param {number} [props.starDensity=0.00015] - Stars per pixel² when the canvas is sized.
 * @param {boolean} [props.allStarsTwinkle=true] - When false, only a random subset twinkles.
 * @param {number} [props.twinkleProbability=0.7] - Chance a star twinkles when `allStarsTwinkle` is false.
 * @param {number} [props.minTwinkleSpeed=0.5] - Minimum twinkle cycle speed.
 * @param {number} [props.maxTwinkleSpeed=1] - Maximum twinkle cycle speed.
 * @param {string} [props.className] - Classes applied to the canvas element.
 * @returns {import('react').ReactElement}
 */
export const StarsBackground = ({
  starDensity = 0.00015,
  allStarsTwinkle = true,
  twinkleProbability = 0.7,
  minTwinkleSpeed = 0.5,
  maxTwinkleSpeed = 1,
  className,
}) => {
  const [stars, setStars] = useState([]);
  const canvasRef = useRef(null);

  const generateStars = useCallback(
    (width, height) => {
      const area = width * height;
      const numStars = Math.floor(area * starDensity);
      return Array.from({ length: numStars }, () => {
        const shouldTwinkle = allStarsTwinkle || Math.random() < twinkleProbability;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 0.05 + 0.5,
          opacity: Math.random() * 0.5 + 0.5,
          twinkleSpeed: shouldTwinkle
            ? minTwinkleSpeed + Math.random() * (maxTwinkleSpeed - minTwinkleSpeed)
            : null,
        };
      });
    },
    [starDensity, allStarsTwinkle, twinkleProbability, minTwinkleSpeed, maxTwinkleSpeed],
  );

  useEffect(() => {
    const updateStars = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = canvas.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;
        setStars(generateStars(width, height));
      }
    };

    updateStars();

    const resizeObserver = new ResizeObserver(updateStars);
    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current);
    }

    return () => {
      if (canvasRef.current) {
        resizeObserver.unobserve(canvasRef.current);
      }
    };
  }, [
    starDensity,
    allStarsTwinkle,
    twinkleProbability,
    minTwinkleSpeed,
    maxTwinkleSpeed,
    generateStars,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(160, 100, 50, ${star.opacity * 0.5})`;
        ctx.fill();

        if (star.twinkleSpeed !== null) {
          star.opacity = 0.5 + Math.abs(Math.sin((Date.now() * 0.001) / star.twinkleSpeed) * 0.5);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [stars]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
    />
  );
};

StarsBackground.propTypes = {
  starDensity: PropTypes.number,
  allStarsTwinkle: PropTypes.bool,
  twinkleProbability: PropTypes.number,
  minTwinkleSpeed: PropTypes.number,
  maxTwinkleSpeed: PropTypes.number,
  className: PropTypes.string,
};
