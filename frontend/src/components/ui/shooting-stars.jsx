'use client';

/**
 * @module shooting-stars
 * @description Canvas shooting-stars animation overlay for hero and landing sections.
 */

import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/utils/cn';

/**
 * Picks a random viewport edge and travel angle for a new shooting star.
 * @returns {{ x: number, y: number, angle: number }}
 */
const getRandomStartPoint = () => {
  const side = Math.floor(Math.random() * 4);
  const offset = Math.random() * window.innerWidth;

  switch (side) {
    case 0:
      return { x: offset, y: 0, angle: 45 };
    case 1:
      return { x: window.innerWidth, y: offset, angle: 135 };
    case 2:
      return { x: offset, y: window.innerHeight, angle: 225 };
    case 3:
      return { x: 0, y: offset, angle: 315 };
    default:
      return { x: 0, y: 0, angle: 45 };
  }
};

/**
 * Periodic shooting-star trails across the viewport (canvas overlay).
 *
 * @param {Object} props
 * @param {number} [props.minSpeed=10] - Minimum star travel speed (px/frame).
 * @param {number} [props.maxSpeed=30] - Maximum star travel speed (px/frame).
 * @param {number} [props.minDelay=1200] - Minimum ms between new stars.
 * @param {number} [props.maxDelay=4200] - Maximum ms between new stars.
 * @param {string} [props.starColor='#9E00FF'] - Star head colour.
 * @param {string} [props.trailColor='#2EB9DF'] - Trail gradient colour.
 * @param {number} [props.starWidth=10] - Star stroke width in px.
 * @param {number} [props.starHeight=1] - Star stroke height in px.
 * @param {string} [props.className] - Wrapper classes for the canvas container.
 * @returns {import('react').ReactElement}
 */
export const ShootingStars = ({
  minSpeed = 10,
  maxSpeed = 30,
  minDelay = 1200,
  maxDelay = 4200,
  starColor = '#9E00FF',
  trailColor = '#2EB9DF',
  starWidth = 10,
  starHeight = 1,
  className,
}) => {
  const [star, setStar] = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    const createStar = () => {
      const { x, y, angle } = getRandomStartPoint();
      const newStar = {
        id: Date.now(),
        x,
        y,
        angle,
        scale: 1,
        speed: Math.random() * (maxSpeed - minSpeed) + minSpeed,
        distance: 0,
      };
      setStar(newStar);

      const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;
      setTimeout(createStar, randomDelay);
    };

    createStar();

    return () => {};
  }, [minSpeed, maxSpeed, minDelay, maxDelay]);

  useEffect(() => {
    const moveStar = () => {
      if (star) {
        setStar((prevStar) => {
          if (!prevStar) return null;
          const newX = prevStar.x + prevStar.speed * Math.cos((prevStar.angle * Math.PI) / 180);
          const newY = prevStar.y + prevStar.speed * Math.sin((prevStar.angle * Math.PI) / 180);
          const newDistance = prevStar.distance + prevStar.speed;
          const newScale = 1 + newDistance / 100;
          if (
            newX < -20 ||
            newX > window.innerWidth + 20 ||
            newY < -20 ||
            newY > window.innerHeight + 20
          ) {
            return null;
          }
          return {
            ...prevStar,
            x: newX,
            y: newY,
            distance: newDistance,
            scale: newScale,
          };
        });
      }
    };

    const animationFrame = requestAnimationFrame(moveStar);
    return () => cancelAnimationFrame(animationFrame);
  }, [star]);

  return (
    <svg
      ref={svgRef}
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
    >
      {star && (
        <rect
          key={star.id}
          x={star.x}
          y={star.y}
          width={starWidth * star.scale}
          height={starHeight}
          fill="url(#gradient)"
          transform={`rotate(${star.angle}, ${
            star.x + (starWidth * star.scale) / 2
          }, ${star.y + starHeight / 2})`}
        />
      )}
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: trailColor, stopOpacity: 0 }} />
          <stop offset="100%" style={{ stopColor: starColor, stopOpacity: 1 }} />
        </linearGradient>
      </defs>
    </svg>
  );
};

ShootingStars.propTypes = {
  minSpeed: PropTypes.number,
  maxSpeed: PropTypes.number,
  minDelay: PropTypes.number,
  maxDelay: PropTypes.number,
  starColor: PropTypes.string,
  trailColor: PropTypes.string,
  starWidth: PropTypes.number,
  starHeight: PropTypes.number,
  className: PropTypes.string,
};
