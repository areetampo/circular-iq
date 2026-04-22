import { Checkbox, Label, SearchField, Skeleton } from '@heroui/react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Building2, ExternalLink } from 'lucide-react';
import { useState } from 'react';

import { Chip, DetailsBadge, Spinner } from '@/components/common';
import { searchCeCases } from '@/features/search/searchApi';
import { useDebounce } from '@/hooks/useDebounce';
import { formatProcessingTime } from '@/lib/formatting';

function ProblemText({ text }) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 280;
  const isLong = text.length > LIMIT;
  return (
    <div>
      <p className="text-sm/relaxed text-(--color-text-secondary)">
        {expanded || !isLong ? text : text.slice(0, LIMIT) + '…'}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs text-(--color-accent) transition-colors hover:text-(--color-accent-hover)"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

function SolutionText({ text }) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 220;
  const isLong = text.length > LIMIT;
  return (
    <div>
      <p className="text-sm/relaxed text-(--color-text-secondary)">
        {expanded || !isLong ? text : text.slice(0, LIMIT) + '…'}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs text-(--color-accent) transition-colors hover:text-(--color-accent-hover)"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

function ResultCard({ result, isHybridMode }) {
  const {
    title,
    problem,
    solution,
    summary,
    materials,
    circular_strategy,
    category,
    impact,
    source_url,
    source_display,
    score,
    company,
  } = result;

  // Derive display title
  const displayTitle =
    title ||
    company ||
    (problem ? problem.slice(0, 90) + (problem.length > 90 ? '…' : '') : 'Untitled');

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-(--color-border-card) bg-(--color-bg-card) p-5 transition-colors duration-200 hover:bg-(--color-bg-card-hover)">
      {/* ① HEADER: title + score badge */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="flex-1 text-sm/snug font-semibold text-(--color-text-primary)">
          {displayTitle}
        </h3>
        {isHybridMode && score != null && (
          <Chip
            variant="score-pill"
            size="sm"
            color={score >= 0.7 ? 'success' : score >= 0.4 ? 'warning' : 'error'}
            className="shrink-0"
          >
            {Math.round(score * 100)}%
          </Chip>
        )}
      </div>

      {/* ② CHIPS: strategy, category, materials */}
      {(circular_strategy || category || materials) && (
        <div className="flex flex-wrap gap-1.5">
          {circular_strategy && (
            <Chip variant="strategy" size="sm">
              {circular_strategy}
            </Chip>
          )}
          {category && (
            <Chip variant="tag" size="sm">
              {category.length > 45 ? category.slice(0, 45) + '…' : category}
            </Chip>
          )}
          {materials && (
            <Chip variant="materials" size="sm">
              {materials.length > 45 ? materials.slice(0, 45) + '…' : materials}
            </Chip>
          )}
        </div>
      )}

      {/* ③ PROBLEM: show first 300 chars with expand */}
      {problem && <ProblemText text={problem} />}

      {/* ④ SOLUTION or SUMMARY */}
      {solution && (
        <div className="border-t border-(--color-border-faint) pt-3">
          <p className="mb-1.5 text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
            Solution
          </p>
          <SolutionText text={solution} />
        </div>
      )}
      {!solution && summary && (
        <div className="border-t border-(--color-border-faint) pt-3">
          <p className="mb-1.5 text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
            Summary
          </p>
          <p className="text-sm/relaxed text-(--color-text-secondary)">{summary}</p>
        </div>
      )}

      {/* ⑤ IMPACT */}
      {impact && (
        <div className="border-t border-(--color-border-faint) pt-3">
          <p className="mb-1 text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
            Impact
          </p>
          <p className="text-xs/relaxed text-(--color-text-secondary)">{impact}</p>
        </div>
      )}

      {/* ⑥ FOOTER: company + source */}
      {(company || source_url) && (
        <div className="mt-auto flex items-center justify-between border-t border-(--color-border-faint) pt-2">
          {company ? (
            <div className="flex items-center gap-1 text-xs text-(--color-text-muted)">
              <Building2 size={11} className="shrink-0" />
              <span className="max-w-32 truncate">{company}</span>
            </div>
          ) : (
            <span />
          )}
          {source_url && source_display && (
            <a
              href={source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-(--color-accent) transition-colors hover:text-(--color-accent-hover)"
            >
              <span className="max-w-28 truncate">{source_display}</span>
              <ExternalLink size={10} className="shrink-0" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// Sub-components for cleaner rendering logic
function IdleState() {
  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-sm tracking-wide text-(--color-text-muted)">
        Type to search 6,000+ circular economy cases
      </p>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-(--color-border-card) bg-(--color-bg-card) p-5"
        >
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4 rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-5/6 rounded-lg" />
            <Skeleton className="h-4 w-4/6 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ error }) {
  return (
    <div className="flex items-center justify-center py-16">
      <DetailsBadge variant="error" message={`Error: ${error?.message}`} />
    </div>
  );
}

function EmptyState({ query }) {
  return (
    <div className="flex items-center justify-center py-16">
      <DetailsBadge variant="error" message={`No results found for '${query}'`} />
    </div>
  );
}

function ResultsGrid({ results, isHybridMode }) {
  return (
    <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
      {results.map((result) => (
        <ResultCard key={result.id} result={result} isHybridMode={isHybridMode} />
      ))}
    </div>
  );
}

export function SolutionsSearch() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('keyword'); // 'keyword' | 'hybrid'
  const debouncedQuery = useDebounce(query, 400);

  const shouldSearch = debouncedQuery.trim().length >= 2;
  const isHybridMode = mode === 'hybrid';

  const {
    data: searchResults,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ['ce-cases-search', debouncedQuery, mode],
    queryFn: () => searchCeCases({ q: debouncedQuery, mode }),
    enabled: shouldSearch,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: keepPreviousData,
  });

  const results = searchResults?.results || [];
  const isBackgroundFetching = isFetching && !isLoading;

  const handleModeChange = (isSelected) => {
    setMode(isSelected ? 'hybrid' : 'keyword');
  };

  // Render content based on state
  function renderContent() {
    if (!shouldSearch) return <IdleState />;
    if (isLoading) return <SkeletonGrid />;
    if (error) return <ErrorState error={error} />;
    if (results.length === 0) return <EmptyState query={debouncedQuery} />;
    return <ResultsGrid results={results} isHybridMode={isHybridMode} />;
  }

  return (
    <div className="space-y-4">
      {/* Search input and mode toggle */}
      <div className="space-y-3">
        {/* SearchField first - primary */}
        <SearchField name="ce-search" value={query} onChange={setQuery} className="w-full">
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input
              placeholder="Search circular economy solutions..."
              className="w-full"
            />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        {/* Mode toggle row - secondary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Checkbox
              id="keyword-hybrid-search-toggle"
              isSelected={isHybridMode}
              onChange={handleModeChange}
              className="pl-2"
            >
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Content>
                <Label
                  htmlFor="keyword-hybrid-search-toggle"
                  className="-ml-0.5 flex items-center justify-center gap-2.5"
                >
                  <p className="line-clamp-4 text-sm/relaxed text-(--color-text-secondary)">
                    Semantic search
                  </p>
                  <span className="flex items-center gap-1 text-xs text-(--color-text-muted)">
                    [
                    {isHybridMode ? (
                      <span>AI-powered semantic search</span>
                    ) : (
                      <span>fast keyword match</span>
                    )}
                    ]
                  </span>
                </Label>
              </Checkbox.Content>
            </Checkbox>

            {/* Background fetching spinner */}
            {isBackgroundFetching && shouldSearch && <Spinner size="sm" />}
          </div>

          {/* Results count */}
          {searchResults?.count !== undefined && (
            <div className="py-1 pl-1 text-xs text-(--color-text-muted)">
              Showing {results.length} results · {isHybridMode ? 'semantic' : 'keyword'} ·{' '}
              {searchResults.processing_info?.processing_time_ms
                ? formatProcessingTime(searchResults.processing_info.processing_time_ms)
                : ''}
            </div>
          )}
        </div>
      </div>

      {/* Content rendering based on state */}
      {renderContent()}
    </div>
  );
}
