/**
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

import { logger } from '@/utils/logger';
window.logger = logger;

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from '@/app/App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
