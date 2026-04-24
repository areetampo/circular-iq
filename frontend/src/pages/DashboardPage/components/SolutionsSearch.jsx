import { Checkbox, Input, Label, Pagination, SearchField, Skeleton } from '@heroui/react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Building2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Chip, DetailsBadge, Spinner } from '@/components/common';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/tailgrids/core/resizable';
import { searchCeCases } from '@/features/search/searchApi';
import { useDebounce } from '@/hooks/useDebounce';

function ProblemText({ text }) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 280;
  const isLong = text.length > LIMIT;
  return (
    <div>
      <p className="text-[0.8125rem]/relaxed text-(--color-text-secondary)">
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
      <p className="text-[0.8125rem]/relaxed text-(--color-text-secondary)">
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

function ImpactText({ text }) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 120;
  const isLong = text.length > LIMIT;
  return (
    <div className="overflow-hidden">
      <p className="overflow-hidden text-xs/relaxed wrap-break-word text-(--color-text-secondary)">
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
    <div className="flex flex-col gap-3 rounded-xl border border-(--color-border-subtle) bg-(--color-bg-card) p-4 shadow-sm transition-colors duration-200 hover:bg-(--color-bg-card-hover)">
      {/* ① HEADER: title + score badge */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="flex-1 text-sm/snug leading-snug font-semibold text-(--color-text-primary)">
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
              {category.length > 40 ? category.slice(0, 40) + '…' : category}
            </Chip>
          )}
          {materials && (
            <Chip variant="materials" size="sm">
              {materials.length > 40 ? materials.slice(0, 40) + '…' : materials}
            </Chip>
          )}
        </div>
      )}

      {/* ③ PROBLEM: show first 300 chars with expand */}
      {problem && <ProblemText text={problem} />}

      {/* ④ SOLUTION or SUMMARY */}
      {solution && (
        <div className="border-t border-(--color-border-faint) pt-3">
          <p className="mt-0.5 mb-1.5 text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
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
          <p className="text-[0.8125rem]/relaxed text-(--color-text-secondary)">{summary}</p>
        </div>
      )}

      {/* ⑤ IMPACT */}
      {impact && (
        <div className="border-t border-(--color-border-faint) pt-3">
          <p className="mt-0.5 mb-1 text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
            Impact
          </p>
          <ImpactText text={impact} />
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

function SkeletonList() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, index) => (
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
    <div className="flex flex-col gap-3">
      {results.map((result) => (
        <ResultCard key={result.id} result={result} isHybridMode={isHybridMode} />
      ))}
    </div>
  );
}

