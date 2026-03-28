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

  it('handles default parameter', () => {
    expect(parseSortBy()).toEqual({ field: 'created_at', order: 'desc' });
  });

  it('handles empty string', () => {
    expect(parseSortBy('')).toEqual({ field: '', order: 'asc' });
  });

  it('handles null input', () => {
    expect(parseSortBy(null)).toEqual({ field: '', order: 'asc' });
  });

  it('handles undefined input', () => {
    expect(parseSortBy(undefined)).toEqual({ field: 'created_at', order: 'desc' });
  });

  it('handles numeric input converted to string', () => {
    expect(parseSortBy(123)).toEqual({ field: '', order: 'asc' });
  });

  it('handles multi-word field names', () => {
    expect(parseSortBy('company_name_desc')).toEqual({ field: 'company_name', order: 'desc' });
  });

  it('handles complex field names with multiple underscores', () => {
    expect(parseSortBy('assessment_category_score_asc')).toEqual({
      field: 'assessment_category_score',
      order: 'asc',
    });
  });

  it('defaults to asc when order is not desc', () => {
    expect(parseSortBy('title_unknown')).toEqual({ field: 'title', order: 'asc' });
  });
});
