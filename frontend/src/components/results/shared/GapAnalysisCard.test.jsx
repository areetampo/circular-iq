/**
 * @module GapAnalysisCard.test
 * @description Tests for GapAnalysisCard rendering.
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import GapAnalysisCard from './GapAnalysisCard.jsx';

describe('GapAnalysisCard', () => {
  const mockResult = {
    gap_analysis: {
      has_benchmarks: true,
      message: 'Gap analysis completed successfully',
      comparisons: [{ factor: 'test_factor', current_score: 50, benchmark_score: 75 }],
      opportunities: ['test_factor'],
      strengths: ['another_factor'],
    },
  };

  it('renders when gap analysis data is available', () => {
    render(<GapAnalysisCard result={mockResult} variant="default" />);
    expect(screen.getByText('Gap Analysis')).toBeInTheDocument();
  });

  it('renders with transparent variant', () => {
    render(<GapAnalysisCard result={mockResult} variant="transparent" />);
    expect(screen.getByText('Gap Analysis')).toBeInTheDocument();
  });

  it('renders with assessment variant', () => {
    render(<GapAnalysisCard result={mockResult} variant="assessment" />);
    expect(screen.getByText('Gap Analysis')).toBeInTheDocument();
  });

  it('returns null when no gap analysis data', () => {
    const { container } = render(<GapAnalysisCard result={{}} variant="default" />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when has_benchmarks is false', () => {
    const resultWithoutBenchmarks = {
      gap_analysis: {
        has_benchmarks: false,
      },
    };
    const { container } = render(
      <GapAnalysisCard result={resultWithoutBenchmarks} variant="default" />,
    );
    expect(container.firstChild).toBeNull();
  });
});
