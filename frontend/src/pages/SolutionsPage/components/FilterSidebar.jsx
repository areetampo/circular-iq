import { Accordion, ScrollShadow } from '@heroui/react';
import { ChevronDown } from 'lucide-react';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Chip } from '@/components/common';

/**
 * Filter sidebar component for solutions search
 * @param {Object} props - Component props
 * @param {Array} props.results - Search results to extract filter values from
 * @param {Array} props.activeStrategies - Currently active strategy filters
 * @param {Function} props.setActiveStrategies - Function to update active strategies
 * @param {Array} props.activeCategories - Currently active category filters
 * @param {Function} props.setActiveCategories - Function to update active categories
 * @param {Array} props.activeSources - Currently active source filters
 * @param {Function} props.setActiveSources - Function to update active sources
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
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
      id="filters-sidebar-scroll"
      ref={filtersRef}
      className={`h-screen overflow-hidden ${isFiltersOverflowing && 'pr-2.5'} pb-2 hover:overflow-y-auto hover:pr-0`}
      size={30}
      {...props}
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
  /** Search results to extract filter values from */
  results: PropTypes.array.isRequired,
  /** Currently active strategy filters */
  activeStrategies: PropTypes.array.isRequired,
  /** Function to update active strategies */
  setActiveStrategies: PropTypes.func.isRequired,
  /** Currently active category filters */
  activeCategories: PropTypes.array.isRequired,
  /** Function to update active categories */
  setActiveCategories: PropTypes.func.isRequired,
  /** Currently active source filters */
  activeSources: PropTypes.array.isRequired,
  /** Function to update active sources */
  setActiveSources: PropTypes.func.isRequired,
};
