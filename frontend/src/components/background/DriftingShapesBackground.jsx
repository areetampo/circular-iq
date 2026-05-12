/**
 * Moving Grid Background Component
 *
 * Renders a subtle, animated grid of thin lines that slowly translates diagonally.
 * Designed as a professional, unobtrusive background for beige-themed site.
 *
 * CONFIGURATION (change these values in config object below):
 *   - cellSize: number (px) – spacing between grid lines (default 60)
 *   - lineWidth: number (px) – thickness of lines (default 0.6)
 *   - strokeStyle: string – colour of lines (default 'var(--color-bg-grid)')
 *   - globalAlpha: number – transparency of lines (default 0.18)
 *   - speedX: number – horizontal translation speed (px per frame, default 0.08)
 *   - speedY: number – vertical translation speed (px per frame, default 0.08)
 *     (positive moves towards bottom-right; negative moves towards top-left)
 *
 * The grid repeats seamlessly by using modulo arithmetic on the translation offset.
 * On window resize, canvas dimensions are updated and the offset is preserved.
 *
 * Usage:
 *   import DriftingShapesBackground from '@/components/background/DriftingShapesBackground';
 *   Add <DriftingShapesBackground /> inside your .app-bg container before content.
 */
import { useEffect, useRef } from 'react';

class MovingGrid {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // ========== CONFIGURATION – ADJUST THESE FOR DIFFERENT LOOKS ==========
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
    // =====================================================================

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
    // No need to recreate grid – we draw based on offsets each frame
  }

  drawGrid() {
    const { width, height } = this.canvas;
    const { cellSize, lineWidth, strokeStyle, globalAlpha, segmentGap, rotation } = this.config;

    // Resolve CSS variable for canvas context
    const resolvedStrokeStyle = strokeStyle.startsWith('var(')
      ? (() => {
          const varName = strokeStyle.slice(4, -1).trim();
          // Try to get from :root first (accessible via getComputedStyle)
          let value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();

          // If value is another CSS variable reference, resolve it recursively
          if (value.startsWith('var(')) {
            const nestedVarName = value.slice(4, -1).trim();
            const nestedValue = getComputedStyle(document.documentElement)
              .getPropertyValue(nestedVarName)
              .trim();
            value = nestedValue || '#d4c5b0';
          }

          // If not found, it might be a @theme variable, use fallback
          if (!value) {
            // Map common @theme variables to their fallback values
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

    // Draw Vertical Segments
    for (let x = startX; x < halfSize; x += cellSize) {
      for (let y = -halfSize; y < halfSize; y += cellSize) {
        this.ctx.beginPath();
        // Start just after the intersection, end just before the next one
        this.ctx.moveTo(x, y + segmentGap);
        this.ctx.lineTo(x, y + cellSize - segmentGap);
        this.ctx.stroke();
      }
    }

    // Draw Horizontal Segments
    for (let y = startY; y < halfSize; y += cellSize) {
      for (let x = -halfSize; x < halfSize; x += cellSize) {
        this.ctx.beginPath();
        // Start just after the intersection, end just before the next one
        this.ctx.moveTo(x + segmentGap, y);
        this.ctx.lineTo(x + cellSize - segmentGap, y);
        this.ctx.stroke();
      }
    }

    this.ctx.restore();
  }

  updateOffset() {
    // Move the grid diagonally (bottom-right → top-left)
    this.offsetX += this.config.speedX;
    this.offsetY += this.config.speedY;

    // Keep offsets within one cell size to avoid large numbers (no functional difference)
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

export default function DriftingShapesBackground() {
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

  return <canvas ref={canvasRef} className="app__shape-canvas" />;
}

DriftingShapesBackground.propTypes = {
  /** No props required for this component */
};
