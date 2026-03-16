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

// Minimal mock for @heroui/react used by Card/Button components.
vi.mock('@heroui/react', () => {
  const Card = Object.assign(
    ({ children, ...props }) => React.createElement('div', props, children),
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
    ({ children, ...props }) => React.createElement('button', props, children),
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

  const Input = Object.assign(
    ({ children, ...props }) => React.createElement('input', props, null),
    { displayName: 'Input' },
  );
  const Switch = Object.assign(
    ({ children, ...props }) => React.createElement('div', props, children),
    { displayName: 'Switch' },
  );
  Switch.Control = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'Switch.Control',
  });
  Switch.Thumb = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'Switch.Thumb',
  });
  Switch.Icon = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'Switch.Icon',
  });
  const Skeleton = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'Skeleton',
  });

  // Simple stubs for Tabs and Select/ListBox compound components
  const Tabs = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'Tabs',
  });
  Tabs.ListContainer = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'Tabs.ListContainer',
  });
  Tabs.List = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'Tabs.List',
  });
  Tabs.Tab = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'Tabs.Tab',
  });
  Tabs.Indicator = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'Tabs.Indicator',
  });

  const Select = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'Select',
  });
  Select.Trigger = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'Select.Trigger',
  });
  Select.Popover = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'Select.Popover',
  });
  Select.Value = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'Select.Value',
  });
  Select.Indicator = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'Select.Indicator',
  });

  const ListBox = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'ListBox',
  });
  ListBox.Item = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'ListBox.Item',
  });

  const Accordion = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'Accordion',
  });
  Accordion.Item = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'Accordion.Item',
  });
  Accordion.Heading = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'Accordion.Heading',
  });
  Accordion.Trigger = Object.assign(
    ({ children }) => React.createElement('button', null, children),
    { displayName: 'Accordion.Trigger' },
  );
  Accordion.Panel = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'Accordion.Panel',
  });
  Accordion.Body = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'Accordion.Body',
  });
  Accordion.Indicator = Object.assign(
    ({ children }) => React.createElement('div', null, children),
    { displayName: 'Accordion.Indicator' },
  );

  const ScrollShadow = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'ScrollShadow',
  });
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

  const Tooltip = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'Tooltip',
  });
  Tooltip.Trigger = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'Tooltip.Trigger',
  });
  Tooltip.Content = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'Tooltip.Content',
  });
  Tooltip.Arrow = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'Tooltip.Arrow',
  });

  // Minimal AlertDialog mock for dialogs used in tests
  const AlertDialog = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'AlertDialog',
  });
  AlertDialog.Backdrop = Object.assign(
    ({ children, ...props }) => React.createElement('div', props, children),
    { displayName: 'AlertDialog.Backdrop' },
  );
  AlertDialog.Container = Object.assign(
    ({ children }) => React.createElement('div', null, children),
    { displayName: 'AlertDialog.Container' },
  );
  AlertDialog.Dialog = Object.assign(
    ({ children }) =>
      React.createElement(
        'div',
        null,
        typeof children === 'function' ? children({ close: () => {} }) : children,
      ),
    { displayName: 'AlertDialog.Dialog' },
  );
  AlertDialog.Header = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'AlertDialog.Header',
  });
  AlertDialog.Heading = Object.assign(
    ({ children }) => React.createElement('div', null, children),
    { displayName: 'AlertDialog.Heading' },
  );
  AlertDialog.Body = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'AlertDialog.Body',
  });
  AlertDialog.Footer = Object.assign(({ children }) => React.createElement('div', null, children), {
    displayName: 'AlertDialog.Footer',
  });

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

  return {
    Card,
    Button,
    Label,
    Chip,
    Input,
    Switch,
    Skeleton,
    Tabs,
    Select,
    ListBox,
    Accordion,
    ScrollShadow,
    TextArea,
    NumberField,
    Tooltip,
    AlertDialog,
    toast,
    Toast,
    // utility helper used by several components in tests
    cn: (...args) => args.filter(Boolean).join(' '),
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

// Mock utility helpers used broadly in components
vi.mock('@/utils/cn', () => ({ cn: (...args) => args.filter(Boolean).join(' ') }));
