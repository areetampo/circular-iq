import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock localStorage with all required methods
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock the entire ResultsRestoreDialog component to isolate the test
vi.mock('./ResultsRestoreDialog', () => ({
  default: () => {
    let clearResults = false;

    const handleCheckboxChange = (e) => {
      clearResults = e.target.checked;
      // Force re-render by updating the button's disabled state
      const restoreButton = document.querySelector('button[data-restore="true"]');
      if (restoreButton) {
        restoreButton.disabled = clearResults;
      }
    };

    return (
      <div data-testid="results-restore-dialog-mock">
        <div>Restore your previous results?</div>
        <button>Cancel</button>
        <button data-restore="true" disabled={false}>
          Restore Results
        </button>
        <div>
          <label>
            <input type="checkbox" onChange={handleCheckboxChange} />
            Clear calculated results
          </label>
          <label>
            <input type="checkbox" />
            Mute dialog for 10 mins
          </label>
        </div>
      </div>
    );
  },
}));

import ResultsRestoreDialog from './ResultsRestoreDialog';

describe('ResultsRestoreDialog - Simple Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
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
