import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import useDrawer from './useDrawer';

// Simple harness component to exercise the hook directly
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

    // open
    fireEvent.click(screen.getByText('open'));
    expect(screen.getByTestId('drawer-type').textContent).toMatch(/ASSESSMENT|assessment|Assessment/);

    // initiate close — should still show the type immediately after
    fireEvent.click(screen.getByText('close'));
    expect(screen.getByTestId('drawer-type').textContent).not.toBe('null');

    // advance timers by less than the close animation — it should still be mounted
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getByTestId('drawer-type').textContent).not.toBe('null');

    // after the close animation timeout it should be unmounted
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByTestId('drawer-type').textContent).toBe('null');
  });
});