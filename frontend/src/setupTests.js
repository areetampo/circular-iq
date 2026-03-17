import '@testing-library/jest-dom';

// Fail tests if `useAuth` is called outside `AuthProvider` so missing provider
// usage is caught by CI instead of silently falling back. This converts the
// specific console.warn into a thrown error during tests.
const _originalConsoleWarn = console.warn;
console.warn = (...args) => {
  const msg = args[0] || '';
  if (typeof msg === 'string' && msg.includes('useAuth called outside AuthProvider')) {
    throw new Error(
      'useAuth called outside AuthProvider — wrap with AuthProvider or mock `useAuth` in tests',
    );
  }
  return _originalConsoleWarn.apply(console, args);
};

// Global test setup: mock browser/3rd-party UI libs that cause side effects in JSDOM
import React from 'react';
import { vi } from 'vitest';

const renderChildren = (children, props = {}) =>
  typeof children === 'function' ? children(props) : children;

// Stub environment variables for tests
vi.stubEnv('VITE_API_URL', 'http://localhost:3000');
vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:54321');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');
vi.stubEnv('MODE', 'test');

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
    ({ children, isDisabled, ...props }) =>
      React.createElement('button', { ...props, disabled: isDisabled }, renderChildren(children)),
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

  const Input = Object.assign(
    ({ children, ...props }) => React.createElement('input', props, null),
    { displayName: 'Input' },
  );
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
  const TextArea = Object.assign(
    ({ children, ...props }) => React.createElement('textarea', props, null),
    { displayName: 'TextArea' },
  );
  const NumberField = Object.assign(
    ({ children, ...props }) => React.createElement('input', { type: 'number', ...props }, null),
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
    ({ children, ...props }) => React.createElement('input', { ...props }, null),
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

  // Minimal AlertDialog mock for dialogs used in tests
  const AlertDialog = {};
  AlertDialog.displayName = 'AlertDialog';
  AlertDialog.Backdrop = ({ children, ...props }) => React.createElement('div', props, children);
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
  AlertDialog.Icon = ({ children, ...props }) => React.createElement('div', props, children);
  AlertDialog.Icon.displayName = 'AlertDialog.Icon';

  // Simple Form wrapper used by Login/Signup components
  const Form = Object.assign(
    ({ children, ...props }) => React.createElement('form', props, children),
    { displayName: 'Form' },
  );

  const toast = {
    success: (msg, opts) => {},
    info: (msg, opts) => {},
    error: (msg, opts) => {},
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

// Mock @mui/x-charts
vi.mock('@mui/x-charts/LineChart', () => ({
  LineChart: ({ dataset, series, ...props }) =>
    React.createElement('div', { 'data-testid': 'line-chart', ...props }, 'Mock LineChart'),
}));
vi.mock('@mui/x-charts/PieChart', () => ({
  PieChart: ({ series, ...props }) =>
    React.createElement('div', { 'data-testid': 'pie-chart', ...props }, 'Mock PieChart'),
}));

// Mock @mui/material
vi.mock('@mui/material', () => ({
  Box: ({ children, ...props }) => React.createElement('div', props, children),
  Paper: ({ children, ...props }) => React.createElement('div', props, children),
  Typography: ({ children, ...props }) => React.createElement('span', props, children),
  Chip: ({ children, ...props }) => React.createElement('span', props, children),
  InputAdornment: ({ children, ...props }) => React.createElement('div', props, children),
  TextField: ({ children, ...props }) => React.createElement('input', props, children),
  Grid: ({ children, ...props }) => React.createElement('div', props, children),
  Alert: ({ children, ...props }) => React.createElement('div', props, children),
  useTheme: () => ({
    palette: {
      primary: { main: '#1976d2' },
      secondary: { main: '#dc004e' },
      success: { main: '#388e3c' },
      warning: { main: '#f57c00' },
      error: { main: '#d32f2f' },
      info: { main: '#0288d1' },
    },
  }),
}));
