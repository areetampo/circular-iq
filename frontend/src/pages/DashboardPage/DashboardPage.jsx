import { Tabs } from '@heroui/react';
import { Globe, RotateCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Button } from '@/components/common';
import { useGlobalStats } from '@/features/assessments/hooks/useGlobalStats';
import { formatTimestamp } from '@/lib/formatting';

import { GlobalActivity, SolutionsSearch } from './components';

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Timestamp for "Updated at" display
  const [updatedAt, setUpdatedAt] = useState(new Date());

  // Get active tab from URL query param, default to 'search'
  const [selectedKey, setSelectedKey] = useState(() => {
    const activeTab = searchParams.get('activeTab');
    return activeTab === 'global' ? 'global' : 'search';
  });

  // Update URL query param when tab changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (selectedKey === 'global') {
      newParams.set('activeTab', 'global');
    } else {
      newParams.set('activeTab', 'search');
    }
    setSearchParams(newParams);
  }, [selectedKey, setSearchParams, searchParams]);

  // ── Global data ─────────────────────────────────────────────────────────────
  const { isLoading: globalLoading, refetch: refetchGlobal } = useGlobalStats();

  // Update timestamp when data finishes loading
  useEffect(() => {
    // Update timestamp when all data has finished loading
    if (!globalLoading) {
      setUpdatedAt(new Date());
    }
  }, [globalLoading]);

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
        <div className="flex flex-col items-end justify-center gap-2">
          <Button onClick={refetchGlobal} disabled={globalLoading} variant="teal">
            <RotateCw size={15} className={globalLoading ? 'animate-spin' : ''} strokeWidth={2.5} />
            Refresh
          </Button>
          <p className="font-mono text-[0.65rem] font-medium text-(--color-text-muted)">
            Updated at {formatTimestamp(updatedAt)}
          </p>
        </div>
      </div>

      <Tabs
        selectedKey={selectedKey}
        onSelectionChange={setSelectedKey}
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
