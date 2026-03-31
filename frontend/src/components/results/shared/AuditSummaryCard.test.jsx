import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AuditSummaryCard } from './AuditSummaryCard.jsx';

describe('AuditSummaryCard', () => {
  const mockResult = {
    audit: {
      integrity_gaps: [{ severity: 'high', issue: 'Test high severity issue' }],
      strengths: [{ aspect: 'Test strength 1' }],
      technical_recommendations: ['Test recommendation 1'],
      market_opportunity_summary: 'Test market opportunity',
    },
  };

  it('renders when audit data is available', () => {
    render(<AuditSummaryCard result={mockResult} variant="default" />);
    expect(screen.getByText('AI Audit Summary')).toBeInTheDocument();
  });

  it('renders integrity gaps', () => {
    render(<AuditSummaryCard result={mockResult} variant="default" />);
    expect(screen.getByText('Integrity Gaps')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('renders strengths section', () => {
    render(<AuditSummaryCard result={mockResult} variant="default" />);
    expect(screen.getByText('Strengths')).toBeInTheDocument();
  });

  it('renders market opportunity section', () => {
    render(<AuditSummaryCard result={mockResult} variant="default" />);
    expect(screen.getByText('Market Opportunity')).toBeInTheDocument();
    expect(screen.getByText('Test market opportunity')).toBeInTheDocument();
  });

  it('returns null when no audit data', () => {
    const { container } = render(<AuditSummaryCard result={{}} variant="default" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders with assessment variant', () => {
    render(<AuditSummaryCard result={mockResult} variant="assessment" />);
    expect(screen.getByText('AI Audit Summary')).toBeInTheDocument();
  });
});
