import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { DialogProvider } from '@/contexts/DialogContext';

import { SessionRestoreDialog } from './SessionRestoreDialog';

describe('SessionRestoreDialog', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('does not render a "Restore Inputs" button (inputs are auto-synced)', () => {
    const sessionData = {
      inputs: {
        businessProblem: 'Test problem',
        businessSolution: 'Test solution',
        evaluationParameters: { a: 1 },
      },
      timestamp: new Date().toISOString(),
    };

    const { queryByText, getByText } = render(
      <MemoryRouter>
        <DialogProvider>
          <SessionRestoreDialog isOpen={true} sessionData={sessionData} onDismiss={() => {}} />
        </DialogProvider>
      </MemoryRouter>,
    );

    // Message about saved inputs should still be shown
    expect(getByText(/Your inputs are already saved locally/i)).toBeTruthy();

    // "Restore Inputs" button should be removed
    expect(queryByText(/Restore Inputs/i)).toBeNull();

    // "Restore Results" button may be present (disabled when no results)
    expect(getByText(/Restore Results/i)).toBeTruthy();
  });

  it('shows Restore Results when results exist and still no Restore Inputs button', () => {
    const sessionData = {
      inputs: { businessProblem: 'x', businessSolution: 'y', evaluationParameters: {} },
      results: { overall_score: 42 },
      timestamp: new Date().toISOString(),
    };

    const { queryByText, getByText } = render(
      <MemoryRouter>
        <DialogProvider>
          <SessionRestoreDialog isOpen={true} sessionData={sessionData} onDismiss={() => {}} />
        </DialogProvider>
      </MemoryRouter>,
    );

    expect(getByText(/Your inputs are already saved locally/i)).toBeTruthy();
    expect(getByText(/Restore Results/i)).toBeTruthy();
    expect(queryByText(/Restore Inputs/i)).toBeNull();
  });
});
