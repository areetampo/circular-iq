import React from 'react';
import { render, screen } from '@testing-library/react';
import Button from './Button';

describe('Button (wrapper)', () => {
  it('renders disabled Button and exposes disabled data/aria attributes and cursor class', () => {
    render(<Button isDisabled>Disabled</Button>);

    const btn = screen.getByRole('button', { name: /Disabled/i });
    expect(btn).toBeInTheDocument();

    // Ensure the Tailwind data-variant class for disabled cursor is present on the element
    expect(btn.className).toContain('data-[disabled=true]:cursor-not-allowed');

    // HeroUI may surface disabled state via different attributes depending on implementation
    const hasDisabledAttr =
      btn.hasAttribute('disabled') ||
      btn.getAttribute('aria-disabled') === 'true' ||
      btn.getAttribute('data-disabled') === 'true';

    expect(hasDisabledAttr).toBe(true);
  });
});
