import { act, fireEvent, render, screen } from '@testing-library/react';

import useDrawer from './useDrawer';

function HookHarness() {
  const drawer = useDrawer();
  return (
    <div>
      <div data-testid="drawer-type">{String(drawer.drawer?.type)}</div>
      <button onClick={() => drawer.openAssessmentMethodologyDrawer()}>open</button>
      <button onClick={() => drawer.onClose()}>close</button>
    </div>
  );
}

describe('useDrawer lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('keeps drawer mounted for the close animation duration', () => {
    render(<HookHarness />);

    fireEvent.click(screen.getByText('open'));
    expect(screen.getByTestId('drawer-type').textContent).toMatch(
      /ASSESSMENT|assessment|Assessment/,
    );

    fireEvent.click(screen.getByText('close'));
    expect(screen.getByTestId('drawer-type').textContent).not.toBe('null');

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getByTestId('drawer-type').textContent).not.toBe('null');

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByTestId('drawer-type').textContent).toBe('null');
  });
});
