/* eslint-env node */
/* global process */

import '#server/bootstrap.js';
import app from '#server/app.js';
import { BACKEND_CONFIG } from '#config/backend.config.js';
import chalk from 'chalk';
import boxen from 'boxen';

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

    // 1. Core Config (Handling the "weird line" issue)
    const configRows = [
      renderRow('Port', theme.success(PORT)),
      renderRow('Mode', theme.warning(BACKEND_CONFIG.nodeEnv)),
      renderRow('Frontend URL', theme.url(BACKEND_CONFIG.app.frontendUrl)),
      renderRow('Allowed Origins', formatList(BACKEND_CONFIG.app.allowedOrigins)),
      renderRow(
        'Public Routes',
        theme.secondary(BACKEND_CONFIG.app.publicRoutes?.join('  •  ') || 'None'),
      ),
      '',
      renderRow(
        'OpenAI Key',
        BACKEND_CONFIG.openai.apiKey ? theme.success('CONNECTED ✅') : theme.danger('MISSING ❌'),
      ),
      renderRow('Supabase URL', theme.url(BACKEND_CONFIG.supabase.url || 'Not set')),
      renderRow(
        'Supabase Anon Key',
        BACKEND_CONFIG.supabase.anonKey ? theme.success('SET') : theme.danger('NOT SET'),
      ),
      renderRow(
        'Service Service Key',
        BACKEND_CONFIG.supabase.serviceKey ? theme.success('SET') : theme.danger('NOT SET'),
      ),
      renderRow('Docs Table', theme.accent(BACKEND_CONFIG.db.tables.documents)),
      renderRow(
        'Log Level',
        BACKEND_CONFIG.app.logLevel === 'error'
          ? theme.danger('ERROR')
          : theme.success(BACKEND_CONFIG.app.logLevel),
      ),
      renderRow(
        'Strict Env',
        BACKEND_CONFIG.app.strictEnv ? theme.success('ENABLED') : theme.danger('DISABLED'),
      ),
    ];

    // 2. API Map
    const apiRows = [
      { m: 'GET', p: '/health', d: 'System Health' },
      { m: 'GET', p: '/docs/methodology', d: 'Framework Docs' },
      { m: 'GET', p: '/api/profile', d: 'User Data' },
      { m: 'GET', p: '/api/analytics', d: 'Doc Stats' },
      { m: 'POST', p: '/api/scoring', d: 'RAG Analysis' },
      { m: 'CRUD', p: '/api/assessments', d: 'User Results' },
    ].map(
      (route) =>
        `${badge(route.m)} ${theme.secondary(route.p.padEnd(20))} ${theme.dim('⇨ ' + route.d)}`,
    );

    const authStatus = BACKEND_CONFIG.app.apiAuthEnabled
      ? chalk.bgGreen.black.bold('🛡️  API AUTH: ACTIVE  ')
      : chalk.white.bold('⚠️️️  API AUTH: DISABLED  ');

    const content = [
      '',
      theme.accent('⚙️  SYSTEM PARAMETERS'),
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
  });

  const shutdown = () => {
    if (serverInstance) {
      serverInstance.close(() => {
        console.log(theme.danger('\n🛑 Server Process Terminated.'));
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
    console.log(theme.dim('Server Instance Stopped.'));
  });
}

if (BACKEND_CONFIG.nodeEnv !== 'test') {
  startServer();
}

export default app;
