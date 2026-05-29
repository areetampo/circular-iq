/** Mouse-tracked 3D tilt and reactive shadow wrapper for cards and hero text. */

import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Wraps children in a mouse-tracked 3D tilt container with optional box or text shadow.
 */
export default function Tilt3D({
  children,
  perspective = 600,
  rotateRange = { x: 8, y: 10 },
  shadowRange = 6,
  springConfig = { stiffness: 200, damping: 20 },
  shadowMode = 'box',
  shadow = true,
  shadowColor = '0,0,0',
  shadowColorSoft,
  block = false,
  className,
  style,
  ...props
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [rotateRange.x, -rotateRange.x]),
    springConfig,
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-rotateRange.y, rotateRange.y]),
    springConfig,
  );

  const rawShadowX = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [shadowRange, -shadowRange]),
    springConfig,
  );
  const rawShadowY = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [shadowRange, -shadowRange]),
    springConfig,
  );

  // Opacity scales with mouse distance from center: 0 at rest, 1 at full tilt.
  const shadowOpacity = useSpring(
    useTransform([mouseX, mouseY], ([x, y]) => Math.min(Math.sqrt(x * x + y * y) / 0.5, 1)),
    springConfig,
  );

  const softColor = shadowColorSoft ?? shadowColor;

  const boxShadow = useMotionTemplate`${rawShadowX}px ${rawShadowY}px 16px rgba(${shadowColor},calc(0.15 * ${shadowOpacity})), ${rawShadowX}px ${rawShadowY}px 36px rgba(${softColor},calc(0.07 * ${shadowOpacity}))`;
  const textShadow = useMotionTemplate`${rawShadowX}px ${rawShadowY}px 12px rgba(${shadowColor},calc(0.15 * ${shadowOpacity})), ${rawShadowX}px ${rawShadowY}px 30px rgba(${softColor},calc(0.07 * ${shadowOpacity}))`;

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <div
      {...props}
      style={{ perspective, display: block ? 'block' : 'inline-block' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          ...(shadow && shadowMode === 'box' && { boxShadow }),
          ...(shadow && shadowMode === 'text' && { textShadow }),
          ...style,
        }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  );
}

Tilt3D.propTypes = {
  children: PropTypes.node.isRequired,
  perspective: PropTypes.number,
  rotateRange: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  shadowRange: PropTypes.number,
  springConfig: PropTypes.shape({
    stiffness: PropTypes.number,
    damping: PropTypes.number,
  }),
  shadowMode: PropTypes.oneOf(['box', 'text']),
  shadow: PropTypes.bool,
  shadowColor: PropTypes.string,
  shadowColorSoft: PropTypes.string,
  block: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
};
