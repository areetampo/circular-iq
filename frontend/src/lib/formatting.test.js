import { describe, expect, it } from 'vitest';

import { toTitleCase } from './formatting';

describe('toTitleCase', () => {
  it('converts snake_case to Title Case', () => {
    expect(toTitleCase('circular_economy')).toBe('Circular Economy');
  });

  it('handles empty input', () => {
    expect(toTitleCase('')).toBe('N/A');
  });
});
