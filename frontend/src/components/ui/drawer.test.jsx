import React from 'react';
import { render, screen } from '@testing-library/react';
import { Drawer } from './drawer';
import { DrawerContent } from './drawer';

describe('Drawer primitive accessibility & timing', () => {
  it('injects hidden Title and Description when aria-label is provided', () => {
    render(
      <Drawer open onOpenChange={() => {}}>
        <DrawerContent direction="right" aria-label="Test drawer label">
          <div>Body</div>
        </DrawerContent>
      </Drawer>
    );

    // Title and Description should be present (sr-only)
    const title = screen.getByText('Test drawer label');
    expect(title).toBeTruthy();
  });

  it('uses faster transition duration on Drawer content (duration-200)', () => {
    const { container } = render(
      <Drawer open onOpenChange={() => {}}>
        <DrawerContent direction="bottom" aria-label="S">Body</DrawerContent>
      </Drawer>
    );

    const content = container.querySelector('[class*="transition-transform"]');
    expect(content).toBeTruthy();
    // className should include our faster duration token
    expect(content.className.includes('duration-200')).toBe(true);
  });
});