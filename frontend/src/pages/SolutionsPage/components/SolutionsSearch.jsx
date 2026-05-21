/**
 * @module SolutionsSearch
 * @description Search input and query handling for the Solutions catalog.
 */

import { Label, Pagination, ScrollShadow, SearchField, Switch, Tooltip } from '@heroui/react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Eraser, ExternalLink, Keyboard, Minus, RefreshCw } from 'lucide-react';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  Chip,
  DetailsBadge,
  DetailsDisplay,
  ExpandableText,
  Separator,
  Spinner,
  TruncatedTextTooltip,
} from '@/components/common';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { searchCeCases } from '@/features/search/searchApi';
import { useDebounce } from '@/hooks';
import { formatDuration } from '@/lib/formatting';
import { getMatchStrength } from '@/utils/content';

import FilterSidebar from './FilterSidebar';

/**
 * ResultCard - A card component displaying solution search results
 * Shows detailed information about circular economy solutions with expandable text
 *
 * @param {Object} props - Component props
 * @param {Object} props.result - Solution result object with all solution details
 * @param {boolean} props.isHybridMode - Whether to display in hybrid mode
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element} Rendered ResultCard
 *
 * @example
 * Basic usage
 * <ResultCard result={solutionData} isHybridMode={false} />
 *
 * @example
 * Hybrid mode
 * <ResultCard result={solutionData} isHybridMode={true} />
 */
