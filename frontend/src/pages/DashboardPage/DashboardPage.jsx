import { Tabs } from '@heroui/react';
import { Globe, RotateCw } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Button } from '@/components/common';
import { useGlobalStats } from '@/features/assessments/hooks/useGlobalStats';
import { useRelativeTime } from '@/hooks/useRelativeTime';
import { cn } from '@/utils/cn';

import { GlobalActivity, SolutionsSearch } from './components';

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Global data ─────────────────────────────────────────────────────────────
  const {
    isLoading: globalLoading,
    isFetching,
    refetch: refetchGlobal,
    dataUpdatedAt,
  } = useGlobalStats();

  // Convert ms timestamp to Date object for your useRelativeTime hook
  const updatedAtDate = dataUpdatedAt ? new Date(dataUpdatedAt) : new Date();
  const relativeTime = useRelativeTime(updatedAtDate);

  // Refresh handler – no local state needed at all
  const handleRefresh = async () => {
    await refetchGlobal();
    // dataUpdatedAt will be updated automatically by React Query
  };

  // Loading indicator: use React Query’s flags only
  const showUpdating = globalLoading || isFetching;

  // ── Tab handling ──────────────────────────────────────────────────────────────────
  // Derive selectedKey directly from the URL — single source of truth.
  // Never let local state drift from the URL.
  const activeTabParam = searchParams.get('activeTab');
  const selectedKey = activeTabParam === 'global' ? 'global' : 'search';

  // ── Effect: enforce activeTab param on first render / missing param ─────────
  useEffect(() => {
    const tab = searchParams.get('activeTab');
    if (tab !== 'search' && tab !== 'global') {
      const next = new URLSearchParams(searchParams);
      next.set('activeTab', 'search');
      setSearchParams(next, { replace: true });
    }
  }, []); // intentional: only runs once on mount to normalise the URL

  // ── Handler: user clicks a tab ─────────────────────────────────────────────
  const handleTabChange = useCallback(
    (key) => {
      const next = new URLSearchParams(searchParams);
      next.set('activeTab', key);

      if (key === 'global') {
        // Strip search-specific params — global tab doesn't use them
        ['searchQuery', 'page', 'mode', 'strategies', 'categories', 'sources'].forEach((p) =>
          next.delete(p),
        );
      }

      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 pt-6">
        <div>
          <h1 className="flex items-center gap-3 font-sans text-[2rem] font-medium tracking-[-0.02em] text-(--color-text-primary)">
            <Globe size={28} className="text-(--color-success)" strokeWidth={2.5} />
            Global Intelligence Dashboard
          </h1>
          <p className="pl-2 text-sm/relaxed text-(--color-text-secondary)">
            Live insights from all circular economy assessments worldwide
          </p>
        </div>

        {/* Refresh button + updated at timestamp */}
        <div
          className={cn(
            'flex flex-col items-end justify-center gap-2',
            globalLoading && 'items-center',
          )}
        >
          <Button
            onClick={handleRefresh}
            disabled={showUpdating}
            variant="teal"
            className={cn(showUpdating && 'opacity-60')}
          >
            <RotateCw size={15} className={cn(showUpdating && 'animate-spin')} strokeWidth={2.5} />
            Refresh
          </Button>
          <p className="font-mono text-[0.65rem] font-medium text-(--color-text-muted)">
            {showUpdating ? 'updating...' : `updated ${relativeTime}`}
          </p>
        </div>
      </div>

      <Tabs
        selectedKey={selectedKey}
        onSelectionChange={handleTabChange}
        className="w-full"
        variant="secondary"
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label="Dashboard sections" className="*:uppercase">
            <Tabs.Tab id="search">
              Search Solutions
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="global">
              Global Activity
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="search">
          <SolutionsSearch />
        </Tabs.Panel>

        <Tabs.Panel id="global">
          <GlobalActivity />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}

DashboardPage.propTypes = {};
