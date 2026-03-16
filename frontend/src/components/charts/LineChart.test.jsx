import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import LineChart from './LineChart';

describe('LineChart', () => {
  test('renders with basic line data', () => {
    const data = [
      { period: '2025-01', value: 50 },
      { period: '2025-02', value: 60 },
      { period: '2025-03', value: 75 },
    ];

    const { container } = render(
      <LineChart
        data={data}
        lines={[{ dataKey: 'value', stroke: '#3b82f6', name: 'Value' }]}
        xAxisKey="period"
        height={300}
      />,
    );

    // Verify the component container renders without errors
    expect(container.firstChild).toBeTruthy();
  });

  test('renders with confidence interval band', () => {
    const data = [
      { period: '2025-01', score: 50, upper: 55, lower: 45 },
      { period: '2025-02', score: 60, upper: 65, lower: 55 },
      { period: '2025-03', score: 75, upper: 80, lower: 70 },
    ];

    const lines = [
      { dataKey: 'score', stroke: '#34a83a', name: 'Score' },
      {
        dataKey: 'ci',
        band: true,
        id: 'ci',
        upperKey: 'upper',
        lowerKey: 'lower',
        fill: '#e6f4ea',
        fillOpacity: 0.9,
      },
    ];

    const { container } = render(
      <LineChart
        data={data}
        lines={lines}
        xAxisKey="period"
        height={300}
        ariaLabel="Test chart with confidence interval"
      />,
    );

    // Verify the component renders
    expect(container.firstChild).toBeTruthy();
  });

  test('renders empty state when data is empty', () => {
    render(
      <LineChart
        data={[]}
        lines={[{ dataKey: 'value', stroke: '#3b82f6', name: 'Value' }]}
        xAxisKey="period"
        height={300}
      />,
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  test('applies aria label when provided', () => {
    const data = [{ period: '2025-01', value: 50 }];
    const { container } = render(
      <LineChart
        data={data}
        lines={[{ dataKey: 'value', stroke: '#3b82f6', name: 'Value' }]}
        xAxisKey="period"
        height={300}
        ariaLabel="Sales trend chart"
      />,
    );

    const chartDiv = container.querySelector('[role="img"]');
    expect(chartDiv).toHaveAttribute('aria-label', 'Sales trend chart');
  });
});
