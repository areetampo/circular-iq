import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock hooks and dependencies
vi.mock('@/features/assessments', async () => {
  const actual = await vi.importActual('@/features/assessments');
  return {
    ...actual,
    useMarketAnalysis: () => ({
      marketData: [
        {
          industry: 'energy',
          avg_score: 70,
          min_score: 60,
          max_score: 80,
          count: 2,
          scale: 'Medium',
        },
      ],
      stats: { avg_score: 70, median_score: 65, total_count: 100, min_score: 20, max_score: 95 },
      userScore: 72,
      userIndustry: 'energy',
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    }),
    getEnhancedAnalytics: vi.fn(async () => ({
      timeSeries: [
        {
          label: '2025-01',
          averageScore: 60,
          stdDev: 2.2,
          confidenceUpper: 62.1,
          confidenceLower: 57.9,
        },
      ],
      overallVolatility: 5.2,
      industryMarketShare: 12.5,
    })),
  };
});

vi.mock('@/components/charts/BarChart', () => ({
  default: (props) => <div data-testid="bar-chart">BarChart</div>,
}));
vi.mock('@/components/charts/ScatterChart', () => ({
  default: (props) => <div data-testid="scatter-chart">ScatterChart</div>,
}));
vi.mock('@/components/charts/LineChart', () => ({
  default: (props) => (
    <div
      data-testid="line-chart"
      data-lines={JSON.stringify(props.lines)}
      data-aria={props.ariaLabel || ''}
    >
      LineChart
    </div>
  ),
}));

import { Providers } from '@/test/test-utils';
import MarketAnalysisPage from './MarketAnalysisPage';
import { getEnhancedAnalytics } from '@/features/assessments';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('MarketAnalysisPage', () => {
  const createTestQueryClient = () =>
    new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

  function Wrapper({ children }) {
    const qc = createTestQueryClient();
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  }

  test('renders export buttons and time range controls', async () => {
    render(
      <Providers initialEntries={['/assessments/123/market-analysis']}>
        <Routes>
          <Route path="/assessments/:id/market-analysis" element={<MarketAnalysisPage />} />
        </Routes>
      </Providers>,
    );

    // Export buttons should be visible but disabled for anonymous users
    const csvBtn = await screen.findByRole('button', { name: /Export market data as CSV/i });
    const pdfBtn = screen.getByRole('button', { name: /Export market analysis as PDF/i });

    expect(csvBtn).toBeInTheDocument();
    expect(pdfBtn).toBeInTheDocument();

    expect(csvBtn).toBeDisabled();
    expect(pdfBtn).toBeDisabled();

    expect(csvBtn).toHaveAttribute('title', 'Sign in to get access to them');
    expect(pdfBtn).toHaveAttribute('title', 'Sign in to get access to them');

    // Time range controls
    expect(screen.getByText('12m')).toBeInTheDocument();
    fireEvent.click(screen.getByText('24m'));
    expect(screen.getByText('24m')).toBeInTheDocument();

    // Granularity controls
    expect(screen.getByText('Monthly')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Weekly'));
    expect(screen.getByText('Weekly')).toBeInTheDocument();

    // Indicators from enhanced analytics
    expect(await screen.findByText(/Market Volatility/i)).toBeInTheDocument();
    expect(screen.getByText(/Industry Market Share/i)).toBeInTheDocument();

    // Ensure granularity was passed to the enhanced analytics call
    expect(getEnhancedAnalytics).toHaveBeenCalledWith(
      expect.objectContaining({ industry: 'energy', timeRange: '12m', granularity: 'monthly' }),
    );

    // Ensure CI lines were passed to the LineChart component
    const lineChart = await screen.findByTestId('line-chart');
    const linesProp = JSON.parse(lineChart.getAttribute('data-lines'));
    expect(linesProp.some((l) => l.name === 'Upper CI')).toBe(true);
    // Ensure a band entry was passed for confidence intervals
    expect(linesProp.some((l) => l.band === true && l.id === 'ci')).toBe(true);

    // Aria label for chart is set and mentions the industry and granularity
    const aria = lineChart.getAttribute('data-aria');
    expect(aria).toMatch(/industry/i);
    expect(aria).toMatch(/monthly|weekly|daily/i);
  });

  test('uses session result for /results/market-analysis (anonymous or authenticated)', async () => {
    // Put a session evaluation with a result into localStorage
    const session = {
      inputs: { businessProblem: 'P', businessSolution: 'S', parameters: {} },
      results: { overall_score: 72, metadata: { industry: 'energy' } },
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('session_evaluation_state', JSON.stringify(session));

    render(
      <Providers initialEntries={['/results/market-analysis']}>
        <Routes>
          <Route path="/results/market-analysis" element={<MarketAnalysisPage />} />
        </Routes>
      </Providers>,
    );

    // Aggregate export buttons should be present but disabled for anonymous users (page is public)
    const csvBtn = await screen.findByRole('button', { name: /Export market data as CSV/i });
    expect(csvBtn).toBeInTheDocument();
    expect(csvBtn).toBeDisabled();
    expect(csvBtn).toHaveAttribute('title', 'Sign in to get access to them');

    // Enhanced analytics should be requested for the session industry's trend
    await waitFor(() =>
      expect(getEnhancedAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({ industry: 'energy' }),
      ),
    );

    // Line chart should be rendered
    expect(await screen.findByTestId('line-chart')).toBeInTheDocument();
  });
});
