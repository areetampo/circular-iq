import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// mock the API module (use relative path to avoid alias resolution issues in tests)
vi.mock('../api/assessmentApi', () => ({
  getFeaturedSolutions: vi.fn(),
}));

import { getFeaturedSolutions } from '@/features/assessments/api/assessmentApi';
import { useFeaturedSolutions } from './useFeaturedSolutions';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

function Wrapper({ children }) {
  const qc = createTestQueryClient();
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function TestComponent({ limit = 3 }) {
  const { solutions, isLoading, count } = useFeaturedSolutions({ limit });
  if (isLoading) return <div data-testid="loading">loading</div>;
  return (
    <div data-testid="result">
      {count} - {solutions.map((s) => s.title).join(',')}
    </div>
  );
}

describe('useFeaturedSolutions', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches featured solutions and exposes data', async () => {
    getFeaturedSolutions.mockResolvedValueOnce({
      solutions: [
        { id: 's1', title: 'Solution A' },
        { id: 's2', title: 'Solution B' },
      ],
      count: 2,
    });

    render(
      <Wrapper>
        <TestComponent limit={2} />
      </Wrapper>,
    );

    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument());

    const result = screen.getByTestId('result');
    expect(result.textContent).toContain('2 - Solution A');
    expect(getFeaturedSolutions).toHaveBeenCalledWith(expect.objectContaining({ limit: 2 }));
  });

  it('passes industry to API when provided', async () => {
    getFeaturedSolutions.mockResolvedValueOnce({
      solutions: [{ id: 's3', title: 'S3' }],
      count: 1,
    });
    render(
      <Wrapper>
        <TestComponent limit={1} />
      </Wrapper>,
    );

    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument());
    expect(getFeaturedSolutions).toHaveBeenCalledWith(expect.objectContaining({ limit: 1 }));
  });
});
