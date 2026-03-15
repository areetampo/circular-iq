/* global describe, it, expect */

import { parseSortBy } from './sortUtils';

describe('parseSortBy', () => {
  it('parses descending date by default', () => {
    expect(parseSortBy('created_at_desc')).toEqual({ field: 'created_at', order: 'desc' });
  });

  it('parses ascending title', () => {
    expect(parseSortBy('title_asc')).toEqual({ field: 'title', order: 'asc' });
  });

  it('handles single-word sorts gracefully', () => {
    expect(parseSortBy('score')).toEqual({ field: '', order: 'asc' });
  });
});
