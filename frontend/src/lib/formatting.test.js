import { describe, expect, it } from 'vitest';

import { titleize } from './formatting';

describe('titleize', () => {
  it('converts snake_case to Title Case', () => {
    expect(titleize('circular_economy')).toBe('Circular Economy');
  });

  it('handles empty input', () => {
    expect(titleize('')).toBe('N/A');
  });
});
