import { render } from '@testing-library/react';
import { vi } from 'vitest';

// Provide ResizeObserver for Recharts
beforeAll(() => {
  global.ResizeObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

import PieChart from './PieChart';

describe('PieChart', () => {
  it('renders and matches snapshot', () => {
    const data = [
      { name: 'A', value: 40 },
      { name: 'B', value: 30 },
      { name: 'C', value: 30 },
    ];

    const { asFragment, container } = render(
      <div style={{ width: 600, height: 300 }}>
        <PieChart data={data} dataKey="value" nameKey="name" height={260} showLegend={true} />
      </div>,
    );

    // ensure Recharts container exists (ResponsiveContainer renders a placeholder in JSDOM)
    const resp = container.querySelector('.recharts-responsive-container');
    expect(resp).toBeTruthy();

    expect(asFragment()).toMatchSnapshot();
  });
});
