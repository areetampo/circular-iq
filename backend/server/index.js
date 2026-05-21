/**
 * @module index
 * @description Server entry point and HTTP server lifecycle management.
 * Starts the Express HTTP server, initializes background services (uptime monitoring),
 * and handles graceful shutdown on SIGTERM/SIGINT signals.
 *
 * Responsibilities:
 * - Start HTTP server on configured port
 * - Display formatted server startup information
 * - Initialize uptime polling and cleanup tasks
 * - Handle graceful shutdown with background task draining
 * - Global unhandled rejection error handling
 *
 * Environment-specific behavior:
 * - Development: Shows detailed startup banner with configuration
 * - Test: Skips server startup and uptime monitoring
 * - Production: Enables uptime monitoring and cleanup tasks
 */

import boxen from 'boxen';
import chalk from 'chalk';

import app from '#server/app.js';
import { BACKEND_CONFIG } from '#config/backend.config.js';
import { getSupabaseClient } from '#database/index.js';
import { startUptimePolling, stopUptimePolling } from '#services/uptimePolling.service.js';

let serverInstance = null;
let uptimeCleanupInterval = null;

/** Chalk theme tokens for the development startup banner. */
const theme = {
  primary: chalk.cyan.bold,
  secondary: chalk.white,
  accent: chalk.magenta.bold,
  success: chalk.greenBright,
  warning: chalk.yellow,
  danger: chalk.red.bold,
  dim: chalk.gray,
  url: chalk.underline.blueBright,
};

/**
 * Formats a list of URLs for the startup banner (multi-line with indentation).
 * @param {string[]|null|undefined} list
 * @returns {string} Chalk-formatted string
 */
const formatList = (list) => {
  if (!list || list.length === 0) return theme.danger('not set');
  const indentation = ' '.repeat(23); // Matches the label + separator width
  return list
    .map((item, i) => (i === 0 ? theme.url(item) : `${indentation}${theme.url(item)}`))
    .join('\n');
};

/**
 * Renders a single config row for the startup banner.
 * @param {string} label
 * @param {string} value - Pre-formatted chalk string
 * @returns {string}
 */
const renderRow = (label, value) => {
  return `${theme.primary(label.padEnd(20))} ${theme.dim('│')} ${value}`;
};

/**
 * Returns a colored HTTP method badge for the API service map.
 * @param {string} method - HTTP verb (GET, POST, etc.)
 * @returns {string} Chalk-formatted badge
 */
const badge = (method) => {
  const styles = {
    GET: chalk.bgBlue.black.bold,
    POST: chalk.bgGreen.black.bold,
    PUT: chalk.bgYellow.black.bold,
    DELETE: chalk.bgRed.white.bold,
    CRUD: chalk.bgMagenta.black.bold,
  };
  return (styles[method] || chalk.bgWhite.black)(` ${method.padEnd(5)} `);
};

/**
 * Starts the HTTP server and uptime background tasks (when enabled).
 * Registers SIGTERM/SIGINT handlers for graceful shutdown.
 * Idempotent — returns the existing instance if already listening.
 *
 * @returns {import('http').Server|undefined} Node HTTP server, or undefined in test mode
 */
