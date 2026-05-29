/**
 * Vitest/Jest global setup: matchers, mocks, and test environment defaults.
 * @jest-environment jsdom
 *
 * setupTests.js
 *
 * This file is automatically included by Jest before running tests, as specified in the "setupFiles" configuration in vitest.config.js.
 * It sets up the testing environment, including loading environment variables from .env.test and providing necessary mocks.
 *
 * Key responsibilities:
 * 1. Load environment variables from env/.env.test using dotenv, ensuring that tests have access to necessary config values.
 * 2. Mock global functions like window.alert to prevent actual alerts during tests and allow assertions on alert calls.
 * 3. Provide a basic mock implementation of @heroui/react components used across the app, so that tests can render components without needing the actual library or its styles.
 * 4. Mock the Supabase client to allow testing of components that use authentication without requiring real network calls or credentials.
 * 5. Set up a global ResizeObserver mock for libraries like Recharts that depend on it for rendering charts in tests.
 *
 * By centralizing these setups in one file, we ensure a consistent testing environment and reduce boilerplate in individual test files.
 * This also allows us to enforce that certain environment variables are present during tests, improving test reliability and catching configuration issues early.
 * Note: This file is only for test setup and should not contain any actual test cases or assertions.
 */

import { logger } from '@/utils/logger';
import '@testing-library/jest-dom';
import dotenv from 'dotenv';
import path from 'path';
import React from 'react';
import { fileURLToPath } from 'url';
import { vi } from 'vitest';

// manually load env variables from env/.env.test since vitest isn't automatically loading them in the test environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../env/.env.test') });

// logger.log('=== ENV DEBUG ===');
// logger.log('VITE_API_URL:', process.env.VITE_API_URL);
// logger.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
// logger.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY);
// logger.log('INTERNAL_BACKEND_API_KEY:', process.env.INTERNAL_BACKEND_API_KEY);
// logger.log('=================');

// Stub environment variables for tests
if (!process.env.VITE_API_URL) throw new Error('VITE_API_URL is required in env/.env.test');
if (!process.env.VITE_SUPABASE_URL)
  throw new Error('VITE_SUPABASE_URL is required in env/.env.test');
if (!process.env.VITE_SUPABASE_ANON_KEY)
  throw new Error('VITE_SUPABASE_ANON_KEY is required in env/.env.test');
if (!process.env.INTERNAL_BACKEND_API_KEY)
  throw new Error('INTERNAL_BACKEND_API_KEY is required in env/.env.test');

// Fail tests if `useAuth` is called outside `AuthProvider` so missing provider
// usage is caught by CI instead of silently falling back. This converts the
// specific logger.warn into a thrown error during tests.
const _originalConsoleWarn = logger.warn;
logger.warn = (...args) => {
  const msg = args[0] || '';
  if (typeof msg === 'string' && msg.includes('useAuth called outside AuthProvider')) {
    throw new Error(
      'useAuth called outside AuthProvider — wrap with AuthProvider or mock `useAuth` in tests',
    );
  }
  // Suppress HeroUI event handler warnings in tests
  if (
    typeof msg === 'string' &&
    (msg.includes('React does not recognize the `') ||
      msg.includes('Unknown event handler property'))
  ) {
    return; // Suppress these warnings
  }
  return _originalConsoleWarn.apply(console, args);
};

// Some unit tests reference a global `logger` identifier directly.
// The app sets up a logger at runtime; in tests we provide a minimal stub.
globalThis.logger = {
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  logOperation: vi.fn(),
};

const renderChildren = (children, props = {}) =>
  typeof children === 'function' ? children(props) : children;

// Set MODE and PROD for test
vi.stubEnv('MODE', 'test');
vi.stubEnv('PROD', 'false');

// Mock window.alert
global.alert = vi.fn();

