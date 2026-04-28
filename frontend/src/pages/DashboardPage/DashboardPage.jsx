import { Tabs } from '@heroui/react';
import { Globe, RotateCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Button } from '@/components/common';
import { useGlobalStats } from '@/features/assessments/hooks/useGlobalStats';
import { formatRelativeTime } from '@/lib/formatting';
import { cn } from '@/utils/cn';

import { GlobalActivity, SolutionsSearch } from './components';

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Timestamp for "Updated at" display
  const [updatedAt, setUpdatedAt] = useState(new Date());

  // ── State ──────────────────────────────────────────────────────────────────
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

  // ── Global data ─────────────────────────────────────────────────────────────
  const { isLoading: globalLoading, refetch: refetchGlobal } = useGlobalStats();

  // Handle refresh button click
  const handleRefresh = async () => {
    try {
      await refetchGlobal({ throwOnError: true });
      setUpdatedAt(new Date()); // Update timestamp immediately after refetch
    } catch (error) {
      // Error is handled by React Query's global error handling
      logger.error('[Dashboard Refresh] Error during refetch:', error);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto mt-4 max-w-6xl space-y-12 px-4 pb-16 sm:px-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 pt-8">
        <div>
          <h1 className="flex items-center gap-3 font-display text-[2rem] font-bold tracking-[-0.02em] text-(--color-text-primary)">
            <Globe size={28} className="text-(--color-success)" strokeWidth={2.5} />
            Global Intelligence Dashboard
          </h1>
          <p className="mt-3 pl-1 text-sm/relaxed text-(--color-text-secondary)">
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
            disabled={globalLoading}
            variant="teal"
            className={cn(globalLoading && 'opacity-60')}
          >
            <RotateCw size={15} className={cn(globalLoading && 'animate-spin')} strokeWidth={2.5} />
            Refresh
          </Button>
          <p className="font-mono text-[0.65rem] font-medium text-(--color-text-muted)">
            {globalLoading ? 'updating...' : `updated ${formatRelativeTime(updatedAt)}`}
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
