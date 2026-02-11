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
vi.mock(
  '@heroui/react',
  () => {
    const React = require('react');
    const mockCard = React.forwardRef((props, ref) =>
      React.createElement('div', { ref, ...props }, props.children),
    );
    mockCard.Header = ({ children, ...props }) => React.createElement('div', props, children);
    mockCard.Title = ({ children, ...props }) => React.createElement('h3', props, children);
    mockCard.Content = ({ children, ...props }) => React.createElement('div', props, children);

    return {
      Card: mockCard,
      Input: ({ ...props }) => React.createElement('input', props),
      Chip: ({ children, ...props }) => React.createElement('span', props, children),
    };
  },
  { virtual: true },
);

// Mock featured solutions hook
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

const openFeaturedSolutionsModal = vi.fn();
vi.mock(
  '@/pages/LandingPage/hooks/useLandingModals',
  () => ({
    default: () => ({
      openFeaturedSolutionsModal,
      modal: null,
      isModalOpen: false,
      onClose: vi.fn(),
    }),
  }),
  { virtual: true },
);

describe('FeaturedSolutionsCard', () => {
  it('renders featured solutions and opens modal when Explore more clicked', async () => {
    // import after mocks are registered
    const { default: FeaturedSolutionsCard } = await import('./FeaturedSolutionsCard');

    render(<FeaturedSolutionsCard industry="test_industry" />);

    expect(screen.getByText('Featured Solutions')).toBeTruthy();
    expect(screen.getByText('Test Solution')).toBeTruthy();

    const explore = screen.getByRole('button', { name: /Explore more/i });
    fireEvent.click(explore);

    expect(openFeaturedSolutionsModal).toHaveBeenCalledWith({
      industry: 'test_industry',
      q: undefined,
    });
  });
});