// Minimal mock for @heroui/react used by Card/Button components.
vi.mock('@heroui/react', async (importOriginal) => {
  const actual = await importOriginal();
  const Card = Object.assign(
    ({ children, ...props }) => React.createElement('div', props, renderChildren(children)),
    { displayName: 'Card' },
  );
  Card.Header = Object.assign(
    ({ children }) => React.createElement('div', { className: 'card-header' }, children),
    { displayName: 'Card.Header' },
  );
  Card.Content = Object.assign(
    ({ children }) => React.createElement('div', { className: 'card-content' }, children),
    { displayName: 'Card.Content' },
  );
  Card.Title = Object.assign(
    ({ children }) => React.createElement('div', { className: 'card-title' }, children),
    { displayName: 'Card.Title' },
  );
  Card.Description = Object.assign(
    ({ children }) => React.createElement('div', { className: 'card-desc' }, children),
    { displayName: 'Card.Description' },
  );

  const Button = Object.assign(
    ({ children, isDisabled, onPress, onClick, ...props }) => {
      // Handle both onPress (HeroUI) and onClick (standard) props
      const handleClick = onPress || onClick;
      return React.createElement(
        'button',
        {
          ...props,
          disabled: isDisabled,
          onClick: handleClick,
        },
        renderChildren(children),
      );
    },
    { displayName: 'Button' },
  );
  const Label = Object.assign(
    ({ children, ...props }) => React.createElement('label', props, children),
    { displayName: 'Label' },
  );
  const Chip = Object.assign(
    ({ children, ...props }) => React.createElement('span', props, children),
    { displayName: 'Chip' },
  );

  const Alert = Object.assign(
    ({ children, ...props }) => React.createElement('div', props, children),
    { displayName: 'Alert' },
  );

  const Input = Object.assign(({ ...props }) => React.createElement('input', props, null), {
    displayName: 'Input',
  });
  const Switch = Object.assign(
    ({ children, isSelected, ...props }) =>
      React.createElement('div', props, renderChildren(children, { isSelected })),
    { displayName: 'Switch' },
  );
  Switch.Control = Object.assign(
    ({ children }) => React.createElement('div', null, renderChildren(children)),
    {
      displayName: 'Switch.Control',
    },
  );
  Switch.Thumb = Object.assign(
    ({ children }) => React.createElement('div', null, renderChildren(children)),
    {
      displayName: 'Switch.Thumb',
    },
  );
  Switch.Icon = Object.assign(
    ({ children }) => React.createElement('div', null, renderChildren(children)),
    {
      displayName: 'Switch.Icon',
    },
  );
  const Skeleton = Object.assign(
    ({ children }) => React.createElement('div', null, renderChildren(children)),
    {
      displayName: 'Skeleton',
    },
  );

  // Simple stubs for Tabs and Select/ListBox compound components
  const Tabs = Object.assign(
    ({ children }) => React.createElement('div', null, renderChildren(children)),
    {
      displayName: 'Tabs',
    },
  );
  Tabs.ListContainer = Object.assign(
    ({ children }) => React.createElement('div', null, renderChildren(children)),
    {
      displayName: 'Tabs.ListContainer',
    },
  );
  Tabs.List = Object.assign(
    ({ children }) => React.createElement('div', null, renderChildren(children)),
    {
      displayName: 'Tabs.List',
    },
  );
  Tabs.Tab = Object.assign(
    ({ children }) => React.createElement('div', null, renderChildren(children)),
    {
      displayName: 'Tabs.Tab',
    },
  );
  Tabs.Indicator = Object.assign(
    ({ children }) => React.createElement('div', null, renderChildren(children)),
    {
      displayName: 'Tabs.Indicator',
    },
  );

  const Select = Object.assign(
    ({ children }) => React.createElement('div', null, renderChildren(children)),
    {
      displayName: 'Select',
    },
  );
  Select.Trigger = Object.assign(
    ({ children }) => React.createElement('div', null, renderChildren(children)),
    {
      displayName: 'Select.Trigger',
    },
  );
  Select.Popover = Object.assign(
    ({ children }) => React.createElement('div', null, renderChildren(children)),
    {
      displayName: 'Select.Popover',
    },
  );
  Select.Value = Object.assign(
    ({ children }) => React.createElement('div', null, renderChildren(children)),
    {
      displayName: 'Select.Value',
    },
  );
  Select.Indicator = Object.assign(
    ({ children }) => React.createElement('div', null, renderChildren(children)),
    {
      displayName: 'Select.Indicator',
    },
  );

  const ListBox = Object.assign(
    ({ children }) => React.createElement('div', null, renderChildren(children)),
    {
      displayName: 'ListBox',
    },
  );
  ListBox.Item = Object.assign(
    ({ children }) => React.createElement('div', null, renderChildren(children)),
    {
      displayName: 'ListBox.Item',
    },
  );

  const Accordion = Object.assign(
    ({ children }) => React.createElement('div', null, renderChildren(children)),
    {
      displayName: 'Accordion',
    },
  );
  Accordion.Item = Object.assign(
    ({ children }) => React.createElement('div', null, renderChildren(children)),
    {
      displayName: 'Accordion.Item',
    },
  );
  Accordion.Heading = Object.assign(
    ({ children }) => React.createElement('div', null, renderChildren(children)),
    {
      displayName: 'Accordion.Heading',
    },
  );
  Accordion.Trigger = Object.assign(
    ({ children }) => React.createElement('button', null, renderChildren(children)),
    { displayName: 'Accordion.Trigger' },
  );
  Accordion.Panel = Object.assign(
    ({ children }) => React.createElement('div', null, renderChildren(children)),
    {
      displayName: 'Accordion.Panel',
    },
  );
  Accordion.Body = Object.assign(
    ({ children }) => React.createElement('div', null, renderChildren(children)),
    {
      displayName: 'Accordion.Body',
    },
  );
  Accordion.Indicator = Object.assign(
    ({ children }) => React.createElement('div', null, renderChildren(children)),
    { displayName: 'Accordion.Indicator' },
  );

  const ScrollShadow = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'ScrollShadow',
  });
  const Separator = Object.assign(
    ({ children, ...props }) => React.createElement('hr', props, children),
    {
      displayName: 'Separator',
    },
  );
  const TextArea = Object.assign(({ ...props }) => React.createElement('textarea', props, null), {
    displayName: 'TextArea',
  });
  const NumberField = Object.assign(
    ({ ...props }) => React.createElement('input', { type: 'number', ...props }, null),
    { displayName: 'NumberField' },
  );
  NumberField.Group = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'NumberField.Group',
  });
  NumberField.DecrementButton = Object.assign(
    ({ children }) => React.createElement('button', null, children),
    { displayName: 'NumberField.DecrementButton' },
  );
  NumberField.IncrementButton = Object.assign(
    ({ children }) => React.createElement('button', null, children),
    { displayName: 'NumberField.IncrementButton' },
  );
  NumberField.Input = Object.assign(
    ({ ...props }) => React.createElement('input', { ...props }, null),
    { displayName: 'NumberField.Input' },
  );

  const Tooltip = Object.assign(
    ({ children }) => React.createElement('div', null, renderChildren(children)),
    {
      displayName: 'Tooltip',
    },
  );
  Tooltip.Trigger = Object.assign(
    ({ children }) => React.createElement('div', null, renderChildren(children)),
    {
      displayName: 'Tooltip.Trigger',
    },
  );
  Tooltip.Content = Object.assign(
    ({ children }) => React.createElement('div', null, renderChildren(children)),
    {
      displayName: 'Tooltip.Content',
    },
  );
  Tooltip.Arrow = Object.assign(
    ({ children }) => React.createElement('div', null, renderChildren(children)),
    {
      displayName: 'Tooltip.Arrow',
    },
  );

  const ProgressBar = Object.assign(
    ({ value, ...props }) => React.createElement('div', { ...props }, value ?? null),
    { displayName: 'ProgressBar' },
  );
  const ProgressCircle = Object.assign(
    ({ size, ...props }) => React.createElement('div', { ...props }, `ProgressCircle:${size}`),
    { displayName: 'ProgressCircle' },
  );

  // Filter out HeroUI-specific props that shouldn't be rendered to DOM
  const filterHeroUIProps = (props) => {
    return props;
  };
  const AlertDialog = {};
  AlertDialog.displayName = 'AlertDialog';
  AlertDialog.Backdrop = ({ children, ...props }) =>
    React.createElement('div', filterHeroUIProps(props), children);
  AlertDialog.Backdrop.displayName = 'AlertDialog.Backdrop';
  AlertDialog.Container = ({ children }) => React.createElement('div', null, children);
  AlertDialog.Container.displayName = 'AlertDialog.Container';
  AlertDialog.Dialog = ({ children }) =>
    React.createElement(
      'div',
      null,
      typeof children === 'function' ? children({ close: () => {} }) : children,
    );
  AlertDialog.Dialog.displayName = 'AlertDialog.Dialog';
  AlertDialog.Header = ({ children }) => React.createElement('div', null, children);
  AlertDialog.Header.displayName = 'AlertDialog.Header';
  AlertDialog.Heading = ({ children }) => React.createElement('div', null, children);
  AlertDialog.Heading.displayName = 'AlertDialog.Heading';
  AlertDialog.Body = ({ children }) => React.createElement('div', null, children);
  AlertDialog.Body.displayName = 'AlertDialog.Body';
  AlertDialog.Footer = ({ children }) => React.createElement('div', null, children);
  AlertDialog.Footer.displayName = 'AlertDialog.Footer';
  AlertDialog.Icon = ({ children, ...props }) =>
    React.createElement('div', filterHeroUIProps(props), children);
  AlertDialog.Icon.displayName = 'AlertDialog.Icon';

  // Simple Form wrapper used by Login/Signup components
  const Form = Object.assign(
    ({ children, ...props }) => React.createElement('form', props, children),
    { displayName: 'Form' },
  );

  const toast = {
    success: () => {},
    info: () => {},
    error: () => {},
  };
  const Toast = ({ children }) => React.createElement('div', null, children);

  const exports = {
    Card,
    Button,
    Label,
    Chip,
    Alert,
    Input,
    Switch,
    Skeleton,
    Tabs,
    Select,
    ListBox,
    Accordion,
    ScrollShadow,
    Separator,
    TextArea,
    NumberField,
    Tooltip,
    ProgressBar,
    ProgressCircle,
    AlertDialog,
    Form,
    toast,
    Toast,
    // utility helper used by several components in tests
    cn: (...args) => args.filter(Boolean).join(' '),
  };

  // Provide a default export for consumers importing the module as a default.
  exports.default = exports;

  return {
    ...actual,
    ...exports,
  };
});

// Mock Supabase client so `AuthProvider` can be mounted in unit tests without
// requiring real environment variables or network calls. Tests can still
// override this mock when they need specific auth behavior.
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: () => {} } } })),
      signOut: vi.fn(async () => ({})),
    },
  },
}));

// Provide a basic ResizeObserver for Recharts
global.ResizeObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock recharts
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }) =>
      React.createElement('div', { className: 'recharts-responsive-container' }, children),
    PieChart: ({ children, ...props }) =>
      React.createElement('div', { 'data-testid': 'pie-chart', ...props }, children),
  };
});
