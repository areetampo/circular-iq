/**
 * Entry: StrictMode, BrowserRouter, root mount, Vercel analytics, and global `logger` init.
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
