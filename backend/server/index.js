/**
 * HTTP server entry: listens on `BACKEND_CONFIG.port`, starts uptime polling when enabled,
 * and shuts down polling/background cleanup on SIGTERM/SIGINT. The module does not auto-start
 * the listener when `NODE_ENV=test`, but exported startup helpers remain callable by tests.
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
 *
 * @param {string[]|null|undefined} list - URL strings to display, or empty/null when unset.
 * @returns {string} Chalk-formatted multi-line URL list or a red "not set" label.
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
 *
 * @param {string} label - Left-column label before padding.
 * @param {string} value - Chalk-formatted value string for the right column.
 * @returns {string} Chalk-formatted banner row with aligned label and value columns.
 */
const renderRow = (label, value) => {
  return `${theme.primary(label.padEnd(20))} ${theme.dim('│')} ${value}`;
};

/**
 * Returns a colored HTTP method badge for the API service map.
 *
 * @param {string} method - HTTP verb (GET, POST, etc.)
 * @returns {string} Chalk-formatted fixed-width method badge.
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
 * Starts the HTTP server and uptime background tasks.
 * Idempotent: returns the existing instance if already listening. A first call starts listening
 * as a side effect and stores the server instance for future calls.
 *
 * @returns {import('http').Server|undefined} Existing server when already started; otherwise `undefined` after starting the listener.
 */
export function startServer() {
  if (serverInstance) return serverInstance;

  const PORT = BACKEND_CONFIG.port;

  serverInstance = app.listen(PORT, () => {
    if (BACKEND_CONFIG.nodeEnv === 'test') return;

    const configRows = [];

    const processConfig = (obj, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        // The API service map renders this section separately from scalar config rows.
        if (key === 'api') continue;

        const label = prefix ? `${prefix}.${key}` : key;

        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          // Nested config groups are flattened with dot labels for a compact banner.
          processConfig(value, label);
        } else {
          // Secret-like fields show presence only so the startup banner never prints credentials.
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
      : chalk.white.bold('⚠️ ️  API AUTH: DISABLED  ');

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

        // Stop accepting new requests before draining background work.
        serverInstance.close(async () => {
          logger.info(theme.dim('  - Server stopped accepting new connections.'));
          logger.info('Server stopped accepting new connections');

          // Clear intervals before polling state is torn down.
          if (uptimeCleanupInterval) {
            clearInterval(uptimeCleanupInterval);
            uptimeCleanupInterval = null;
            logger.info(theme.dim('  - Stopped uptime cleanup interval.'));
          }
          stopUptimePolling();

          // Render redeploys need a short drain window for in-flight background logging.
          logger.info(theme.dim('  - Draining background tasks...'));
          logger.info('Draining background tasks');
          await new Promise((resolve) => setTimeout(resolve, 3000));

          logger.error(theme.danger('✕ Server Process Terminated.'));
          logger.info('Server process terminated successfully');
          process.exit(0);
        });

        // Keep container shutdown bounded if active connections never close.
        setTimeout(() => {
          logger.error(theme.danger('! Could not close connections in time, forceful shutdown'));
          logger.error('Forceful shutdown after timeout');
          process.exit(1);
        }, 10000);
      }
    };

    const { retentionDays, pollingEnabled, cleanupOnStart, cleanupIntervalDurationMs } =
      BACKEND_CONFIG.uptime;

    // Uptime polling owns both API checks and history cleanup, so both share this feature flag.
    if (pollingEnabled) {
      const runCleanup = async () => {
        try {
          const supabase = getSupabaseClient();
          const { data, error } = await supabase.rpc('cleanup_old_uptime_checks', {
            days: retentionDays,
          });
          if (error) throw error;
          logger.info({ retentionDays, deletedRows: data }, 'Uptime history cleanup completed');
        } catch (error) {
          logger.error({ error }, 'Uptime cleanup failed');
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
          } catch (error) {
            logger.error({ error }, 'Uptime table truncation on start failed');
          } finally {
            startMonitoring(); // Avoid polling against rows that cleanup-on-start is deleting.
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
 * Intended for test teardown; does not call `process.exit`.
 *
 * @returns {Promise<void>} Resolves after the active server closes, or immediately when no server is running.
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

// Log unhandled background failures without crashing production containers.
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
 *
 * @type {import('express').Express}
 */
export default app;
