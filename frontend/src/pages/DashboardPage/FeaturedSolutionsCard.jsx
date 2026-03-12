import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@/components/common';
import { Card, Chip, Input } from '@heroui/react';
import { useFeaturedSolutions } from '../../features/assessments/hooks/useFeaturedSolutions';
import { useGlobalDrawer } from '@/contexts/DrawerContext';

export default function FeaturedSolutionsCard({ industry }) {
  const [featuredQuery, setFeaturedQuery] = useState('');
  const [featuredSearch, setFeaturedSearch] = useState(undefined);

  const { solutions: featuredSolutions = [], isLoading: solutionsLoading } = useFeaturedSolutions({
    limit: 3,
    industry,
    q: featuredSearch,
    enabled: true,
  });

  // Additional fetch for stats and top keywords
  const { solutions: statsSolutions = [], count: extendedCount = 0 } = useFeaturedSolutions({
    limit: 10,
    industry,
    enabled: true,
  });

  const { openDashboardFeaturedSolutionsDrawer } = useGlobalDrawer();

  const topKeywords = React.useMemo(() => {
    const stopWords = new Set([
      'the',
      'and',
      'for',
      'with',
      'from',
      'to',
      'of',
      'in',
      'a',
      'an',
      'is',
      'are',
      'by',
      'on',
      'per',
    ]);
    const freq = {};
    statsSolutions.forEach((s) => {
      const text = `${s.title || ''} ${s.solution || ''} ${s.problem || ''}`;
      text.split(/\W+/).forEach((word) => {
        const w = word.toLowerCase();
        if (!w || w.length < 3 || stopWords.has(w) || /^\d+$/.test(w)) return;
        freq[w] = (freq[w] || 0) + 1;
      });
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k]) => k);
  }, [statsSolutions]);

  return (
    <Card className="border-0 shadow-sm p-4 md:p-6">
      <Card.Header className="flex-col gap-2 mb-4">
        <Card.Title className="flex items-center gap-2 text-lg">Featured Solutions</Card.Title>
        <Card.Description className="text-sm text-slate-500 italic">
          Examples surfaced from the documents dataset to inspire solutions
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="mt-3 flex flex-col md:flex-row gap-2 items-stretch md:items-center w-full">
          <Input
            placeholder="Search featured solutions (e.g., packaging)"
            value={featuredQuery}
            onChange={(e) => setFeaturedQuery(e.target.value)}
            className="rounded-full border px-3 py-2 text-sm min-w-0 flex-1"
            variant="secondary"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => setFeaturedSearch(featuredQuery || undefined)}
            >
              Search
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setFeaturedQuery('');
                setFeaturedSearch(undefined);
              }}
            >
              Clear
            </Button>
          </div>
        </div>

        {solutionsLoading ? (
          <div className="py-8 flex items-center justify-center">Loading...</div>
        ) : featuredSolutions.length > 0 ? (
          <div className="grid gap-3 mt-3">
            {featuredSolutions.map((s) => (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row gap-3 items-start p-3 md:p-4 border rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="shrink-0 w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                  {s.title?.charAt(0) || 'S'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-1">
                    <h4 className="text-sm font-semibold break-words">{s.title}</h4>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {s.wordCount || 0} words
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                    {s.solution || s.problem || ''}
                  </p>
                  <div className="mt-2 text-xs text-slate-400">{s.category}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 mt-3">
            No featured solutions available
          </div>
        )}

        <div className="mt-3 flex flex-col sm:flex-row items-end justify-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setFeaturedQuery('');
              setFeaturedSearch(undefined);
            }}
          >
            Reset
          </Button>
          <Button
            size="sm"
            className="ml-0 sm:ml-2"
            onClick={() => openDashboardFeaturedSolutionsDrawer({ industry, q: featuredSearch })}
          >
            Explore more
          </Button>
        </div>

        <div className="mt-4 border-t pt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-500">Documents indexed: {extendedCount}</div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-500">Top keywords:</span>
            {topKeywords && topKeywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {topKeywords.map((k) => (
                  <Chip key={k} size="sm" className="text-xs bg-slate-100 text-slate-700">
                    {k}
                  </Chip>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-400">—</span>
            )}
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}

FeaturedSolutionsCard.propTypes = {
  industry: PropTypes.string,
};
