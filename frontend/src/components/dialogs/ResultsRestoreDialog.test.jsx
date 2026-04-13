import { fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { ResultsRestoreDialog } from './ResultsRestoreDialog';

// Mock the global dialog context
const mockDialog = {
  isOpen: true,
  type: 'resultsRestore',
  data: {
    sessionData: {
      inputs: {
        businessProblem: 'Test problem',
        businessSolution: 'Test solution',
        evaluationParameters: { a: 1 },
      },
      timestamp: new Date().toISOString(),
    },
  },
};

vi.mock('@/contexts/DialogContext', () => ({
  useGlobalDialog: () => ({
    isDialogOpen: true,
    dialog: mockDialog,
    onClose: vi.fn(),
  }),
  DialogProvider: ({ children }) => children,
}));

describe('ResultsRestoreDialog', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('does not render a "Restore Inputs" button (inputs are auto-synced)', () => {
    const { queryByText, getByText } = render(
      <MemoryRouter>
        <ResultsRestoreDialog />
      </MemoryRouter>,
    );

    // "Restore Inputs" button should be removed
    expect(queryByText(/Restore Inputs/i)).toBeNull();

    // "Restore Results" button may be present (disabled when no results)
    expect(getByText(/Restore Results/i)).toBeTruthy();
  });

  it('shows Restore Results when results exist and still no Restore Inputs button', () => {
    // Update mock to include results
    mockDialog.data.sessionData.results = { overall_score: 42 };

    const { queryByText, getByText } = render(
      <MemoryRouter>
        <ResultsRestoreDialog />
      </MemoryRouter>,
    );

    expect(getByText(/Restore Results/i)).toBeTruthy();
    expect(queryByText(/Restore Inputs/i)).toBeNull();
  });

  it('does not call onDismiss when user clicks cancel', () => {
    // Update mock to include results
    mockDialog.data.sessionData.results = { overall_score: 42 };
    const mockOnClose = vi.fn();

    // Update the mock to return our onClose function
    vi.mocked(require('@/contexts/DialogContext').useGlobalDialog).mockReturnValue({
      isDialogOpen: true,
      dialog: mockDialog,
      onClose: mockOnClose,
    });

    const { getByText } = render(
      <MemoryRouter>
        <ResultsRestoreDialog />
      </MemoryRouter>,
    );

    fireEvent.click(getByText(/Cancel/i));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('renders checkboxes in footer', () => {
    // Update mock to include results
    mockDialog.data.sessionData.results = { overall_score: 42 };

    const { getByText } = render(
      <MemoryRouter>
        <ResultsRestoreDialog />
      </MemoryRouter>,
    );

    expect(getByText('Clear calculated results')).toBeInTheDocument();
    expect(getByText(/Mute dialog for 10 mins/)).toBeInTheDocument();
  });

  it('disables restore button when clear results is checked', () => {
    // Update mock to include results
    mockDialog.data.sessionData.results = { overall_score: 42 };

    const { getByText } = render(
      <MemoryRouter>
        <ResultsRestoreDialog />
      </MemoryRouter>,
    );

    const clearResultsCheckbox = getByText('Clear calculated results');
    const restoreButton = getByText('Restore Results');

    // Initially restore button should be enabled
    expect(restoreButton).not.toBeDisabled();

    // Check the clear results checkbox
    fireEvent.click(clearResultsCheckbox);

    // Restore button should now be disabled
    expect(restoreButton).toBeDisabled();
  });

  it('sets localStorage when mute dialog is checked and cancel is clicked', () => {
    // Update mock to include results
    mockDialog.data.sessionData.results = { overall_score: 42 };

    const { getByText } = render(
      <MemoryRouter>
        <ResultsRestoreDialog />
      </MemoryRouter>,
    );

    const muteCheckbox = getByText(/Mute dialog for 10 mins/);
    const cancelButton = getByText('Cancel');

    // Check the mute dialog checkbox
    fireEvent.click(muteCheckbox);

    // Click cancel
    fireEvent.click(cancelButton);

    // Should set localStorage values
    expect(localStorage.getItem('results_restore_dialog_muted')).toBe('true');
    expect(localStorage.getItem('results_restore_dialog_muted_expiration')).toBeTruthy();
  });

  it('clears results when clear results is checked and cancel is clicked', () => {
    const mockSessionData = {
      results: { test: 'data' },
      inputs: { businessProblem: 'test' },
    };
    localStorage.setItem('session_evaluation_state', JSON.stringify(mockSessionData));

    // Update mock to include results
    mockDialog.data.sessionData.results = { overall_score: 42 };

    const { getByText } = render(
      <MemoryRouter>
        <ResultsRestoreDialog />
      </MemoryRouter>,
    );

    const clearResultsCheckbox = getByText('Clear calculated results');
    const cancelButton = getByText('Cancel');

    // Check the clear results checkbox
    fireEvent.click(clearResultsCheckbox);

    // Click cancel
    fireEvent.click(cancelButton);

    // Should update localStorage without results
    const updatedSessionData = JSON.parse(localStorage.getItem('session_evaluation_state') || '{}');
    expect(updatedSessionData.results).toBeUndefined();
    expect(updatedSessionData.inputs).toBeDefined();
  });
});