export function startServer() {
  if (serverInstance) return serverInstance;

  const PORT = BACKEND_CONFIG.port;

  serverInstance = app.listen(PORT, () => {
    if (BACKEND_CONFIG.nodeEnv === 'test') return;

    const configRows = [];

    const processConfig = (obj, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        // Skip the 'api' section as it's displayed separately
        if (key === 'api') continue;

        const label = prefix ? `${prefix}.${key}` : key;

        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          // If it's a nested object, recurse
          processConfig(value, label);
        } else {
          // Format the value based on content
          let formattedValue = theme.secondary(String(value));

          if (typeof value === 'boolean') {
            formattedValue = value ? theme.success('ENABLED') : theme.danger('DISABLED');
          } else if (label.toLowerCase().includes('url')) {
            formattedValue = theme.url(value || 'Not set');
          } else if (Array.isArray(value)) {
            formattedValue = formatList(value);
          } else if (
            label.toLowerCase().includes('key') ||
            label.toLowerCase().includes('password') ||
            label.toLowerCase().includes('connectionstring') ||
            label.toLowerCase().includes('sslca')
          ) {
            formattedValue = value ? theme.success('SET ✓') : theme.danger('MISSING ✕');
          }

          configRows.push(renderRow(label, formattedValue));
        }
      }
    };

    processConfig(BACKEND_CONFIG);

    const apiRows = BACKEND_CONFIG.api.map(
      (route) =>
        `${badge(route.method)} ${theme.secondary(route.endpoint.padEnd(20))} ${theme.dim('⇨ ' + route.description)}`,
    );

    const authStatus = BACKEND_CONFIG.app.apiAuthEnabled
      ? chalk.bgGreen.black.bold('🛡️  API AUTH: ACTIVE  ')
      : chalk.white.bold('‼ ️  API AUTH: DISABLED  ');

    const content = [
      '',
      theme.accent('◉ SYSTEM PARAMETERS'),
      theme.dim('━'.repeat(60)),
      ...configRows,
      '',
      theme.accent('📡 API SERVICE MAP'),
      theme.dim('━'.repeat(60)),
      ...apiRows,
      '',
      `${theme.dim('Security Check:')} ${authStatus}`,
      '',
    ].join('\n');

    console.log(
      boxen(content, {
        title: theme.success(` 🚀 SERVER ONLINE [${new Date().toLocaleTimeString()}] `),
        titleAlignment: 'center',
        padding: { left: 3, right: 3, top: 0, bottom: 0 },
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
        backgroundColor: '#1a1a1a',
      }),
    );

    const shutdown = () => {
      if (serverInstance) {
        logger.warn(theme.warning('\n揪 SIGTERM/SIGINT received. Cleaning up...'));
        logger.warn('SIGTERM/SIGINT received, initiating shutdown');

        // 1. Stop accepting new requests immediately
        serverInstance.close(async () => {
          logger.info(theme.dim('  - Server stopped accepting new connections.'));
          logger.info('Server stopped accepting new connections');

          // 2. Clear background intervals
          if (uptimeCleanupInterval) {
            clearInterval(uptimeCleanupInterval);
            uptimeCleanupInterval = null;
            logger.info(theme.dim('  - Stopped uptime cleanup interval.'));
          }
          stopUptimePolling();

          // 3. Give background tasks (like Supabase logging) 2-3 seconds to finish
          // This is crucial for Render redeploys
          logger.info(theme.dim('  - Draining background tasks...'));
          logger.info('Draining background tasks');
          await new Promise((resolve) => setTimeout(resolve, 3000));

          logger.error(theme.danger('✕ Server Process Terminated.'));
          logger.info('Server process terminated successfully');
          process.exit(0);
        });

        // Forced kill after 10 seconds if it hangs
        setTimeout(() => {
          logger.error(theme.danger('! Could not close connections in time, forceful shutdown'));
          logger.error('Forceful shutdown after timeout');
          process.exit(1);
        }, 10000);
      }
    };

    const { retentionDays, pollingEnabled, cleanupOnStart, cleanupIntervalDurationMs } =
      BACKEND_CONFIG.uptime;

    // Only start uptime background tasks if pollingEnabled is true
    if (pollingEnabled) {
      const runCleanup = async () => {
        try {
          const supabase = getSupabaseClient();
          const { data, error } = await supabase.rpc('cleanup_old_uptime_checks', {
            retentionDays,
          });
          if (error) throw error;
          logger.info({ retentionDays, deletedRows: data }, 'Uptime history cleanup completed');
        } catch (err) {
          logger.error({ err }, 'Uptime cleanup failed');
        }
      };

      const startMonitoring = () => {
        uptimeCleanupInterval = setInterval(runCleanup, cleanupIntervalDurationMs);
        startUptimePolling();
        logger.info(
          { nodeEnv: BACKEND_CONFIG.nodeEnv, pollingEnabled },
          'Uptime monitoring (polling + cleanup) started',
        );
      };

      if (cleanupOnStart) {
        (async () => {
          try {
            const supabase = getSupabaseClient();
            const { error } = await supabase.rpc('cleanup_old_uptime_checks', { days: 0 });
            if (error) throw error;
            logger.info('Uptime table truncated on server start');
          } catch (err) {
            logger.error({ err }, 'Uptime table truncation on start failed');
          } finally {
            startMonitoring(); // polling only begins after truncation resolves
          }
        })();
      } else {
        runCleanup();
        startMonitoring();
      }
    } else {
      logger.info(
        { nodeEnv: BACKEND_CONFIG.nodeEnv, pollingEnabled: pollingEnabled },
        'Uptime polling is disabled',
      );
    }

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    return serverInstance;
  });
}

/**
 * Closes the HTTP server gracefully.
 * Used in tests to tear down without killing the process.
 *
 * @returns {Promise<void>} Resolves when the server has closed
 */
export function stopServer() {
  if (!serverInstance) return Promise.resolve();

  return new Promise((resolve) => {
    serverInstance.close(() => {
      serverInstance = null;
      logger.info(theme.dim('Server Instance Stopped.'));
      logger.info('Server Instance Stopped.');
      resolve();
    });
  });
}

// Prevent background logging errors from crashing the Render instance
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'UNHANDLED REJECTION');
  if (BACKEND_CONFIG.nodeEnv !== 'test') {
    logger.error({ reason }, theme.danger('UNHANDLED REJECTION'));
  }
});

if (BACKEND_CONFIG.nodeEnv !== 'test') {
  startServer();
}

/**
 * Re-export of the Express app from `#server/app.js` (same singleton).
 * @type {import('express').Express}
 */
export default app;
