import React from 'react';
import { render, screen } from '@testing-library/react';
import Switch from './Switch';

// the HeroUI implementation uses the `role="switch"` on the root element
// and applies BEM classes like "switch" etc.  This test ensures our wrapper
// still exposes the same API and that props pass through.

describe('Switch (wrapper)', () => {
  it('exposes HeroUI subcomponents and forwards props', () => {
    // static properties should be copied from the underlying component
    expect(Switch.Control).toBeDefined();
    expect(Switch.Thumb).toBeDefined();
    expect(Switch.Icon).toBeDefined();
    // Content is not guaranteed to be a static property; we're only interested
    // in the pieces we actually use in our code (Control/Thumb/Icon).

    render(
      <Switch isSelected={true} className="custom-class" data-testid="my-toggle">
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch>,
    );

    // our wrapper should render something with the data-testid we passed
    const wrapper = screen.getByTestId('my-toggle');
    expect(wrapper).toBeInTheDocument();

    // debug output to inspect actual DOM structure during test failure
    console.log('wrapper innerHTML:', wrapper.innerHTML);

    // custom class should have been merged into the rendered element
    expect(wrapper.className).toContain('custom-class');

    // the component rendered the expected children structure (two nested divs)
    // which correspond to <Switch.Control><Switch.Thumb />
    expect(wrapper.querySelector('div > div')).not.toBeNull();
  });
});
