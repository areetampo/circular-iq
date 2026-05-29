/**
 * Sidebar filters (industry, category, strategy) for CE case search.
 */

import { Accordion, ScrollShadow } from '@heroui/react';
import { ChevronDown } from 'lucide-react';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Chip } from '@/components/common';

/**
 * Accordion filters for strategy, category, and source; options derived from current `results`.
 */
export default function FilterSidebar({
  results,
  activeStrategies,
  setActiveStrategies,
  activeCategories,
  setActiveCategories,
  activeSources,
  setActiveSources,
  ...props
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

  const handleStrategyToggleLocal = useCallback(
    (strategy) => {
      const currentStrategies = activeStrategies.includes(strategy)
        ? activeStrategies.filter((s) => s !== strategy)
        : [...activeStrategies, strategy];
      setActiveStrategies(currentStrategies);
    },
    [activeStrategies, setActiveStrategies],
  );

  const handleCategoryToggleLocal = useCallback(
    (category) => {
      const currentCategories = activeCategories.includes(category)
        ? activeCategories.filter((c) => c !== category)
        : [...activeCategories, category];
      setActiveCategories(currentCategories);
    },
    [activeCategories, setActiveCategories],
  );

  const handleSourceToggleLocal = useCallback(
    (source) => {
      const currentSources = activeSources.includes(source)
        ? activeSources.filter((s) => s !== source)
        : [...activeSources, source];
      setActiveSources(currentSources);
    },
    [activeSources, setActiveSources],
  );

  if (results.length === 0) {
    return <p className="text-xs text-(--color-text-muted)">Filters appear after searching</p>;
  }

  const [isFiltersOverflowing, setIsFiltersOverflowing] = useState(false);
  const filtersRef = useRef(null);

  useEffect(() => {
    const element = filtersRef.current;
    if (element) {
      const checkOverflow = () => {
        const isOverflowing = element.scrollHeight > element.clientHeight;
        setIsFiltersOverflowing(isOverflowing);
      };

      checkOverflow();
      const resizeObserver = new ResizeObserver(checkOverflow);
      resizeObserver.observe(element);

      return () => resizeObserver.disconnect();
    }
  }, [results]);

  return (
    <ScrollShadow
      {...props}
      id="filters-sidebar-scroll"
      ref={filtersRef}
      className={`h-screen overflow-hidden ${isFiltersOverflowing && 'pr-2.5'} pb-2 hover:overflow-y-auto hover:pr-0`}
      size={30}
    >
      <Accordion
        className="w-full"
        allowsMultipleExpanded
        defaultExpandedKeys={new Set(['strategy', 'category', 'source'])}
      >
        {[
          {
            id: 'strategy',
            title: 'Strategy',
            items: strategies,
            activeItems: activeStrategies,
            onClear: () => setActiveStrategies([]),
            onToggle: handleStrategyToggleLocal,
            chipTextLimit: 25,
            showWhen: strategies.length >= 2,
          },
          {
            id: 'category',
            title: 'Category',
            items: categories,
            activeItems: activeCategories,
            onClear: () => setActiveCategories([]),
            onToggle: handleCategoryToggleLocal,
            chipTextLimit: 25,
            showWhen: categories.length >= 2,
          },
          {
            id: 'source',
            title: 'Source',
            items: sources,
            activeItems: activeSources,
            onClear: () => setActiveSources([]),
            onToggle: handleSourceToggleLocal,
            chipTextLimit: 25,
            showWhen: sources.length >= 2,
          },
        ]
          .filter((filter) => filter.showWhen)
          .map((filter) => (
            <Accordion.Item key={filter.id} id={filter.id}>
              <Accordion.Heading>
                <Accordion.Trigger className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-(--color-bg-hover)">
                  <span className="text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
                    {filter.title}
                  </span>
                  <Accordion.Indicator className="text-(--color-text-muted)">
                    <ChevronDown className="size-4" />
                  </Accordion.Indicator>
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel>
                <Accordion.Body>
                  <div className="flex w-full flex-wrap gap-1.5 pt-2">
                    <Chip
                      variant="filter"
                      active={filter.activeItems.length === 0}
                      onClick={filter.onClear}
                    >
                      All
                    </Chip>
                    {filter.items.map((item) => (
                      <Chip
                        key={item}
                        variant="filter"
                        active={filter.activeItems.includes(item)}
                        onClick={() => filter.onToggle(item)}
                        limit={filter.chipTextLimit}
                      >
                        {item}
                      </Chip>
                    ))}
                  </div>
                </Accordion.Body>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
      </Accordion>
    </ScrollShadow>
  );
}

FilterSidebar.propTypes = {
  /** Case-search results used to derive strategy, category, and source filter chips. */
  results: PropTypes.array.isRequired,
  /** Strategy labels currently selected in the parent search state. */
  activeStrategies: PropTypes.array.isRequired,
  /** Receives the next selected strategy list. */
  setActiveStrategies: PropTypes.func.isRequired,
  /** Category labels currently selected in the parent search state. */
  activeCategories: PropTypes.array.isRequired,
  /** Receives the next selected category list. */
  setActiveCategories: PropTypes.func.isRequired,
  /** Source labels currently selected in the parent search state. */
  activeSources: PropTypes.array.isRequired,
  /** Receives the next selected source list. */
  setActiveSources: PropTypes.func.isRequired,
};
