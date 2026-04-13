import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock the global dialog context
vi.mock('@/contexts/DialogContext', () => ({
  useGlobalDialog: () => ({
    isDialogOpen: true,
    dialog: {
      isOpen: true,
      type: 'resultsRestore',
      data: {
        sessionData: {
          inputs: {
            businessProblem: 'Test problem',
            businessSolution: 'Test solution',
            evaluationParameters: { a: 1 },
          },
          results: { overall_score: 42 },
          timestamp: new Date().toISOString(),
        },
      },
    },
    onClose: vi.fn(),
  }),
}));

// Mock formatting functions
vi.mock('@/lib/formatting', () => ({
  formatTimestamp: vi.fn(() => '[Test time]'),
  cleanUrl: vi.fn((url) => 'testsite.com'),
}));

import { ResultsRestoreDialog } from './ResultsRestoreDialog';

describe('ResultsRestoreDialog - Simple Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <ResultsRestoreDialog />
      </MemoryRouter>,
    );

    // Should find the main dialog elements
    expect(screen.getByText(/Restore your previous results/)).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Restore Results')).toBeInTheDocument();
  });

  it('renders checkboxes in footer', () => {
    render(
      <MemoryRouter>
        <ResultsRestoreDialog />
      </MemoryRouter>,
    );

    expect(screen.getByText('Clear calculated results')).toBeInTheDocument();
    expect(screen.getByText(/Mute dialog for 10 mins/)).toBeInTheDocument();
  });

  it('restore button is disabled when clear results is checked', () => {
    render(
      <MemoryRouter>
        <ResultsRestoreDialog />
      </MemoryRouter>,
    );

    const clearResultsCheckbox = screen.getByText('Clear calculated results');
    const restoreButton = screen.getByText('Restore Results');

    // Initially should be enabled
    expect(restoreButton).not.toBeDisabled();

    // Check the clear results checkbox
    clearResultsCheckbox.click();

    // Should now be disabled
    expect(restoreButton).toBeDisabled();
  });
});
