import { render, fireEvent, waitFor } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import SampleTestCasesContainer from './SampleTestCasesContainer';
import testCases from '@/data/testCases.json';
import { DrawerProvider } from '@/contexts/DrawerContext';
import { DialogProvider } from '@/contexts/DialogContext';

const mockSaveSession = vi.fn();
vi.mock('@/features/session/hooks/useSession', () => ({
  useSession: () => ({
    saveSession: mockSaveSession,
  }),
}));

function Wrapper() {
  const methods = useForm({
    defaultValues: { businessProblem: '', businessSolution: '', parameters: {} },
  });
  return (
    <FormProvider {...methods}>
      <DialogProvider>
        <DrawerProvider>
          <SampleTestCasesContainer />
        </DrawerProvider>
      </DialogProvider>
    </FormProvider>
  );
}

describe('SampleTestCasesContainer', () => {
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('updates form values and persists session when a test case is selected', async () => {
    const { getByText } = render(<Wrapper />);

    const firstCase = testCases.testCases[0];
    const card = getByText(firstCase.title);

    fireEvent.click(card);

    // saveSession should be called immediately when a user selects a sample
    await waitFor(() => expect(mockSaveSession).toHaveBeenCalled());
    expect(mockSaveSession).toHaveBeenCalledWith(
      expect.objectContaining({
        inputs: expect.objectContaining({
          businessProblem: expect.stringContaining(firstCase.problem),
        }),
      }),
    );
  });
});
