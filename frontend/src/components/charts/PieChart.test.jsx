import { render } from '@testing-library/react';

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

    // ensure PieChart container exists
    const pie = container.querySelector('[data-testid="pie-chart"]');
    expect(pie).toBeTruthy();

    expect(asFragment()).toMatchSnapshot();
  });
});
