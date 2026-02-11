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

  return { Card, Button, Label, Chip, Tabs, Select, ListBox };
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
