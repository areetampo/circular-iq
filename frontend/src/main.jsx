/**
 * @module main
 * @description React application entry: StrictMode, BrowserRouter, root mount, and Vercel analytics.
 * Frontend Entry Point
 *
 * Initializes the React application with:
 * - StrictMode: Detects unsafe practices during development
 * - BrowserRouter: Enables client-side routing with React Router v6
 * - AppProvider: Wraps providers, error boundaries, and layout
 * - AppRoutes: Defines all page routes with lazy loading
 *
 * Environment: Uses VITE_* variables via src/config
 * Auth: Supabase (JWT bearer tokens)
 * Database: Supabase (realtime PostgreSQL with RLS)
 * Styling: Tailwind CSS v4 + HeroUI v3 components
 */

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from '@/app/App.jsx';
import { logger } from '@/utils/logger';
import './index.css';

window.logger = logger;

logger.initArt();

window.__APP_INITIAL_HISTORY_LENGTH = window.history.length;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <div id="app-root" className="app__bg">
        <div className="app__content">
          <App />
        </div>
      </div>
      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  </StrictMode>,
);
