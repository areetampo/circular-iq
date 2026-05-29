/**
 * Animated canvas grid background used behind full-page layouts.
 * `MovingGrid.config` controls visual density, opacity, rotation, and drift speed.
 */
import { useEffect, useRef } from 'react';

/**
 * Owns the canvas drawing context, resize listener, and animation frame loop for the drifting grid.
 */
class MovingGrid {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Visual tuning values for grid density, segment gaps, opacity, and drift direction.
    this.config = {
      cellSize: 70, // grid spacing
      lineWidth: 0.8,
      strokeStyle: 'var(--color-bg-grid)',
      globalAlpha: 0.125, // line color opacity
      speedX: -0.25,
      speedY: -0.25,
      segmentGap: 4,
      rotation: 45,
    };

    this.offsetX = 0; // current translation offset
    this.offsetY = 0;
    this.animationId = null;

    this.init();
    this.animate();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    // The grid is derived from canvas dimensions and offsets on each frame.
  }

  drawGrid() {
    const { width, height } = this.canvas;
    const { cellSize, lineWidth, strokeStyle, globalAlpha, segmentGap, rotation } = this.config;

    // Canvas contexts need concrete color values rather than unresolved CSS variables.
    const resolvedStrokeStyle = strokeStyle.startsWith('var(')
      ? (() => {
          const varName = strokeStyle.slice(4, -1).trim();
          let value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();

          // Theme tokens may point to another CSS variable, so resolve one nested level.
          if (value.startsWith('var(')) {
            const nestedVarName = value.slice(4, -1).trim();
            const nestedValue = getComputedStyle(document.documentElement)
              .getPropertyValue(nestedVarName)
              .trim();
            value = nestedValue || '#d4c5b0';
          }

          if (!value) {
            // Tailwind theme variables may not appear in computed styles during early canvas setup.
            const themeFallbacks = {
              '--color-bg-grid': '#d4c5b0',
              '--theme-bg-grid': '#d4c5b0',
            };
            value = themeFallbacks[varName] || '#d4c5b0';
          }

          return value;
        })()
      : strokeStyle;

    this.ctx.save();
    this.ctx.translate(width / 2, height / 2);
    this.ctx.rotate((rotation * Math.PI) / 180);

    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = resolvedStrokeStyle;
    this.ctx.globalAlpha = globalAlpha;

    const diag = Math.sqrt(width * width + height * height);
    const size = diag;
    const halfSize = size / 2;

    const startX = (this.offsetX % cellSize) - halfSize;
    const startY = (this.offsetY % cellSize) - halfSize;

    // Leave a gap around intersections so the grid reads as drifting line segments.
    for (let x = startX; x < halfSize; x += cellSize) {
      for (let y = -halfSize; y < halfSize; y += cellSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + segmentGap);
        this.ctx.lineTo(x, y + cellSize - segmentGap);
        this.ctx.stroke();
      }
    }

    // Use the same gap treatment horizontally to keep intersections visually open.
    for (let y = startY; y < halfSize; y += cellSize) {
      for (let x = -halfSize; x < halfSize; x += cellSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + segmentGap, y);
        this.ctx.lineTo(x + cellSize - segmentGap, y);
        this.ctx.stroke();
      }
    }

    this.ctx.restore();
  }

  updateOffset() {
    // Negative speeds drift the rotated grid toward the top-left.
    this.offsetX += this.config.speedX;
    this.offsetY += this.config.speedY;

    // Keep offsets bounded to one cell so long-running sessions avoid unnecessary numeric growth.
    if (Math.abs(this.offsetX) > this.config.cellSize) {
      this.offsetX = this.offsetX % this.config.cellSize;
    }
    if (Math.abs(this.offsetY) > this.config.cellSize) {
      this.offsetY = this.offsetY % this.config.cellSize;
    }
  }

  animate() {
    this.updateOffset();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawGrid();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', () => this.resize());
  }
}

/**
 * Renders a full-viewport animated grid canvas and forwards extra attributes to the canvas element.
 *
 * @param {Object} props - Canvas attributes such as ARIA metadata or data attributes passed through to the element.
 */
export default function DriftingShapesBackground({ ...props }) {
  const canvasRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      instanceRef.current = new MovingGrid(canvasRef.current);
    }
    return () => {
      if (instanceRef.current) {
        instanceRef.current.destroy();
      }
    };
  }, []);

  return <canvas {...props} ref={canvasRef} className="app__shape-canvas" />;
}

DriftingShapesBackground.propTypes = {};
