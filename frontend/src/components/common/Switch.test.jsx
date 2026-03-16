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

    render(
      <Switch isSelected={true} className="custom-class" data-testid="my-toggle">
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch>,
    );

    const wrapper = screen.getByTestId('my-toggle');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper.className).toContain('custom-class');
    // ensure at least one child element exists (stub markup may vary)
    expect(wrapper.innerHTML.trim()).not.toHaveLength(0);
  });

  it('applies public variant colors and icon automatically', () => {
    // initial render
    render(
      <Switch variant="public" size="sm" isSelected={false} data-testid="variant-switch">
        <Switch.Control>
          <Switch.Thumb>
            <Switch.Icon />
          </Switch.Thumb>
        </Switch.Control>
      </Switch>,
    );

    const wrapper = screen.getByTestId('variant-switch');
    console.log('variant-switch outerHTML (off):', wrapper.outerHTML);
    console.log('variant-switch innerHTML (off):', wrapper.innerHTML);
    // make assertions against the serialized markup instead of querying
    expect(wrapper.outerHTML).toContain('lucide-lock');
    expect(wrapper.outerHTML).toContain('width="10"');
    expect(wrapper.outerHTML).toContain('text-slate-500');

    // second render (mount new element), pick the new node
    render(
      <Switch variant="public" size="sm" isSelected={true} data-testid="variant-switch">
        <Switch.Control>
          <Switch.Thumb>
            <Switch.Icon />
          </Switch.Thumb>
        </Switch.Control>
      </Switch>,
    );
    const all = screen.getAllByTestId('variant-switch');
    const wrapperOn = all[all.length - 1];
    console.log('variant-switch innerHTML (on):', wrapperOn.innerHTML);
    expect(wrapperOn.outerHTML).toContain('text-emerald-600');
  });

  it('computes different icon sizes for md and lg', () => {
    const { rerender } = render(
      <Switch variant="benchmarks" size="md" isSelected={false} data-testid="size-switch">
        <Switch.Control>
          <Switch.Thumb>
            <Switch.Icon />
          </Switch.Thumb>
        </Switch.Control>
      </Switch>,
    );
    const wrapper = screen.getByTestId('size-switch');
    console.log('size-switch outerHTML (md):', wrapper.outerHTML);
    console.log('size-switch innerHTML (md):', wrapper.innerHTML);
    expect(wrapper.outerHTML).toContain('width="16"');
    expect(wrapper.outerHTML).toContain('lucide-x');

    rerender(
      <Switch variant="benchmarks" size="lg" isSelected={false} data-testid="size-switch">
        <Switch.Control>
          <Switch.Thumb>
            <Switch.Icon />
          </Switch.Thumb>
        </Switch.Control>
      </Switch>,
    );
    const wrapperLg = screen.getByTestId('size-switch');
    console.log('size-switch innerHTML (lg):', wrapperLg.innerHTML);
    expect(wrapperLg.outerHTML).toContain('width="17"');
  });
});
