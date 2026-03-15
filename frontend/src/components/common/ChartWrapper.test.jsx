import { vi } from 'vitest';

// mock helper to avoid alias resolution issues in test runner
vi.mock('../../utils/cn', () => ({ cn: (...args) => args.filter(Boolean).join(' ') }));

import { render } from '@testing-library/react';
import { ChartContainer } from './ChartWrapper';

// JSDOM doesn't implement ResizeObserver which Recharts uses internally
beforeAll(() => {
  global.ResizeObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('ChartContainer', () => {
  it('applies default height and minHeight', () => {
    const { getByText } = render(
      <ChartContainer>
        <div>child</div>
      </ChartContainer>,
    );

    const child = getByText('child');
    // climb up until we find the outer container with inline styles
    let node = child;
    while (node && node !== document.body) {
      if (node.style && (node.style.minHeight === '180px' || /\d+px$/.test(node.style.height)))
        break;
      node = node.parentElement;
    }
    expect(node).toBeTruthy();
    expect(node.style.height).toBe('280px');
    expect(node.style.minHeight).toBe('200px');
  });

  it('honors explicit height prop', () => {
    const { getByText } = render(
      <ChartContainer height={320}>
        <div>child2</div>
      </ChartContainer>,
    );

    const child = getByText('child2');
    let node = child;
    while (node && node !== document.body) {
      if (node.style && (node.style.minHeight === '180px' || /\d+px$/.test(node.style.height)))
        break;
      node = node.parentElement;
    }
    expect(node).toBeTruthy();
    expect(node.style.height).toBe('320px');
  });
});
