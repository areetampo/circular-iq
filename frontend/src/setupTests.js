import '@testing-library/jest-dom';

// Global test setup: mock browser/3rd-party UI libs that cause side effects in JSDOM
import { vi } from 'vitest';
import React from 'react';

// Minimal mock for @heroui/react used by Card/Button components.
vi.mock('@heroui/react', () => {
  const Card = ({ children, ...props }) => React.createElement('div', props, children);
  Card.Header = ({ children }) =>
    React.createElement('div', { className: 'card-header' }, children);
  Card.Content = ({ children }) =>
    React.createElement('div', { className: 'card-content' }, children);
  Card.Title = ({ children }) => React.createElement('div', { className: 'card-title' }, children);
  Card.Description = ({ children }) =>
    React.createElement('div', { className: 'card-desc' }, children);

  const Button = ({ children, ...props }) => React.createElement('button', props, children);
  const Label = ({ children, ...props }) => React.createElement('label', props, children);
  const Chip = ({ children, ...props }) => React.createElement('span', props, children);

  const Input = ({ children, ...props }) => React.createElement('input', props, null);
  const Switch = ({ children, ...props }) => React.createElement('div', props, children);
  Switch.Control = ({ children }) => React.createElement('div', null, children);
  Switch.Thumb = ({ children }) => React.createElement('div', null, children);
  const Skeleton = ({ children }) => React.createElement('div', null, children);

  // Simple stubs for Tabs and Select/ListBox compound components
  const Tabs = ({ children }) => React.createElement('div', null, children);
  Tabs.ListContainer = ({ children }) => React.createElement('div', null, children);
  Tabs.List = ({ children }) => React.createElement('div', null, children);
  Tabs.Tab = ({ children }) => React.createElement('div', null, children);
  Tabs.Indicator = ({ children }) => React.createElement('div', null, children);

  const Select = ({ children }) => React.createElement('div', null, children);
  Select.Trigger = ({ children }) => React.createElement('div', null, children);
  Select.Popover = ({ children }) => React.createElement('div', null, children);
  Select.Value = ({ children }) => React.createElement('div', null, children);
  Select.Indicator = ({ children }) => React.createElement('div', null, children);

  const ListBox = ({ children }) => React.createElement('div', null, children);
  ListBox.Item = ({ children }) => React.createElement('div', null, children);

  const Accordion = ({ children }) => React.createElement('div', null, children);
  Accordion.Item = ({ children }) => React.createElement('div', null, children);
  Accordion.Heading = ({ children }) => React.createElement('div', null, children);
  Accordion.Trigger = ({ children }) => React.createElement('button', null, children);
  Accordion.Panel = ({ children }) => React.createElement('div', null, children);
  Accordion.Body = ({ children }) => React.createElement('div', null, children);
  Accordion.Indicator = ({ children }) => React.createElement('div', null, children);

  const ScrollShadow = ({ children }) => React.createElement('div', null, children);
  const TextArea = ({ children, ...props }) => React.createElement('textarea', props, null);
  const NumberField = ({ children, ...props }) =>
    React.createElement('input', { type: 'number', ...props }, null);
  NumberField.Group = ({ children }) => React.createElement('div', null, children);
  NumberField.DecrementButton = ({ children }) => React.createElement('button', null, children);
  NumberField.IncrementButton = ({ children }) => React.createElement('button', null, children);
  NumberField.Input = ({ children, ...props }) => React.createElement('input', { ...props }, null);

  const Tooltip = ({ children }) => React.createElement('div', null, children);
  Tooltip.Trigger = ({ children }) => React.createElement('div', null, children);
  Tooltip.Content = ({ children }) => React.createElement('div', null, children);
  Tooltip.Arrow = ({ children }) => React.createElement('div', null, children);

  // Minimal AlertDialog mock for dialogs used in tests
  const AlertDialog = ({ children }) => React.createElement('div', null, children);
  AlertDialog.Backdrop = ({ children, ...props }) => React.createElement('div', props, children);
  AlertDialog.Container = ({ children }) => React.createElement('div', null, children);
  AlertDialog.Dialog = ({ children }) =>
    React.createElement(
      'div',
      null,
      typeof children === 'function' ? children({ close: () => {} }) : children,
    );
  AlertDialog.Header = ({ children }) => React.createElement('div', null, children);
  AlertDialog.Heading = ({ children }) => React.createElement('div', null, children);
  AlertDialog.Body = ({ children }) => React.createElement('div', null, children);
  AlertDialog.Footer = ({ children }) => React.createElement('div', null, children);

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
  };
});

// Provide a basic ResizeObserver for Recharts
global.ResizeObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock utility helpers used broadly in components
vi.mock('@/utils/cn', () => ({ cn: (...args) => args.filter(Boolean).join(' ') }));
