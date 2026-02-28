/* eslint-env node */
/* global process */

// Entrypoint for the API server. It simply bootstraps configuration
// and starts the express app that lives in server/app.js. The heavy
// application logic has been moved into that module so that tests can
// import the app without accidentally starting a listener.

import '#server/bootstrap.js';
import app from '#server/app.js';
import { BACKEND_CONFIG } from '#config/backend.config.js';

// Provide an explicit start/stop API to avoid accidental multiple listeners
let serverInstance = null;

export function startServer() {
  if (serverInstance) {
    console.warn('Server already started. Returning existing instance.');
    return serverInstance;
  }

  const PORT = BACKEND_CONFIG.port;
  serverInstance = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const shutdown = () => {
    console.log('Shutting down...');
    if (serverInstance) {
      serverInstance.close(() => {
        console.log('Closed out remaining connections.');
        process.exit(0);
      });
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return serverInstance;
}

export function stopServer() {
  if (!serverInstance) return;
  serverInstance.close(() => {
    serverInstance = null;
    console.log('Server stopped');
  });
}

// Backwards-compatible auto-start for normal runs (preserve existing behavior)
if (BACKEND_CONFIG.nodeEnv !== 'test') {
  startServer();
}

export default app;
export { app };
