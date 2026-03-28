import { describe, expect, it } from 'vitest';

import {
  categorizeIntegrityGaps,
  extractCaseInfo,
  extractKeywords,
  extractProblemSolution,
  extractSummary,
  getMatchStrength,
  parseMarkdownToHtml,
} from './content';

describe('content utilities', () => {
  describe('extractProblemSolution', () => {
    it('extracts from structured metadata fields', () => {
      const caseItem = {
        metadata: {
          fields: {
            problem: 'This is the problem description',
            solution: 'This is the solution description',
          },
        },
      };

      const result = extractProblemSolution(caseItem);

      expect(result).toEqual({
        problem: 'This is the problem description',
        solution: 'This is the solution description',
      });
    });

    it('extracts from explicit Problem: Solution: pattern', () => {
      const content =
        'Problem: We have a major issue with waste management\n\nSolution: Implement a circular economy approach';
      const caseItem = { content };

      const result = extractProblemSolution(caseItem);

      expect(result.problem).toBe('We have a major issue with waste management');
      expect(result.solution).toBe('Implement a circular economy approach');
    });

    it('handles single line Problem: Solution: pattern', () => {
      const content = 'Problem: High costs Solution: Reduce expenses through optimization';
      const caseItem = { content };

      const result = extractProblemSolution(caseItem);

      expect(result.problem).toBe('High costs');
      expect(result.solution).toBe('Reduce expenses through optimization');
    });

    it('splits by common solution indicators', () => {
      const content =
        'Our company faces significant challenges with plastic waste and this is a very long problem description that goes on for more than one hundred characters to ensure it meets the minimum requirements. However, we propose a comprehensive recycling program that addresses this issue effectively through innovative approaches and sustainable practices.';
      const caseItem = { content };

      const result = extractProblemSolution(caseItem);

      expect(result.problem).toContain(
        'Our company faces significant challenges with plastic waste',
      );
      expect(result.solution).toContain('we propose a comprehensive recycling program');
    });

    it('splits content roughly in half for long content', () => {
      const content =
        'This is a very long problem description that goes on and on and provides lots of detail about the issues faced. It continues with more information about the challenges. Meanwhile, the solution part would be here with details about how to address these problems through innovative approaches and sustainable practices.';
      const caseItem = { content };

      const result = extractProblemSolution(caseItem);

      expect(result.problem).toBeTruthy();
      expect(result.solution).toBeTruthy();
      expect(result.problem.length).toBeGreaterThan(50);
      expect(result.solution.length).toBeGreaterThan(50);
    });

    it('handles empty or missing content', () => {
      const result1 = extractProblemSolution(null);
      const result2 = extractProblemSolution('');
      const result3 = extractProblemSolution({ content: '' });

      expect(result1.problem).toBe('Problem data unavailable');
      expect(result1.solution).toBe('Solution data unavailable');
      expect(result2.problem).toBe('Problem data unavailable');
      expect(result2.solution).toBe('Solution data unavailable');
      expect(result3.problem).toBe('Problem data unavailable');
      expect(result3.solution).toBe('Solution data unavailable');
    });

    it('handles string input directly', () => {
      const content = 'Problem: Test problem\n\nSolution: Test solution';
      const result = extractProblemSolution(content);

      expect(result.problem).toBe('Test problem');
      expect(result.solution).toBe('Test solution');
    });
  });

  describe('extractCaseInfo', () => {
    it('extracts case information correctly', () => {
      const caseItem = {
        similarity: 0.85,
        id: 'case-123',
        content: 'This is the case content',
      };

      const result = extractCaseInfo(caseItem, 2);

      expect(result).toEqual({
        matchPercentage: 85,
        sourceCaseId: 'case-123',
        content: 'This is the case content',
      });
    });

    it('handles missing similarity', () => {
      const caseItem = {
        id: 'case-456',
        content: 'Content without similarity',
      };

      const result = extractCaseInfo(caseItem, 1);

      expect(result.matchPercentage).toBe(0);
      expect(result.sourceCaseId).toBe('case-456');
    });

    it('handles missing id', () => {
      const caseItem = {
        similarity: 0.75,
        content: 'Content without id',
      };

      const result = extractCaseInfo(caseItem, 3);

      expect(result.sourceCaseId).toBe(4); // index + 1
    });
  });

  describe('getMatchStrength', () => {
    it('returns excellent match for high similarity', () => {
      const result = getMatchStrength(0.85);
      expect(result).toEqual({
        label: 'Excellent Match',
        color: 'text-green-600',
      });
    });

    it('returns strong match for good similarity', () => {
      const result = getMatchStrength(0.7);
      expect(result).toEqual({
        label: 'Strong Match',
        color: 'text-blue-600',
      });
    });

    it('returns decent match for moderate similarity', () => {
      const result = getMatchStrength(0.5);
      expect(result).toEqual({
        label: 'Decent Match',
        color: 'text-yellow-600',
      });
    });

    it('returns poor match for low similarity', () => {
      const result = getMatchStrength(0.3);
      expect(result).toEqual({
        label: 'Poor Match',
        color: 'text-red-600',
      });
    });

    it('handles boundary values', () => {
      expect(getMatchStrength(0.8).label).toBe('Excellent Match');
      expect(getMatchStrength(0.79).label).toBe('Strong Match');
      expect(getMatchStrength(0.6).label).toBe('Strong Match');
      expect(getMatchStrength(0.59).label).toBe('Decent Match');
      expect(getMatchStrength(0.4).label).toBe('Decent Match');
      expect(getMatchStrength(0.39).label).toBe('Poor Match');
    });
  });

  describe('categorizeIntegrityGaps', () => {
    it('categorizes gaps correctly', () => {
      const gaps = ['gap1', 'gap2', 'gap3'];
      const result = categorizeIntegrityGaps(gaps);

      expect(result).toEqual({
        strengths: [],
        gaps: ['gap1', 'gap2', 'gap3'],
      });
    });

    it('handles non-array input', () => {
      const result = categorizeIntegrityGaps('not an array');

      expect(result).toEqual({
        strengths: [],
        gaps: [],
      });
    });

    it('handles empty array', () => {
      const result = categorizeIntegrityGaps([]);

      expect(result).toEqual({
        strengths: [],
        gaps: [],
      });
    });
  });

  describe('extractSummary', () => {
    it('returns short text as-is', () => {
      const text = 'Short text';
      const result = extractSummary(text, 200);

      expect(result).toBe('Short text');
    });

    it('truncates at sentence boundary', () => {
      const text =
        'This is a long sentence that goes on and on. This is another sentence. And a third one.';
      const result = extractSummary(text, 50);

      expect(result).toBe('This is a long sentence that goes on and on.');
    });

    it('truncates at space boundary when no sentence', () => {
      const text = 'This is a very long text without any sentence boundaries just words and spaces';
      const result = extractSummary(text, 40);

      expect(result).toBe('This is a very long text without any...');
    });

    it('handles empty input', () => {
      expect(extractSummary('')).toBe('');
      expect(extractSummary(null)).toBe('');
      expect(extractSummary(undefined)).toBe('');
    });

    it('uses custom max length', () => {
      const text = 'This is a sentence. Another sentence here.';
      const result = extractSummary(text, 20);

      expect(result).toBe('This is a sentence.');
    });
  });

  describe('parseMarkdownToHtml', () => {
    it('converts headers', () => {
      const content = '# Header 1\n## Header 2\n### Header 3';
      const result = parseMarkdownToHtml(content);

      expect(result).toContain('<h1>Header 1</h1>');
      expect(result).toContain('<h2>Header 2</h2>');
      expect(result).toContain('<h3>Header 3</h3>');
    });

    it('converts bold and italic', () => {
      const content = 'This is **bold** and this is *italic* text';
      const result = parseMarkdownToHtml(content);

      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
    });

    it('converts line breaks', () => {
      const content = 'Line 1\n\nLine 2\nLine 3';
      const result = parseMarkdownToHtml(content);

      expect(result).toContain('</p><p>');
      expect(result).toContain('<br>');
    });

    it('wraps content in paragraphs', () => {
      const content = 'Simple text content';
      const result = parseMarkdownToHtml(content);

      expect(result).toBe('<p>Simple text content</p>');
    });

    it('handles empty input', () => {
      expect(parseMarkdownToHtml('')).toBe('');
      expect(parseMarkdownToHtml(null)).toBe('');
      expect(parseMarkdownToHtml(undefined)).toBe('');
    });
  });

  describe('extractKeywords', () => {
    it('extracts keywords from text', () => {
      const text =
        'Circular economy is important for sustainable development and environmental protection';
      const result = extractKeywords(text, 3);

      expect(result).toContain('circular');
      expect(result).toContain('economy');
      expect(result).toContain('important');
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('filters out stop words', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const result = extractKeywords(text, 5);

      expect(result).not.toContain('the');
      expect(result).toContain('quick');
      expect(result).toContain('brown');
      expect(result).toContain('jumps');
      // Check that result contains some of the expected keywords
      expect(result.some((word) => ['lazy', 'dog'].includes(word))).toBe(true);
    });

    it('filters short words', () => {
      const text = 'This is a test with some short words like cat dog';
      const result = extractKeywords(text, 10);

      expect(result).not.toContain('cat');
      expect(result).not.toContain('dog');
      expect(result).not.toContain('is');
      expect(result).not.toContain('a');
    });

    it('handles empty input', () => {
      expect(extractKeywords('')).toEqual([]);
      expect(extractKeywords(null)).toEqual([]);
      expect(extractKeywords(undefined)).toEqual([]);
    });

    it('limits to specified count', () => {
      const text = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10';
      const result = extractKeywords(text, 5);

      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('sorts by frequency', () => {
      const text = 'economy economy economy development development sustainable';
      const result = extractKeywords(text, 3);

      expect(result[0]).toBe('economy');
      expect(result[1]).toBe('development');
      expect(result[2]).toBe('sustainable');
    });
  });
});
