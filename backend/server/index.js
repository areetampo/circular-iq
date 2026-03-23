/** Entry point. Starts the HTTP server. */

import boxen from 'boxen';
import chalk from 'chalk';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import app from '#server/app.js';

global.logger = logger;

let serverInstance = null;

/**
 * 🎨 UI THEME & FORMATTERS
 */
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

// Fixes the multi-line wrapping issue by indenting subsequent lines
const formatList = (list) => {
  if (!list || list.length === 0) return theme.danger('not set');
  const indentation = ' '.repeat(23); // Matches the label + separator width
  return list
    .map((item, i) => (i === 0 ? theme.url(item) : `${indentation}${theme.url(item)}`))
    .join('\n');
};

const renderRow = (label, value) => {
  return `${theme.primary(label.padEnd(20))} ${theme.dim('│')} ${value}`;
};

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
      theme.accent('⌀ SYSTEM PARAMETERS'),
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
        console.log(theme.warning('\n揪 SIGTERM/SIGINT received. Cleaning up...'));
        logger.warn('SIGTERM/SIGINT received, initiating shutdown');

        // 1. Stop accepting new requests immediately
        serverInstance.close(async () => {
          console.log(theme.dim('  - Server stopped accepting new connections.'));
          logger.info('Server stopped accepting new connections');

          // 2. Give background tasks (like Supabase logging) 2-3 seconds to finish
          // This is crucial for Render redeploys
          console.log(theme.dim('  - Draining background tasks...'));
          logger.info('Draining background tasks');
          await new Promise((resolve) => setTimeout(resolve, 3000));

          console.log(theme.danger('✕ Server Process Terminated.'));
          logger.info('Server process terminated successfully');
          process.exit(0);
        });

        // Forced kill after 10 seconds if it hangs
        setTimeout(() => {
          console.error(theme.danger('! Could not close connections in time, forceful shutdown'));
          logger.error('Forceful shutdown after timeout');
          process.exit(1);
        }, 10000);
      }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    return serverInstance;
  });
}

export function stopServer() {
  if (!serverInstance) return;
  serverInstance.close(() => {
    serverInstance = null;
    console.log(theme.dim('Server Instance Stopped.'));
    logger.info('Server Instance Stopped.');
  });
}

// Prevent background logging errors from crashing the Render instance
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ err: reason }, 'UNHANDLED REJECTION');
  if (BACKEND_CONFIG.nodeEnv !== 'test') {
    console.error(theme.danger('\n‼ UNHANDLED REJECTION:'), reason);
  }
});

if (BACKEND_CONFIG.nodeEnv !== 'test') {
  startServer();
}

export default app;
