import {
  Accordion,
  Checkbox,
  Label,
  Pagination,
  ScrollShadow,
  SearchField,
  Separator,
  Tooltip,
} from '@heroui/react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, ChevronDown, ExternalLink, Keyboard, Minus, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  Chip,
  DetailsBadge,
  DetailsDisplay,
  ExpandableText,
  Spinner,
  TruncatedTextTooltip,
} from '@/components/common';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { searchCeCases } from '@/features/search/searchApi';
import { useDebounce } from '@/hooks/useDebounce';
import { formatProcessingTime } from '@/lib/formatting';
import { getMatchStrength } from '@/utils/content';

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

  return (
    <div className="group relative flex flex-col gap-4 rounded-xl border-[1.5px] border-(--color-border-ui) bg-(--color-bg-card) p-5 shadow-sm transition-all duration-200 hover:border-(--color-accent-hover-border) hover:shadow-md">
      {/* 1) HEADER: title + score badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 font-sans text-[0.9375rem] leading-snug font-medium tracking-[-0.01em] text-(--color-text-primary)">
          <ExpandableText
            limit={80}
            className="font-sans text-[0.9375rem] leading-snug font-medium tracking-[-0.01em] text-(--color-text-primary)"
          >
            {title || company || 'Untitled'}
          </ExpandableText>
        </div>
        {isHybridMode && score != null && (
          <Chip variant="match" color={getMatchStrength(score)} className="shrink-0">
            {Math.round(score * 100)}% match
          </Chip>
        )}
      </div>

      {/* 2) CHIPS: strategy, category, materials */}
      {(circular_strategy || category || materials) && (
        <div className="flex w-full flex-wrap gap-1.5">
          {circular_strategy && (
            <Chip variant="strategy" size="sm">
              {circular_strategy}
            </Chip>
          )}
          {category && (
            <Chip variant="tag" size="sm">
              {category}
            </Chip>
          )}
          {materials && (
            <Chip variant="materials" size="sm">
              {materials}
            </Chip>
          )}
        </div>
      )}

      {/* 3) PROBLEM: show first 300 chars with expand */}
      {problem && (
        <ExpandableText limit={750} className="text-[0.8125rem]/relaxed">
          {problem}
        </ExpandableText>
      )}

      {/* 4) SOLUTION or SUMMARY */}
      {solution && (
        <div>
          <Separator orientation="horizontal" className="mb-3" variant="secondary" />
          <p className="mb-1 text-[0.625rem] font-bold tracking-[0.12em] text-(--color-text-muted) uppercase">
            Solution
          </p>
          <ExpandableText limit={750} className="text-[0.8125rem]/relaxed">
            {solution}
          </ExpandableText>
        </div>
      )}
      {!solution && summary && (
        <div>
          <Separator orientation="horizontal" className="mb-3" variant="secondary" />
          <p className="mb-1 text-[0.625rem] font-bold tracking-[0.12em] text-(--color-text-muted) uppercase">
            Summary
          </p>
          <ExpandableText
            limit={750}
            className="text-[0.8125rem] leading-[1.7] wrap-break-word text-(--color-text-secondary)"
          >
            {summary}
          </ExpandableText>
        </div>
      )}

      {/* 5) IMPACT */}
      {impact && (
        <div>
          <Separator orientation="horizontal" className="mb-3" variant="secondary" />
          <p className="mt-0.5 mb-1 text-[0.625rem] font-bold tracking-[0.12em] text-(--color-text-muted) uppercase">
            Impact
          </p>
          <ExpandableText
            limit={750}
            className="font-mono text-xs font-medium text-(--color-text-secondary)"
          >
            {impact}
          </ExpandableText>
        </div>
      )}

      {/* 6) FOOTER: company + source */}
      {(company || source_url) && (
        <div className="mt-1">
          <Separator orientation="horizontal" className="mb-3" variant="secondary" />
          <div className="flex items-center justify-between gap-2">
            {company ? (
              <div className="flex items-center gap-1 text-xs text-(--color-text-muted)">
                <Building2 size={11} className="shrink-0" />
                <TruncatedTextTooltip
                  limit={60}
                  className="text-xs break-all text-(--color-text-muted)"
                >
                  {company}
                </TruncatedTextTooltip>
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
                <TruncatedTextTooltip
                  limit={35}
                  className="text-xs break-all text-(--color-accent)"
                >
                  {source_display}
                </TruncatedTextTooltip>
                <ExternalLink size={10} className="shrink-0" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultsGrid({ results, isHybridMode }) {
  const [isResultsOverflowing, setIsResultsOverflowing] = useState(false);
  const resultsRef = useRef(null);

  useEffect(() => {
    const element = resultsRef.current;
    if (element) {
      const checkOverflow = () => {
        const isOverflowing = element.scrollHeight > element.clientHeight;
        setIsResultsOverflowing(isOverflowing);
      };

      checkOverflow();
      const resizeObserver = new ResizeObserver(checkOverflow);
      resizeObserver.observe(element);

      return () => resizeObserver.disconnect();
    }
  }, [results]);

  return (
    <ScrollShadow
      id="results-grid-scroll"
      ref={resultsRef}
      className={`h-[95vh] overflow-hidden ${isResultsOverflowing && 'pr-2.5'} pb-2 hover:overflow-y-auto hover:pr-0`}
      size={30}
    >
      <div className="flex flex-col gap-3">
        {results.map((result) => (
          <ResultCard key={result.id} result={result} isHybridMode={isHybridMode} />
        ))}
      </div>
    </ScrollShadow>
  );
}

// Sub-components for cleaner rendering logic
function IdleState() {
  return (
    <div className="flex items-center justify-center py-20">
      <DetailsBadge
        variant="info"
        message="Type to search 6,000+ circular economy cases"
        icon={Keyboard}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-3 py-16">
      <DetailsBadge variant="success" message="Fetching solutions ..." icon={Spinner} />
    </div>
  );
}

function ErrorState({ error }) {
  return (
    <div className="flex items-center justify-center py-16">
      <DetailsBadge
        variant="error"
        message={`Error: ${error?.message || 'Failed to fetch solutions'}`}
      />
    </div>
  );
}

function EmptyState({ query }) {
  return (
    <div className="flex items-center justify-center py-16">
      <DetailsBadge variant="error" message={`No results found for ' ${query} '`} />
    </div>
  );
}

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
      strategies: Array.from(strategySet).slice(0, 15),
      categories: Array.from(categorySet).slice(0, 12),
      sources: Array.from(sourceSet),
    };
  }, [results]);

  const handleStrategyToggleLocal = (strategy) => {
    const currentStrategies = activeStrategies.includes(strategy)
      ? activeStrategies.filter((s) => s !== strategy)
      : [...activeStrategies, strategy];
    setActiveStrategies(currentStrategies);
  };

  const handleCategoryToggleLocal = (category) => {
    const currentCategories = activeCategories.includes(category)
      ? activeCategories.filter((c) => c !== category)
      : [...activeCategories, category];
    setActiveCategories(currentCategories);
  };

  const handleSourceToggleLocal = (source) => {
    const currentSources = activeSources.includes(source)
      ? activeSources.filter((s) => s !== source)
      : [...activeSources, source];
    setActiveSources(currentSources);
  };

  if (results.length === 0) {
    return <p className="text-xs text-(--color-text-muted)">Filters appear after searching</p>;
  }

  return (
    <div className="w-full space-y-5">
      {/* Strategy Filter */}
      {strategies.length >= 2 && (
        <div>
          <p className="mb-2 text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
            Strategy
          </p>
          <div className="flex w-full flex-wrap gap-1.5">
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
                onClick={() => handleStrategyToggleLocal(strategy)}
                limit={22}
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
          <div className="flex w-full flex-wrap gap-1.5">
            <Chip
              variant="filter"
              active={activeCategories.length === 0}
              onClick={() => setActiveCategories([])}
            >
              All
            </Chip>
            {categories.map((category) => (
              <Chip
                key={category}
                variant="filter"
                active={activeCategories.includes(category)}
                onClick={() => handleCategoryToggleLocal(category)}
                limit={22}
              >
                {category}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {/* Source Filter */}
      {sources.length >= 2 && (
        <div>
          <p className="mb-2 text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
            Source
          </p>
          <div className="flex w-full flex-wrap gap-1.5">
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
                onClick={() => handleSourceToggleLocal(source)}
                limit={25}
              >
                {source}
              </Chip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SolutionsSearch() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse multi-value parameters from URL
  const parseMultiParam = (raw) => (raw ? raw.split(',').filter(Boolean) : []);

  // ── State derived from URL (memoized for performance) ──────────────────────────
  const searchState = useMemo(() => {
    const query = searchParams.get('searchQuery') || '';
    const mode = ['keyword', 'hybrid'].includes(searchParams.get('mode'))
      ? searchParams.get('mode')
      : 'hybrid';
    const pageRaw = parseInt(searchParams.get('page') || '1', 10);
    const page = Number.isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;

    return {
      query,
      mode,
      page,
      activeStrategies: parseMultiParam(searchParams.get('strategies')),
      activeCategories: parseMultiParam(searchParams.get('categories')),
      activeSources: parseMultiParam(searchParams.get('sources')),
    };
  }, [searchParams]);

  const { query, mode, page, activeStrategies, activeCategories, activeSources } = searchState;

  // Generic URL updater helper
  const updateParams = useCallback(
    (updates) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([k, v]) => {
        if (v === null || v === '' || v === undefined) {
          next.delete(k);
        } else {
          next.set(k, String(v));
        }
      });
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const debouncedQuery = useDebounce(query, 250);
  const ITEMS_PER_PAGE = 5;
  const queryClient = useQueryClient();

  const shouldSearch = debouncedQuery.trim().length >= 2;
  const isHybridMode = mode === 'hybrid';

  const {
    data: searchResults,
    isLoading,
    isFetching,
    error,
    isStale,
    refetch,
  } = useQuery({
    queryKey: ['ce-cases-search', debouncedQuery, mode],
    queryFn: () => searchCeCases({ q: debouncedQuery, mode }),
    enabled: shouldSearch,
    staleTime: mode === 'keyword' ? 10 * 60 * 1000 : 5 * 60 * 1000, // 10 min for keyword, 5 min for hybrid
    gcTime: 30 * 60 * 1000, // 30 min
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: keepPreviousData,
  });

  const results = searchResults?.results || [];
  const isBackgroundFetching = isFetching && !isLoading;

  // Handle query changes
  const handleQueryChange = useCallback(
    (val) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (val) {
            next.set('searchQuery', val);
          } else {
            // No query → remove all search-related params
            ['searchQuery', 'page', 'mode', 'strategies', 'categories', 'sources'].forEach((p) =>
              next.delete(p),
            );
          }
          // Reset page when query changes
          next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Handle mode changes
  const handleModeChange = useCallback(
    (isSelected) => {
      updateParams({ mode: isSelected ? 'hybrid' : 'keyword', page: null });
    },
    [updateParams],
  );

  const clearAllFilters = useCallback(
    () => updateParams({ strategies: null, categories: null, sources: null, page: null }),
    [updateParams],
  );

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

  const totalPages = Math.ceil(filteredResults.length / ITEMS_PER_PAGE);

  // Validate and clamp page to valid range after results load
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      updateParams({ page: null }); // reset to 1 (omitting page param = page 1)
    }
  }, [totalPages, page, updateParams]);

  // Validate filters against available values (drop invalid URL params)
  useEffect(() => {
    if (!results.length) return;

    const {
      strategies: availStrat,
      categories: availCat,
      sources: availSrc,
    } = (() => {
      const strategySet = new Set();
      const categorySet = new Set();
      const sourceSet = new Set();

      results.forEach((result) => {
        if (result.circular_strategy) {
          const resultStrategies = result.circular_strategy
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          resultStrategies.forEach((s) => strategySet.add(s));
        }
        if (result.category) {
          categorySet.add(result.category);
        }
        if (result.source_display) {
          sourceSet.add(result.source_display);
        }
      });

      return {
        strategies: Array.from(strategySet),
        categories: Array.from(categorySet),
        sources: Array.from(sourceSet),
      };
    })();

    const validStrat = activeStrategies.filter((s) => availStrat.includes(s));
    const validCat = activeCategories.filter((c) => availCat.includes(c));
    const validSrc = activeSources.filter((s) => availSrc.includes(s));

    const changed =
      validStrat.length !== activeStrategies.length ||
      validCat.length !== activeCategories.length ||
      validSrc.length !== activeSources.length;

    if (changed) {
      updateParams({
        strategies: validStrat.length ? validStrat.join(',') : null,
        categories: validCat.length ? validCat.join(',') : null,
        sources: validSrc.length ? validSrc.join(',') : null,
        page: null,
      });
    }
  }, [results]); // only when results change (new search)

  // Cleanup: when no searchQuery, ignore all other search params
  useEffect(() => {
    const tab = searchParams.get('activeTab');
    if (tab !== 'search') return;
    const hasQuery = !!searchParams.get('searchQuery');
    if (!hasQuery) {
      const hasExtra = ['page', 'mode', 'strategies', 'categories', 'sources'].some((p) =>
        searchParams.has(p),
      );
      if (hasExtra) {
        const next = new URLSearchParams(searchParams);
        ['page', 'mode', 'strategies', 'categories', 'sources'].forEach((p) => next.delete(p));
        setSearchParams(next, { replace: true });
      }
    }
  }, []); // intentional: once on mount only

  // Pagination
  const paginatedResults = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredResults.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredResults, page, ITEMS_PER_PAGE]);

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

  const handlePrefetchHybrid = useCallback(() => {
    if (mode === 'keyword' && shouldSearch) {
      queryClient.prefetchQuery({
        queryKey: ['ce-cases-search', debouncedQuery, 'hybrid'],
        queryFn: () => searchCeCases({ q: debouncedQuery, mode: 'hybrid' }),
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [mode, shouldSearch, queryClient, debouncedQuery]);

  // Check if we should show the two-panel layout
  const hasResults = !isLoading && !error && results.length > 0 && shouldSearch;

  // Render full-width states (idle, loading, error, empty)
  function renderFullWidthState() {
    if (!shouldSearch) return <IdleState />;
    if (isLoading) return <LoadingState />;
    if (error) return <ErrorState error={error} />;
    if (results.length === 0) return <EmptyState query={debouncedQuery} />;
    return null;
  }

  // Render right panel content (pagination + results)
  function renderRightPanel() {
    return (
      <div className="space-y-2">
        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination className="">
            <Pagination.Content className="">
              <Pagination.Item>
                <Pagination.Previous
                  isDisabled={page === 1}
                  onPress={() => updateParams({ page: page > 2 ? page - 1 : null })}
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
                    <Pagination.Link
                      isActive={p === page}
                      onPress={() => updateParams({ page: p > 1 ? p : null })}
                    >
                      {p}
                    </Pagination.Link>
                  </Pagination.Item>
                ),
              )}
              <Pagination.Item>
                <Pagination.Next
                  isDisabled={page === totalPages}
                  onPress={() => updateParams({ page: page < totalPages ? page + 1 : null })}
                >
                  <span>Next</span>
                  <Pagination.NextIcon />
                </Pagination.Next>
              </Pagination.Item>
            </Pagination.Content>
          </Pagination>
        )}

        {/* Cards */}
        {filteredResults.length === 0 && results.length > 0 ? (
          <DetailsDisplay
            variant="neutral"
            title="No solutions match the selected filters"
            showMessage={false}
            actions={[
              {
                variant: 'ghost',
                label: 'Clear all filters',
                onPress: clearAllFilters,
              },
            ]}
            showDefaultActions={false}
          />
        ) : (
          <ResultsGrid results={paginatedResults} isHybridMode={isHybridMode} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search input and mode toggle */}
      <div className="space-y-1">
        <div className="flex items-center justify-start gap-2 pl-2">
          {/* Mode toggle */}
          <Checkbox
            id="keyword-hybrid-search-toggle"
            isSelected={isHybridMode}
            onChange={handleModeChange}
            onMouseEnter={handlePrefetchHybrid}
            className="flex items-center justify-between gap-3 pl-2"
          >
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Content>
              <Label
                htmlFor="keyword-hybrid-search-toggle"
                className="-ml-0.5 flex items-center justify-center text-sm/relaxed text-(--color-text-secondary)"
              >
                <span>Semantic search</span>
                <span className="ml-2.5 flex items-center gap-1 text-xs text-(--color-text-muted)">
                  [ {isHybridMode ? 'AI-powered semantic search' : 'fast keyword match'} ]
                </span>
              </Label>
            </Checkbox.Content>
          </Checkbox>

          {/* Result count */}
          {hasResults && (
            <div className="mt-px flex items-center gap-2 font-mono text-xs font-medium text-(--color-text-muted)">
              {hasResults && <Minus size={16} strokeWidth={2.5} />}

              <div>
                {filteredResults && results && filteredResults.length < results.length
                  ? `${filteredResults.length} of ${results.length} results (filtered)`
                  : `${results.length} results`}
                {searchResults?.processing_info?.processing_time_ms
                  ? ` in ${formatProcessingTime(searchResults.processing_info.processing_time_ms)}`
                  : ''}
              </div>

              {isBackgroundFetching && <Spinner color="var(--color-checkbox)" />}

              {isStale && !isFetching && (
                <Tooltip delay={0} className="inline-flex">
                  <Tooltip.Trigger>
                    <RefreshCw
                      size={16}
                      strokeWidth={2.5}
                      aria-label="Refresh results"
                      onClick={() => refetch()}
                      className="cursor-pointer"
                      color="var(--color-checkbox)"
                    />
                  </Tooltip.Trigger>
                  <Tooltip.Content>Results may be outdated — click to refresh</Tooltip.Content>
                </Tooltip>
              )}
            </div>
          )}
        </div>

        {/* SearchField */}
        <SearchField name="ce-search" value={query} onChange={handleQueryChange} className="w-full">
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input
              placeholder="Search circular economy solutions..."
              className="w-full"
            />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </div>

      {/* Conditional layout */}
      {hasResults ? (
        /* RESIZABLE TWO-PANEL */
        <ResizablePanelGroup
          orientation="horizontal"
          style={{ 'min-height': 'calc(100vh - 220px)' }}
          className="w-full"
        >
          <ResizablePanel id="filters-panel" defaultSize="30%" minSize="20%" className="h-full">
            <div className="h-full overflow-y-auto pr-3">
              <FilterSidebar
                results={results}
                activeStrategies={activeStrategies}
                setActiveStrategies={(arr) =>
                  updateParams({ strategies: arr.length ? arr.join(',') : null, page: null })
                }
                activeCategories={activeCategories}
                setActiveCategories={(arr) =>
                  updateParams({ categories: arr.length ? arr.join(',') : null, page: null })
                }
                activeSources={activeSources}
                setActiveSources={(arr) =>
                  updateParams({ sources: arr.length ? arr.join(',') : null, page: null })
                }
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel id="results-panel" defaultSize="70%" minSize="45%" className="h-full">
            <div className="h-full overflow-y-auto pl-4">{renderRightPanel()}</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        /* FULL WIDTH CENTERED STATES */
        <div className="flex min-h-75 items-center justify-center">{renderFullWidthState()}</div>
      )}
    </div>
  );
}