function ResultCard({ result, isHybridMode, ...props }) {
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
    <div
      {...props}
      className="group relative flex flex-col gap-4 rounded-xl border-[1.5px] border-(--color-border-ui) bg-(--color-bg-card) p-5 shadow-sm transition-all duration-200 hover:border-(--color-accent-hover-border)"
    >
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
          <Separator wrapperCn="mb-3" />
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
          <Separator wrapperCn="mb-3" />
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
          <Separator wrapperCn="mb-3" />
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
          <Separator wrapperCn="mb-3" />
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

ResultCard.propTypes = {
  /** Solution result object with all solution details */
  result: PropTypes.object.isRequired,
  /** Whether to display in hybrid mode */
  isHybridMode: PropTypes.bool.isRequired,
};

/**
 * Scrollable grid of `ResultCard` components with overflow fade indicator.
 * @param {Object} props
 * @param {Array<Object>} props.results - CE case search hits.
 * @param {boolean} props.isHybridMode - Whether hybrid search mode is active.
 * @returns {import('react').ReactElement}
 */
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

ResultsGrid.propTypes = {
  /** Array of search results to display */
  results: PropTypes.array.isRequired,
  /** Whether to display in hybrid mode */
  isHybridMode: PropTypes.bool.isRequired,
};

// Sub-components for cleaner rendering logic
/**
 * IdleState - Component displayed when no search query is active
 * Shows a prompt to start searching
 *
 * @param {Object} props - Component props
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element} Rendered IdleState
 *
 * @example
 * <IdleState />
 */
function IdleState({ ...props }) {
  return <DetailsBadge {...props} variant="info" message="Type to search" icon={Keyboard} />;
}

/**
 * LoadingState - Component displayed during data fetching
 * Shows a loading message with spinner
 *
 * @param {Object} props - Component props
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element} Rendered LoadingState
 *
 * @example
 * <LoadingState />
 */
function LoadingState({ ...props }) {
  return <DetailsBadge {...props} variant="success" message="Fetching solutions ..." spinner />;
}

/**
 * ErrorState - Component displayed when an error occurs
 * Shows an error message with details
 *
 * @param {Object} props - Component props
 * @param {Error} props.error - Error object containing error details
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element} Rendered ErrorState
 *
 * @example
 * <ErrorState error={new Error('Failed to fetch')} />
 */
function ErrorState({ error, ...props }) {
  return (
    <DetailsBadge
      {...props}
      variant="error"
      message={`Error: ${error?.message || 'Failed to fetch solutions'}`}
    />
  );
}

ErrorState.propTypes = {
  /** Error object containing error details */
  error: PropTypes.object.isRequired,
};

/**
 * EmptyState - Component displayed when no search results are found
 * Shows a message indicating no results for the current query
 *
 * @param {Object} props - Component props
 * @param {string} props.query - Search query that returned no results
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element} Rendered EmptyState
 *
 * @example
 * <EmptyState query="test" />
 */
function EmptyState({ query, ...props }) {
  return <DetailsBadge {...props} variant="error" message={`No results found for '${query}'`} />;
}

EmptyState.propTypes = {
  /** Search query that returned no results */
  query: PropTypes.string.isRequired,
};

/**
 * SolutionsSearch - Main search component for solutions page
 * Handles search queries, filtering, pagination, and result display
 *
 * @param {Object} props - Component props
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element} Rendered SolutionsSearch
 *
 * @example
 * Basic usage
 * <SolutionsSearch />
 *
 * @example
 * With additional props
 * <SolutionsSearch className="custom-class" />
 */
export default function SolutionsSearch({ ...props }) {
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

  // Single mount-time effect: ensure mode is valid AND strip stale params when no query.
  // Merged into one setSearchParams call so both corrections are applied atomically
  // with no risk of the two effects racing and overwriting each other.
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        let changed = false;

        // 1) Ensure mode is always a valid value
        const validModes = ['keyword', 'hybrid'];
        if (!validModes.includes(next.get('mode'))) {
          next.set('mode', 'hybrid');
          changed = true;
        }

        // 2) When there is no active search query, strip stale filter/page params
        if (!next.get('searchQuery')) {
          ['page', 'strategies', 'categories', 'sources'].forEach((p) => {
            if (next.has(p)) {
              next.delete(p);
              changed = true;
            }
          });
        }

        return changed ? next : prev;
      },
      { replace: true },
    );
  }, []); // intentional: once on mount only

  // Generic URL updater helper — uses functional form to always read the latest params,
  // preventing stale-closure races when multiple updates fire in the same render cycle.
  const updateParams = useCallback(
    (updates) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(updates).forEach(([k, v]) => {
            if (v === null || v === '' || v === undefined) {
              next.delete(k);
            } else {
              next.set(k, String(v));
            }
          });
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
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
            const prevQuery = prev.get('searchQuery') || '';
            next.set('searchQuery', val);
            // Query changed to a different value — reset page and filters since
            // they were derived from the previous result set and are now stale.
            if (val !== prevQuery) {
              ['page', 'strategies', 'categories', 'sources'].forEach((p) => next.delete(p));
            }
          } else {
            // Cleared — remove all search-related params but keep mode
            ['searchQuery', 'page', 'strategies', 'categories', 'sources'].forEach((p) =>
              next.delete(p),
            );
          }
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

  // Validate and clamp page to valid range after results load.
  // updateParams is stable (functional form), so omit it from deps to avoid
  // re-running on every render; totalPages and page are the real triggers.
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      updateParams({ page: null }); // reset to 1 (omitting page param = page 1)
    }
  }, [totalPages, page]);

  // Validate filters against available values (drop invalid URL params).
  // Uses functional setSearchParams so it always reads the latest params
  // regardless of when results arrive, avoiding stale-closure drops.
  useEffect(() => {
    if (!results.length) return;

    const strategySet = new Set();
    const categorySet = new Set();
    const sourceSet = new Set();

    results.forEach((result) => {
      if (result.circular_strategy) {
        result.circular_strategy
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((s) => strategySet.add(s));
      }
      if (result.category) categorySet.add(result.category);
      if (result.source_display) sourceSet.add(result.source_display);
    });

    const availStrat = Array.from(strategySet);
    const availCat = Array.from(categorySet);
    const availSrc = Array.from(sourceSet);

    setSearchParams(
      (prev) => {
        const currentStrat = prev.get('strategies')
          ? prev.get('strategies').split(',').filter(Boolean)
          : [];
        const currentCat = prev.get('categories')
          ? prev.get('categories').split(',').filter(Boolean)
          : [];
        const currentSrc = prev.get('sources')
          ? prev.get('sources').split(',').filter(Boolean)
          : [];

        const validStrat = currentStrat.filter((s) => availStrat.includes(s));
        const validCat = currentCat.filter((c) => availCat.includes(c));
        const validSrc = currentSrc.filter((s) => availSrc.includes(s));

        const changed =
          validStrat.length !== currentStrat.length ||
          validCat.length !== currentCat.length ||
          validSrc.length !== currentSrc.length;

        if (!changed) return prev; // no-op — return same reference to skip re-render

        const next = new URLSearchParams(prev);
        if (validStrat.length) next.set('strategies', validStrat.join(','));
        else next.delete('strategies');
        if (validCat.length) next.set('categories', validCat.join(','));
        else next.delete('categories');
        if (validSrc.length) next.set('sources', validSrc.join(','));
        else next.delete('sources');
        next.delete('page');
        return next;
      },
      { replace: true },
    );
  }, [results, setSearchParams]); // only when results change (new search)

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
            showDescription={false}
            actions={[
              {
                label: 'Clear all filters',
                icon: Eraser,
                variant: 'ghost',
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
    <div {...props} className="-mt-4 space-y-4">
      {/* Search input and mode toggle */}
      <div className="space-y-1">
        <div className="flex items-center justify-start gap-2 pl-2">
          {/* Mode toggle */}
          <Switch
            id="keyword-hybrid-search-toggle"
            size="sm"
            isSelected={isHybridMode}
            onChange={handleModeChange}
            onMouseEnter={handlePrefetchHybrid}
            className="flex items-center justify-between gap-3"
          >
            <Switch.Control>
              <Switch.Thumb>
                <Switch.Icon />
              </Switch.Thumb>
            </Switch.Control>
            <Switch.Content>
              <Label
                htmlFor="keyword-hybrid-search-toggle"
                className="-ml-0.5 flex items-center justify-center text-sm/relaxed text-(--color-text-secondary)"
              >
                <span>Semantic search</span>
                <span className="ml-2.5 flex items-center gap-1 text-xs text-(--color-text-muted)">
                  [ {isHybridMode ? 'AI-powered hybrid search' : 'fast keyword match'} ]
                </span>
              </Label>
            </Switch.Content>
          </Switch>

          {/* Result count + refresh button */}
          {hasResults && (
            <div className="mt-px flex items-center gap-2 font-mono text-xs font-medium text-(--color-text-muted)">
              {hasResults && <Minus size={16} strokeWidth={2.5} />}

              <div>
                {filteredResults && results && filteredResults.length < results.length
                  ? `${filteredResults.length} of ${results.length} results (filtered)`
                  : `${results.length} results`}
                {searchResults?.processing_info?.processing_time_ms &&
                  ` in ${formatDuration({ ms: searchResults.processing_info.processing_time_ms, combineSecAndMs: true })}`}
              </div>

              {isBackgroundFetching && <Spinner color="var(--color-dark-brown)" />}

              {isStale && !isFetching && (
                <Tooltip delay={0} className="inline-flex">
                  <Tooltip.Trigger tabIndex={0}>
                    <RefreshCw
                      size={16}
                      strokeWidth={2.5}
                      aria-label="Refresh results"
                      onClick={() => refetch()}
                      className="cursor-pointer"
                      color="var(--color-dark-brown)"
                    />
                  </Tooltip.Trigger>
                  <Tooltip.Content>Results may be outdated — click to refresh</Tooltip.Content>
                </Tooltip>
              )}
            </div>
          )}
        </div>

        {/* SearchField */}
        <SearchField
          name="ce-search"
          value={query}
          onChange={handleQueryChange}
          className="w-full"
          label="Search circular economy solutions"
          aria-label="Search circular economy solutions"
        >
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
        <div className="flex min-h-80 items-center justify-center">{renderFullWidthState()}</div>
      )}
    </div>
  );
}
