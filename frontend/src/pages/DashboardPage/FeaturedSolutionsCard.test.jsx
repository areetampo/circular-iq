import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

// Provide a fake ResizeObserver used by Recharts in JSDOM
beforeAll(() => {
  global.ResizeObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeAll(() => {
  global.ResizeObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Mock common components
vi.mock(
  '@/components/common',
  () => ({
    Button: ({ children, ...props }) => React.createElement('button', props, children),
    Chip: ({ children, ...props }) => React.createElement('span', props, children),
  }),
  { virtual: true },
);

// Mock HeroUI components
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
  };
});

// Mock featured solutions hook (both alias and relative path used in the component)
vi.mock(
  '@/features/assessments/hooks/useFeaturedSolutions',
  () => ({
    useFeaturedSolutions: () => ({
      solutions: [
        {
          id: 's1',
          title: 'Test Solution',
          solution: 'This is a test solution description',
          category: 'Packaging',
          wordCount: 42,
        },
      ],
      isLoading: false,
      count: 1,
    }),
  }),
  { virtual: true },
);
vi.mock('../../features/assessments/hooks/useFeaturedSolutions', () => ({
  useFeaturedSolutions: () => ({
    solutions: [
      {
        id: 's1',
        title: 'Test Solution',
        solution: 'This is a test solution description',
        category: 'Packaging',
        wordCount: 42,
      },
    ],
    isLoading: false,
    count: 1,
  }),
}));

const openDashboardFeaturedSolutionsDrawer = vi.fn();
vi.mock('@/contexts/DrawerContext', () => ({
  useGlobalDrawer: () => ({
    openDashboardFeaturedSolutionsDrawer,
    drawer: null,
    isDrawerOpen: false,
    onClose: vi.fn(),
  }),
}));

describe('FeaturedSolutionsCard', () => {
  it('renders featured solutions and opens modal when Explore more clicked', async () => {
    // import after mocks are registered
    const { default: FeaturedSolutionsCard } = await import('./FeaturedSolutionsCard');

    render(<FeaturedSolutionsCard industry="test_industry" />);

    expect(screen.getByText('Featured Solutions')).toBeTruthy();
    expect(screen.getByText('Test Solution')).toBeTruthy();

    const explore = screen.getByRole('button', { name: /Explore more/i });
    fireEvent.click(explore);

    expect(openDashboardFeaturedSolutionsDrawer).toHaveBeenCalledWith({
      industry: 'test_industry',
      q: undefined,
    });
  });
});