// Inline helper for formatting time
const formatMs = (ms) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`);

function FilterSidebar({
  results,
  activeStrategies,
  setActiveStrategies,
  activeCategories,
  setActiveCategories,
  activeSources,
  setActiveSources,
}) {
  // Extract unique filter values from results
  const { strategies, categories, sources } = useMemo(() => {
    if (!results.length) {
      return { strategies: [], categories: [], sources: [] };
    }

    const strategySet = new Set();
    const categorySet = new Set();
    const sourceSet = new Set();

    results.forEach((result) => {
      // Extract strategies (split comma-separated)
      if (result.circular_strategy) {
        const resultStrategies = result.circular_strategy
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        resultStrategies.forEach((s) => strategySet.add(s));
      }

      // Extract categories
      if (result.category) {
        categorySet.add(result.category);
      }

      // Extract sources
      if (result.source_display) {
        sourceSet.add(result.source_display);
      }
    });

    return {
      strategies: Array.from(strategySet),
      categories: Array.from(categorySet),
      sources: Array.from(sourceSet),
    };
  }, [results]);

  const handleStrategyToggle = (strategy) => {
    setActiveStrategies((prev) => {
      const next = new Set(prev);
      if (next.has(strategy)) {
        next.delete(strategy);
      } else {
        next.add(strategy);
      }
      const result = Array.from(next);
      return result.length === 0 ? [] : result;
    });
  };

  const handleCategoryToggle = (category) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      const result = Array.from(next);
      return result.length === 0 ? [] : result;
    });
  };

  const handleSourceToggle = (source) => {
    setActiveSources((prev) => {
      const next = new Set(prev);
      if (next.has(source)) {
        next.delete(source);
      } else {
        next.add(source);
      }
      const result = Array.from(next);
      return result.length === 0 ? [] : result;
    });
  };

  if (results.length === 0) {
    return <p className="text-xs text-(--color-text-muted)">Filters appear after searching</p>;
  }

  return (
    <div className="space-y-5 pr-4">
      {/* Strategy Filter */}
      {strategies.length >= 2 && (
        <div>
          <p className="mb-2 text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
            Strategy
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Chip
              variant="filter"
              active={activeStrategies.length === 0}
              onClick={() => setActiveStrategies([])}
            >
              All
            </Chip>
            {strategies.map((strategy) => (
              <Chip
                key={strategy}
                variant="filter"
                active={activeStrategies.includes(strategy)}
                onClick={() => handleStrategyToggle(strategy)}
              >
                {strategy}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter */}
      {categories.length >= 2 && (
        <div>
          <p className="mb-2 text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
            Category
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Chip
              variant="filter"
              active={activeCategories.length === 0}
              onClick={() => setActiveCategories([])}
            >
              All
            </Chip>
            {categories.map((category) => {
              const displayLabel = category.length > 35 ? category.slice(0, 35) + '…' : category;
              return (
                <Chip
                  key={category}
                  variant="filter"
                  active={activeCategories.includes(category)}
                  onClick={() => handleCategoryToggle(category)}
                >
                  {displayLabel}
                </Chip>
              );
            })}
          </div>
        </div>
      )}

      {/* Source Filter */}
      {sources.length >= 2 && (
        <div>
          <p className="mb-2 text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
            Source
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Chip
              variant="filter"
              active={activeSources.length === 0}
              onClick={() => setActiveSources([])}
            >
              All
            </Chip>
            {sources.map((source) => (
              <Chip
                key={source}
                variant="filter"
                active={activeSources.includes(source)}
                onClick={() => handleSourceToggle(source)}
              >
                {source.length > 28 ? source.slice(0, 28) + '…' : source}
              </Chip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterEmptyState({ onClear }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <p className="mb-4 text-sm text-(--color-text-muted)">
        No results match the selected filters
      </p>
      <button
        onClick={onClear}
        className="text-sm text-(--color-accent) transition-colors hover:text-(--color-accent-hover)"
      >
        Clear filters
      </button>
    </div>
  );
}

export function SolutionsSearch() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('hybrid'); // 'keyword' | 'hybrid'
  const [page, setPage] = useState(1);
  const [activeStrategies, setActiveStrategies] = useState([]);
  const [activeCategories, setActiveCategories] = useState([]);
  const [activeSources, setActiveSources] = useState([]);
  const [pageJumpValue, setPageJumpValue] = useState(null);
  const [isJumpInputFocused, setIsJumpInputFocused] = useState(false);

  const debouncedQuery = useDebounce(query, 400);
  const ITEMS_PER_PAGE = 10;

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

  // Reset filters when query changes
  useEffect(() => {
    setActiveStrategies([]);
    setActiveCategories([]);
    setActiveSources([]);
    setPage(1);
  }, [debouncedQuery]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeStrategies, activeCategories, activeSources]);

  // Apply filters client-side
  const filteredResults = useMemo(() => {
    if (!results.length) return results;
    return results.filter((r) => {
      // Strategy filter — match if any of the result's strategies are in activeStrategies
      if (activeStrategies.length > 0) {
        const resultStrategies = (r.circular_strategy || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        if (!resultStrategies.some((s) => activeStrategies.includes(s))) return false;
      }
      // Category filter
      if (activeCategories.length > 0 && !activeCategories.includes(r.category)) return false;
      // Source filter
      if (activeSources.length > 0 && !activeSources.includes(r.source_display)) return false;
      return true;
    });
  }, [results, activeStrategies, activeCategories, activeSources]);

  // Pagination
  const paginatedResults = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredResults.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredResults, page, ITEMS_PER_PAGE]);

  const totalPages = Math.ceil(filteredResults.length / ITEMS_PER_PAGE);

  // Helper function to generate page numbers with ellipses
  const getPageNumbers = useCallback(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];

    // Always show first page
    pages.push(1);

    // Show ellipsis if current page is far from start
    if (page > 3) {
      pages.push('ellipsis');
    }

    // Show pages around current page
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Show ellipsis if current page is far from end
    if (page < totalPages - 2) {
      pages.push('ellipsis');
    }

    // Always show last page
    pages.push(totalPages);

    return pages;
  }, [page, totalPages]);

  const clearAllFilters = () => {
    setActiveStrategies([]);
    setActiveCategories([]);
    setActiveSources([]);
  };

  const handlePageJump = useCallback(() => {
    const pageNumber = Number(pageJumpValue);
    if (pageNumber && pageNumber >= 1 && pageNumber <= totalPages && !Number.isNaN(pageNumber)) {
      setPage(pageNumber);
      setPageJumpValue(null);
      setIsJumpInputFocused(false);
    } else {
      // Don't show toast for invalid range, just silently handle it
      if (pageNumber && pageNumber > totalPages) {
        // If user entered a page beyond total, jump to last page
        setPage(totalPages);
        setPageJumpValue(null);
        setIsJumpInputFocused(false);
      }
    }
  }, [pageJumpValue, totalPages]);

  const handleModeChange = (isSelected) => {
    setMode(isSelected ? 'hybrid' : 'keyword');
  };

  // Check if we should show the two-panel layout
  const hasResults = !isLoading && !error && results.length > 0 && shouldSearch;

  // Render full-width states (idle, loading, error, empty)
  function renderFullWidthState() {
    if (!shouldSearch) return <IdleState />;
    if (isLoading) return <SkeletonList />;
    if (error) return <ErrorState error={error} />;
    if (results.length === 0) return <EmptyState query={debouncedQuery} />;
    return null;
  }

  // Render right panel content (pagination + results)
  function renderRightPanel() {
    return (
      <div className="space-y-4">
        {/* Result count */}
        <div className="text-xs text-(--color-text-muted)">
          {filteredResults.length < results.length
            ? `${filteredResults.length} of ${results.length} results (filtered) · `
            : `${results.length} results · `}
          {isHybridMode ? 'semantic' : 'keyword'}
          {searchResults?.processing_info?.processing_time_ms
            ? ` · ${formatMs(searchResults.processing_info.processing_time_ms)}`
            : ''}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-3">
            <Pagination className="justify-center">
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={page === 1}
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <Pagination.PreviousIcon />
                    <span>Previous</span>
                  </Pagination.Previous>
                </Pagination.Item>
                {getPageNumbers().map((p, i) =>
                  p === 'ellipsis' ? (
                    <Pagination.Item key={`ellipsis-${i}`}>
                      <Pagination.Ellipsis />
                    </Pagination.Item>
                  ) : (
                    <Pagination.Item key={p}>
                      <Pagination.Link isActive={p === page} onPress={() => setPage(p)}>
                        {p}
                      </Pagination.Link>
                    </Pagination.Item>
                  ),
                )}
                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={page === totalPages}
                    onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <span>Next</span>
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>

            {totalPages > 7 && (
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="dashboard-solutions-search-page-pagination-jump-to"
                  className="text-sm font-normal whitespace-nowrap text-(--color-text-muted)"
                >
                  Jump to:
                </Label>
                <div className="relative flex items-center">
                  <Input
                    id="dashboard-solutions-search-page-pagination-jump-to"
                    className="number-input-field w-16"
                    type="number"
                    min="1"
                    max={totalPages}
                    value={isJumpInputFocused ? pageJumpValue : pageJumpValue || page}
                    onChange={(e) => setPageJumpValue(e.target.value)}
                    onFocus={() => setIsJumpInputFocused(true)}
                    onBlur={() => {
                      setIsJumpInputFocused(false);
                      if (pageJumpValue === '') setPageJumpValue(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handlePageJump();
                    }}
                  />
                  <div className="number-input-steppers">
                    <button
                      tabIndex={-1}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setPageJumpValue((v) => Math.min(Number(v || page) + 1, totalPages));
                      }}
                    >
                      <ChevronUp size={16} strokeWidth={2} />
                    </button>
                    <button
                      tabIndex={-1}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setPageJumpValue((v) => Math.max(Number(v || page) - 1, 1));
                      }}
                    >
                      <ChevronDown size={16} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cards */}
        {filteredResults.length === 0 && results.length > 0 ? (
          <FilterEmptyState onClear={clearAllFilters} />
        ) : (
          <ResultsGrid results={paginatedResults} isHybridMode={isHybridMode} />
        )}
      </div>
    );
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
                <p className="-ml-0.5 line-clamp-4 text-sm/relaxed text-(--color-text-secondary)">
                  Semantic search
                  <span className="ml-2.5 flex items-center gap-1 text-xs text-(--color-text-muted)">
                    [
                    {isHybridMode ? (
                      <span>AI-powered semantic search</span>
                    ) : (
                      <span>fast keyword match</span>
                    )}
                    ]
                  </span>
                </p>
              </Checkbox.Content>
            </Checkbox>

            {/* Background fetching spinner */}
            {isBackgroundFetching && shouldSearch && <Spinner size="sm" />}
          </div>
        </div>
      </div>

      {/* Conditional layout */}
      {hasResults ? (
        /* RESIZABLE TWO-PANEL */
        <ResizablePanelGroup direction="horizontal" className="min-h-150">
          <ResizablePanel defaultSize={33} minSize={25} maxSize={75}>
            <div
              className="sticky top-4 overflow-y-auto pr-4"
              style={{ position: 'sticky', top: '1rem', maxHeight: 'calc(100vh - 140px)' }}
            >
              <FilterSidebar
                results={results}
                activeStrategies={activeStrategies}
                setActiveStrategies={setActiveStrategies}
                activeCategories={activeCategories}
                setActiveCategories={setActiveCategories}
                activeSources={activeSources}
                setActiveSources={setActiveSources}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={67} minSize={25} maxSize={75}>
            <div className="pl-4">{renderRightPanel()}</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        /* FULL WIDTH CENTERED STATES */
        <div className="flex min-h-75 items-center justify-center">{renderFullWidthState()}</div>
      )}
    </div>
  );
}
