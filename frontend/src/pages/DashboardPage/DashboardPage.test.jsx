import { render } from '@testing-library/react';
import { vi } from 'vitest';

// Mock utility helpers
vi.mock('../../utils/cn', () => ({ cn: (...args) => args.filter(Boolean).join(' ') }));

// Mock react-router-dom search params used by Dashboard
vi.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

// Provide a fake ResizeObserver used by Recharts in JSDOM
beforeAll(() => {
  global.ResizeObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Mock shared common components that are imported via path aliases
vi.mock('@/components/common', () => ({
  Button: ({ children, ...props }) => React.createElement('button', props, children),
  Chip: ({ children, ...props }) => React.createElement('span', props, children),
}));

// Mock HeroUI components used by FeaturedSolutionsCard and Dashboard
vi.mock('@heroui/react', () => {
  const React = require('react');
  const mockCard = React.forwardRef((props, ref) =>
    React.createElement('div', { ref, ...props }, props.children),
  );
  mockCard.displayName = 'Card';
  mockCard.Header = ({ children, ...props }) => React.createElement('div', props, children);
  mockCard.Header.displayName = 'Card.Header';
  mockCard.Title = ({ children, ...props }) => React.createElement('h3', props, children);
  mockCard.Title.displayName = 'Card.Title';
  mockCard.Description = ({ children, ...props }) => React.createElement('p', props, children);
  mockCard.Description.displayName = 'Card.Description';
  mockCard.Content = ({ children, ...props }) => React.createElement('div', props, children);
  mockCard.Content.displayName = 'Card.Content';

  return {
    Card: mockCard,
    Input: Object.assign(({ ...props }) => React.createElement('input', props), {
      displayName: 'Input',
    }),
    Chip: Object.assign(({ children, ...props }) => React.createElement('span', props, children), {
      displayName: 'Chip',
    }),
    Label: Object.assign(
      ({ children, ...props }) => React.createElement('label', props, children),
      { displayName: 'Label' },
    ),
    Select: Object.assign(({ children, ...props }) => React.createElement('div', props, children), {
      displayName: 'Select',
    }),
    ListBox: ({ children, ...props }) => React.createElement('div', props, children),
    Tabs: ({ children, ...props }) => React.createElement('div', props, children),
    Skeleton: ({ ...props }) => React.createElement('div', props),
    Table: ({ children, ...props }) => React.createElement('table', props, children),
    TableHeader: ({ children, ...props }) => React.createElement('thead', props, children),
    TableBody: ({ children, ...props }) => React.createElement('tbody', props, children),
    TableRow: ({ children, ...props }) => React.createElement('tr', props, children),
    TableColumn: ({ children, ...props }) => React.createElement('th', props, children),
    TableCell: ({ children, ...props }) => React.createElement('td', props, children),
  };
});

// Mock the analytics hook to provide deterministic data for the snapshot
vi.mock('@/features/assessments/hooks/useEnhancedAnalytics', () => ({
  useEnhancedAnalytics: () => ({
    aggregate: { totalCount: 123, averageScore: 72.5, avgViability: 60, medianScore: 73 },
    industryMetrics: [
      { industry: 'manufacturing', count: 40, averageScore: 68, avgViability: 58 },
      { industry: 'fashion', count: 30, averageScore: 74, avgViability: 61 },
    ],
    timeSeries: [
      { period: '2025-07', averageScore: 70 },
      { period: '2025-08', averageScore: 72 },
      { period: '2025-09', averageScore: 74 },
    ],
    scoreDistribution: [
      { name: '0-20', value: 2, percent: 1 },
      { name: '21-40', value: 10, percent: 8 },
      { name: '41-60', value: 30, percent: 24 },
      { name: '61-80', value: 60, percent: 49 },
      { name: '81-100', value: 21, percent: 18 },
    ],
    strategyDistribution: [
      { name: 'Reduce', value: 50, color: '#3b82f6' },
      { name: 'Reuse', value: 40, color: '#10b981' },
    ],
    scaleDistribution: [
      { name: 'SMB', value: 70, color: '#3b82f6' },
      { name: 'Enterprise', value: 30, color: '#10b981' },
    ],
    trends: { recentGrowth: 1.2, scoreImprovement: 0.8 },
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
  }),
}));

// Mock featured solutions hook
vi.mock('@/features/assessments/hooks/useFeaturedSolutions', () => ({
  useFeaturedSolutions: () => ({
    solutions: [
      {
        id: 's1',
        title: 'Pack redesign',
        solution: 'Use mono-materials for packaging',
        category: 'Packaging',
        wordCount: 80,
      },
      {
        id: 's2',
        title: 'Return scheme',
        solution: 'Introduce deposit-return system',
        category: 'Logistics',
        wordCount: 140,
      },
    ],
    isLoading: false,
    count: 2,
  }),
}));

// Mock clocked timestamp formatter to keep snapshots stable
vi.mock('@/lib/formatting', () => ({
  getCurrentTimestampFormatted: () => '11 Feb 2026, 10:00 am',
}));

// Mock drawer hook so Dashboard can call openDashboardFeaturedSolutionsDrawer without side effects
vi.mock('@/hooks/useDrawer', () => ({
  default: () => ({
    openDashboardFeaturedSolutionsDrawer: vi.fn(),
    drawer: null,
    isDrawerOpen: false,
    onClose: vi.fn(),
  }),
}));

// Stub chart components to avoid heavy Recharts rendering in JSDOM during page import
vi.mock('@/components/charts', () => ({
  PieChart: (props) => React.createElement('div', { 'data-testid': 'pie-chart' }, 'PieChart'),
  LineChart: (props) => React.createElement('div', { 'data-testid': 'line-chart' }, 'LineChart'),
  ComboChart: (props) => React.createElement('div', { 'data-testid': 'combo-chart' }, 'ComboChart'),
}));

// Stub DrawerManager to prevent drawer render side-effects
vi.mock('@/components/drawers/DrawerManager', () => ({
  default: () => null,
}));

// Stub export utility and prevent HeroUI toast side-effects
vi.mock('@/lib/exportDashboard', () => ({ exportDashboardToPDF: async () => true }));
vi.mock('@heroui/react', async () => {
  const actual = await vi.importActual('@heroui/react');
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      danger: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    },
  };
});

// Stub industry filter component to a simple placeholder
vi.mock('@/components/filters/IndustryChipFilter', () => ({
  default: ({ industries }) => React.createElement('div', null, 'IndustryChipFilter'),
}));

// NOTE: This test can be slow importing the full page — set a per-test timeout option

describe('DashboardPage (snapshot)', () => {
  it('renders Overview section consistently', { timeout: 20000 }, async () => {
    // NOTE: This test imports the full page; we stub heavy dependencies above to keep it deterministic
    const { default: DashboardPage } = await import('./DashboardPage');

    const { asFragment, getByText } = render(<DashboardPage />);

    // quick sanity check the page rendered key elements
    expect(getByText('Global Dashboard')).toBeTruthy();
    expect(getByText('Featured Solutions')).toBeTruthy();

    expect(asFragment()).toMatchSnapshot();
  });
});
