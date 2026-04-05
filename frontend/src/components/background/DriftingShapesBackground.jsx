/**
 * Moving Grid Background Component
 *
 * Renders a subtle, animated grid of thin lines that slowly translates diagonally.
 * Designed as a professional, unobtrusive background for the beige-themed site.
 *
 * CONFIGURATION (change these values in the config object below):
 *   - cellSize: number (px) – spacing between grid lines (default 60)
 *   - lineWidth: number (px) – thickness of the lines (default 0.6)
 *   - strokeStyle: string – colour of the lines (default '#d4c5b0')
 *   - globalAlpha: number – transparency of the lines (default 0.18)
 *   - speedX: number – horizontal translation speed (px per frame, default 0.08)
 *   - speedY: number – vertical translation speed (px per frame, default 0.08)
 *     (positive moves towards bottom-right; negative moves towards top-left)
 *
 * The grid repeats seamlessly by using modulo arithmetic on the translation offset.
 * On window resize, the canvas dimensions are updated and the offset is preserved.
 *
 * Usage:
 *   import DriftingShapesBackground from '@/components/background/DriftingShapesBackground';
 *   // Add <DriftingShapesBackground /> inside your .app-bg container before content.
 */
import { useEffect, useRef } from 'react';

class MovingGrid {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // ========== CONFIGURATION – ADJUST THESE FOR DIFFERENT LOOKS ==========
    this.config = {
      cellSize: 20, // grid spacing
      lineWidth: 0.6,
      strokeStyle: '#d4c5b0',
      globalAlpha: 0.4, // line color opacity
      speedX: -0.2,
      speedY: -0.2,
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
    const { cellSize, lineWidth, strokeStyle, globalAlpha } = this.config;

    this.ctx.save();
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = strokeStyle;
    this.ctx.globalAlpha = globalAlpha;

    // Calculate starting points based on offsets to create seamless wrapping
    const startX = this.offsetX % cellSize;
    const startY = this.offsetY % cellSize;

    // Draw vertical lines
    for (let x = startX; x < width; x += cellSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = startY; y < height; y += cellSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
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

  return <canvas ref={canvasRef} className="shape-canvas" />;
}
