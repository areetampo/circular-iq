import { ListBox, Pagination, Popover, Select, Separator, Skeleton, toast } from '@heroui/react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Award, Building, Ghost, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Button, ErrorDisplay } from '@/components/common';
import { INDUSTRY_OPTIONS } from '@/constants/industries';
import { useGlobalDialog } from '@/contexts/DialogContext';
import { getAssessments, updateAssessment } from '@/features/assessments/api/assessmentApi';
import { usePrefetchAssessment } from '@/features/assessments/hooks/useAssessment';
import { useAssessments } from '@/features/assessments/hooks/useAssessments';
import { useAssessmentStats } from '@/features/assessments/hooks/useAssessmentStats';
import { useDebounce } from '@/hooks/useDebounce';
import { formatTruncatedList } from '@/lib/formatting';
import { getSessionId } from '@/utils/session';
import { parseSortBy } from '@/utils/sortUtils';

import { AssessmentList, AssessmentListSkeleton, FilterBar } from './components';

export default function MyAssessmentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sessionId = useMemo(() => getSessionId(), []);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [selectedIndustries, setSelectedIndustries] = useState(['all']);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [isRenaming, setIsRenaming] = useState(false);
  const { openDeleteAssessmentDialog, openRenameAssessmentDialog } = useGlobalDialog();

  // Persist list filters in URL so users can share filtered lists
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const industries = searchParams.get('industry');
    if (industries) setSelectedIndustries(industries.split(',').filter(Boolean));
    const p = Number(searchParams.get('page') || 1);
    if (!Number.isNaN(p) && p > 0) setPage(p);
    const ps = Number(searchParams.get('pageSize') || 5);
    if (!Number.isNaN(ps) && ps > 0) setPageSize(ps);
    const s = searchParams.get('search');
    if (s) setSearchTerm(s);
    const sb = searchParams.get('sortBy');
    if (sb) setSortBy(sb);
  }, []);

  // sync params when debounced values change
  useEffect(() => {
    const params = Object.fromEntries([...searchParams.entries()]);
    if (
      !selectedIndustries ||
      (selectedIndustries.length === 1 && selectedIndustries[0] === 'all')
    ) {
      delete params.industry;
    } else {
      params.industry = selectedIndustries.join(',');
    }
    if (page && page !== 1) params.page = String(page);
    else delete params.page;
    if (pageSize && pageSize !== 5) params.pageSize = String(pageSize);
    else delete params.pageSize;
    if (searchTerm) params.search = searchTerm;
    else delete params.search;
    if (sortBy && sortBy !== 'created_at_desc') params.sortBy = sortBy;
    else delete params.sortBy;
    setSearchParams(params, { replace: true });
  }, [selectedIndustries, page, pageSize, searchTerm, sortBy]);

  // Debounce search and sort to prevent constant reloading
  const debouncedSearchTerm = useDebounce(searchTerm, 350);
  const debouncedSortBy = useDebounce(sortBy, 300);

  // Parse sort value to get field and order
  const [sortField, sortOrder] = useMemo(() => {
    const { field, order } = parseSortBy(debouncedSortBy);
    return [field, order];
  }, [debouncedSortBy]);

  const selectedIndustryKey = useMemo(
    () => selectedIndustries.slice().sort().join('|'),
    [selectedIndustries],
  );

  const industryFilterParam = useMemo(() => {
    const activeIndustries = selectedIndustries.filter((industry) => industry !== 'all');
    if (activeIndustries.length === 0) return undefined;
    return activeIndustries.slice().sort().join(',');
  }, [selectedIndustries]);

  const industryOptions = useMemo(() => ['all', ...INDUSTRY_OPTIONS], []);

  const {
    assessments,
    total,
    isLoading: isAssessmentsLoading,
    error: isAssessmentsError,
    refetch,
    removeAssessmentAsync,
    isDeleting,
  } = useAssessments({
    sessionId,
    page: String(page),
    pageSize: String(pageSize),
    sortBy: sortField,
    order: sortOrder,
    search: debouncedSearchTerm,
    industry: industryFilterParam,
  });

  const prefetchAssessment = usePrefetchAssessment();

  // Fetch aggregate stats for all assessments (independent of pagination)
  const {
    averageScore,
    totalAssessments: stats_totalAssessments,
    topIndustries,
    highestScore,
    lowestScore,
    isLoading: isAssessmentStatsLoading,
    error: isAssessmentStatsError,
  } = useAssessmentStats();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, selectedIndustryKey, debouncedSortBy]);

  // Prefetch assessments when sort changes to warm the cache and make sort feel snappy
  useEffect(() => {
    if (!debouncedSortBy) return;
    const { field, order } = parseSortBy(debouncedSortBy);
    const prefetchKey = [
      'assessments',
      {
        sessionId: getSessionId(),
        page: 1,
        pageSize,
        sortBy: field,
        order,
        search: debouncedSearchTerm,
        industry: industryFilterParam,
      },
    ];
    queryClient.prefetchQuery({
      queryKey: prefetchKey,
      queryFn: () =>
        getAssessments({
          sessionId: getSessionId(),
          page: 1,
          pageSize,
          sortBy: field,
          order,
          search: debouncedSearchTerm,
          industry: industryFilterParam,
        }),
    });
  }, [debouncedSortBy, pageSize, debouncedSearchTerm, industryFilterParam, queryClient]);

  const formatIndustryLabel = useCallback((industry) => {
    if (!industry) return 'General';
    return industry
      .toString()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }, []);

  const handleToggleIndustry = useCallback((industry) => {
    setSelectedIndustries((prev) => {
      if (industry === 'all') {
        return ['all'];
      }

      const next = new Set(prev);
      next.delete('all');

      if (next.has(industry)) {
        next.delete(industry);
      } else {
        next.add(industry);
      }

      if (next.size === 0) {
        return ['all'];
      }

      return Array.from(next);
    });
  }, []);

  const prefetchAssessmentsPage = useCallback(
    (targetPage) => {
      if (!targetPage || Number.isNaN(Number(targetPage))) return;

      const pageValue = Math.max(1, Number(targetPage));
      const queryParams = {
        sessionId,
        page: String(pageValue),
        pageSize: String(pageSize),
        sortBy: sortField,
        order: sortOrder,
        search: debouncedSearchTerm,
        industry: industryFilterParam,
      };

      queryClient.prefetchQuery({
        queryKey: ['assessments', queryParams],
        queryFn: () => getAssessments(queryParams),
        staleTime: 30 * 1000,
      });
    },
    [
      queryClient,
      sessionId,
      pageSize,
      sortField,
      sortOrder,
      debouncedSearchTerm,
      industryFilterParam,
    ],
  );

  const handleToggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  const handleCompareSelected = useCallback(() => {
    if (selectedIds.size !== 2) {
      toast.info('Please select exactly 2 assessments to compare', { timeout: 3000 });
      return;
    }

    const selectedIdArray = Array.from(selectedIds);
    // Find the publicIds for the selected assessments
    const publicIds = selectedIdArray
      .map((id) => assessments.find((a) => a.id === id)?.public_id)
      .filter(Boolean);

    if (publicIds.length !== 2) {
      toast.danger('Could not find selected assessments', { timeout: 3000 });
      return;
    }

    navigate(`/assessments/compare/${publicIds[0]}/${publicIds[1]}`);
  }, [selectedIds, assessments, navigate]);

  const handleViewDetail = useCallback(
    (publicId) => {
      if (!publicId) return;
      navigate(`/assessments/${publicId}`);
    },
    [navigate],
  );

  const handleConfirmDelete = useCallback(
    async (id) => {
      if (!id) {
        toast.danger('No assessment selected for deletion', { timeout: 4000 });
        throw new Error('No assessment selected for deletion');
      }

      try {
        const result = await removeAssessmentAsync(id);

        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });

        // Invalidate stats query to update the top two cards
        queryClient.invalidateQueries({ queryKey: ['assessment-stats'] });

        toast.success('Assessment deleted successfully', { timeout: 3000 });

        return result;
      } catch (err) {
        logger.error('[DELETE_ERROR]', { id, error: err.message });
        const errorMsg = err?.message || 'Please try again.';
        toast.danger(`Delete failed: ${errorMsg}`, { timeout: 4000 });
        throw err;
      }
    },
    [removeAssessmentAsync, queryClient],
  );

  const handleConfirmRename = useCallback(
    async (assessmentId, newTitle) => {
      if (!assessmentId) {
        toast.danger('No assessment selected for rename', { timeout: 4000 });
        throw new Error('No assessment selected for rename');
      }

      // Duplicate name check among user's assessments
      if (
        assessments.some(
          (a) =>
            a.id !== assessmentId &&
            a.title &&
            a.title.trim().toLowerCase() === String(newTitle).trim().toLowerCase(),
        )
      ) {
        const msg = 'You already have an assessment with that name';
        toast.danger(msg, { timeout: 4000 });
        throw new Error(msg);
      }

      const detailCacheKey = ['assessment', assessmentId];
      const previousAssessments = queryClient.getQueriesData({ queryKey: ['assessments'] });
      const previousAssessment = queryClient.getQueryData(detailCacheKey);

      queryClient.setQueriesData({ queryKey: ['assessments'] }, (old) => {
        if (!old || !old.assessments) return old;
        return {
          ...old,
          assessments: old.assessments.map((assessment) =>
            assessment.id === assessmentId ? { ...assessment, title: newTitle } : assessment,
          ),
        };
      });

      queryClient.setQueryData(detailCacheKey, (old) => {
        if (!old) return old;
        const detail = old.assessment ? old.assessment : old;
        const updated = { ...detail, title: newTitle };
        return old.assessment ? { ...old, assessment: updated } : updated;
      });

      try {
        setIsRenaming(true);
        const result = await updateAssessment(assessmentId, { title: newTitle });
        toast.success('Assessment renamed successfully', { timeout: 3000 });
        return result;
      } catch (err) {
        previousAssessments.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
        queryClient.setQueryData(detailCacheKey, previousAssessment);
        const errorMsg = err?.message || 'Please try again.';
        toast.danger(`Rename failed: ${errorMsg}`, { timeout: 4000 });
        throw err;
      } finally {
        setIsRenaming(false);
      }
    },
    [assessments, queryClient],
  );

  const handleRenameAssessment = useCallback(
    (id) => {
      const assessment = assessments.find((a) => a.id === id);
      openRenameAssessmentDialog({
        defaultName: assessment?.title || '',
        onRename: (newTitle) => handleConfirmRename(id, newTitle),
        isLoading: isRenaming,
      });
    },
    [assessments, openRenameAssessmentDialog, handleConfirmRename, isRenaming],
  );

  const handleDeleteAssessment = useCallback(
    (id) => {
      const assessment = assessments.find((a) => a.id === id);
      openDeleteAssessmentDialog({
        assessmentName: assessment?.title || '',
        onConfirm: () => handleConfirmDelete(id),
        isLoading: isDeleting,
      });
    },
    [assessments, openDeleteAssessmentDialog, handleConfirmDelete, isDeleting],
  );

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleTogglePublic = useCallback(
    async (id) => {
      const assessment = assessments.find((a) => a.id === id);
      if (!assessment) return;

      const newValue = !assessment.is_public;

      try {
        await updateAssessment(id, { is_public: newValue });
        queryClient.invalidateQueries({ queryKey: ['assessments'] });
        toast.success(newValue ? 'Assessment is now public' : 'Assessment is now private', {
          timeout: 3000,
        });
      } catch (error) {
        logger.error('Error updating public status:', error);
        toast.danger(`Failed to update sharing settings: ${error}`, { timeout: 4000 });
      }
    },
    [assessments, queryClient],
  );

  const handleToggleBenchmarks = useCallback(
    async (id) => {
      const assessment = assessments.find((a) => a.id === id);
      if (!assessment) return;

      const newValue = !assessment.contribute_to_global_benchmarks;

      try {
        await updateAssessment(id, { contribute_to_global_benchmarks: newValue });
        queryClient.invalidateQueries({ queryKey: ['assessments'] });
        toast.success(
          newValue
            ? 'Now contributing to global benchmarks'
            : 'No longer contributing to global benchmarks',
          { timeout: 3000 },
        );
      } catch (error) {
        logger.error('Error updating benchmark settings:', error);
        toast.danger(`Failed to update benchmark settings: ${error}`, { timeout: 4000 });
      }
    },
    [assessments, queryClient],
  );

  const totalPages = useMemo(() => Math.ceil(total / pageSize), [total, pageSize]);

  // Render skeleton cards for initial load - Beautiful spacing
  const renderInitialLoadPageSkeleton = useCallback(() => {
    // SummaryCardSkeleton - Matches the actual Summary Card structure
    function SummaryCardSkeleton() {
      return (
        <div
          className="border rounded-xl px-6 py-5 shadow-sm"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {/* Label */}
              <Skeleton animationType="shimmer" className="h-3 w-28 rounded mb-2" />

              {/* Score/Title */}
              <Skeleton animationType="shimmer" className="h-10 w-20 rounded-lg mb-2" />

              {/* Description */}
              <Skeleton animationType="shimmer" className="h-4 w-36 rounded mt-2" />

              {/* Description part 2 */}
              <Skeleton animationType="shimmer" className="h-10 w-28 rounded mt-6" />
            </div>

            {/* Icon */}
            <Skeleton animationType="shimmer" className="w-12 h-12 rounded-xl shrink-0" />
          </div>
        </div>
      );
    }

    // FiltersCardSkeleton - Matches the actual Filters Card structure
    function FiltersCardSkeleton() {
      return (
        <div
          className="border-2 shadow-sm rounded-xl"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="p-6 space-y-6">
            {/* Filter inputs */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Skeleton animationType="shimmer" className="h-4 w-32 rounded" />
                <Skeleton animationType="shimmer" className="h-10 rounded-lg" />
              </div>
              <div className="flex flex-col gap-2">
                <Skeleton animationType="shimmer" className="h-4 w-20 rounded" />
                <Skeleton animationType="shimmer" className="h-10 rounded-lg" />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <Skeleton animationType="shimmer" className="h-4 w-16 rounded" />
                <Skeleton animationType="shimmer" className="h-10 rounded-lg" />
              </div>
            </div>

            {/* Compare section */}
            <div
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-5 border-t-2"
              style={{ borderColor: 'var(--border)' }}
            >
              <Skeleton animationType="shimmer" className="h-4 w-64 rounded" />
              <Skeleton animationType="shimmer" className="h-10 w-44 rounded-lg" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
        </div>

        {/* Filters Card Skeleton */}
        <FiltersCardSkeleton />

        {/* Assessment List Skeleton */}
        <div className="space-y-4">
          <AssessmentListSkeleton />
        </div>
      </div>
    );
  }, []);

  // Render only assessment list skeleton - Beautiful spacing
  const renderAssessmentListSkeleton = useCallback(() => <AssessmentListSkeleton />, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="label-overline mb-1">YOUR HISTORY</p>
          <h1 className="text-[28px] font-semibold" style={{ color: 'var(--foreground)' }}>
            Saved Assessments
          </h1>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-150"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-foreground)',
          }}
        >
          + New Assessment
        </button>
      </div>

      {/* INITIAL LOAD: Show all skeletons until data arrives */}
      {isAssessmentStatsLoading ? (
        renderInitialLoadPageSkeleton()
      ) : isAssessmentStatsError ? (
        <ErrorDisplay
          variant="error"
          title="Error Loading Assessments"
          message={
            isAssessmentStatsError.message ||
            'An error occurred while loading your assessments. Please try again.'
          }
          actions={[
            {
              label: 'Retry',
              onClick: () => refetch(),
              variant: 'danger',
            },
            {
              label: 'Back to Home',
              onClick: handleBack,
              variant: 'secondary',
            },
          ]}
          showDefaultActions={false}
        />
      ) : (
        <>
          {/* AFTER INITIAL LOAD: Show actual content */}
          {/* Summary Cards - Custom modern design */}
          {stats_totalAssessments > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Average Score Card */}
              <div
                className="border rounded-xl px-6 py-5"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                  borderWidth: '1px',
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: 'var(--muted)' }}
                    >
                      Average Score
                    </p>
                    <div className="flex items-baseline gap-3">
                      <h3
                        className="text-3xl font-black"
                        style={{
                          color: 'var(--foreground)',
                        }}
                      >
                        {averageScore}
                      </h3>
                    </div>
                    <p className="text-sm font-medium mt-2" style={{ color: 'var(--muted)' }}>
                      Across {stats_totalAssessments} assessment
                      {stats_totalAssessments !== 1 ? 's' : ''}
                    </p>
                    <div className="flex items-center gap-6 mt-3">
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                          High
                        </p>
                        <p
                          className="text-lg font-bold"
                          style={{
                            color: 'var(--foreground)',
                          }}
                        >
                          {highestScore}
                        </p>
                      </div>
                      <Separator
                        orientation="vertical"
                        style={{ backgroundColor: 'var(--border)' }}
                      />
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                          Low
                        </p>
                        <p
                          className="text-lg font-bold"
                          style={{
                            color: 'var(--foreground)',
                          }}
                        >
                          {lowestScore}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div
                    className="p-3 rounded-xl shrink-0"
                    style={{ backgroundColor: 'var(--accent-soft)' }}
                  >
                    <Award size={24} style={{ color: 'var(--accent)' }} />
                  </div>
                </div>
              </div>
              {/* Primary Focus Card */}
              <div
                className="border rounded-xl px-6 py-5"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: 'var(--accent)' }}
                    >
                      Primary Focus
                    </p>
                    <h3
                      className="text-2xl font-bold leading-tight"
                      style={{
                        color: 'var(--foreground)',
                      }}
                    >
                      {topIndustries && topIndustries.length > 0
                        ? (() => {
                            const { display } = formatTruncatedList(topIndustries, 3);
                            const hasMore = topIndustries.length > 3;
                            return hasMore ? `${display}...` : display;
                          })()
                        : '—'}
                    </h3>
                    {topIndustries && topIndustries.length > 3 && (
                      <Popover>
                        <Popover.Trigger>
                          <Button size="xs" variant="ghost" className="mt-2">
                            View All
                          </Button>
                        </Popover.Trigger>
                        <Popover.Content className="max-w-xs">
                          <Popover.Dialog>
                            <div className="space-y-0.5">
                              {topIndustries.map((industry, idx) => (
                                <p
                                  key={idx}
                                  className="text-sm italic"
                                  style={{ color: 'var(--accent)' }}
                                >
                                  {industry.industry
                                    .replace(/_/g, ' ')
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </p>
                              ))}
                            </div>
                          </Popover.Dialog>
                        </Popover.Content>
                      </Popover>
                    )}
                    <p className="text-sm font-medium mt-2" style={{ color: 'var(--accent)' }}>
                      {topIndustries && topIndustries.length > 0
                        ? `${topIndustries[0].count} assessment${topIndustries[0].count !== 1 ? 's' : ''} ${topIndustries.length > 1 ? 'each' : ''}`
                        : 'No data available'}
                    </p>
                  </div>
                  <div
                    className="p-3 rounded-xl shrink-0"
                    style={{ backgroundColor: 'var(--accent-soft)' }}
                  >
                    <Building size={24} style={{ color: 'var(--accent)' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters & Controls Card - STATIC during filter changes - Beautiful spacing */}
          {stats_totalAssessments > 0 && (
            <FilterBar
              sortBy={sortBy}
              setSortBy={setSortBy}
              setPage={setPage}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              industryOptions={industryOptions}
              selectedIndustries={selectedIndustries}
              handleToggleIndustry={handleToggleIndustry}
              formatIndustryLabel={formatIndustryLabel}
              selectedIds={selectedIds}
              handleCompareSelected={handleCompareSelected}
            />
          )}

          {/* Assessment List Section - ONLY this shows loading during filter changes */}
          <div className="space-y-4">
            {isAssessmentsLoading ? (
              renderAssessmentListSkeleton()
            ) : isAssessmentsError ? (
              <ErrorDisplay
                variant="error"
                title="Error Loading Assessments"
                message={
                  isAssessmentsError.message ||
                  'An error occurred while loading your assessments. Please try again.'
                }
                actions={[
                  {
                    label: 'Retry',
                    onClick: () => refetch(),
                    variant: 'danger',
                  },
                  {
                    label: 'Back to Home',
                    onClick: handleBack,
                    variant: 'secondary',
                  },
                ]}
                showDefaultActions={false}
              />
            ) : stats_totalAssessments === 0 ? (
              <div
                className="border-2 border-dashed shadow-sm rounded-xl"
                style={{
                  backgroundColor: 'var(--accent-soft)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="p-6 text-center">
                  <div className="flex justify-center mb-8">
                    <div
                      className="p-5 rounded-2xl shadow-inner"
                      style={{
                        background:
                          'linear-gradient(to bottom right, var(--surface), var(--border))',
                      }}
                    >
                      <Ghost strokeWidth={1.5} size={48} style={{ color: 'var(--muted)' }} />
                    </div>
                  </div>
                  <h3
                    className="font-bold text-2xl mb-3"
                    style={{
                      color: 'var(--foreground)',
                    }}
                  >
                    No assessments yet
                  </h3>
                  <p
                    className="text-base mb-8 max-w-md mx-auto leading-relaxed"
                    style={{ color: 'var(--muted)' }}
                  >
                    Start your first assessment to track your circular economy progress and get
                    personalized recommendations.
                  </p>
                  <Button onPress={handleBack} variant="primary" size="lg">
                    <Plus size={20} />
                    Start Your First Assessment
                  </Button>
                </div>
              </div>
            ) : assessments.length === 0 ? (
              <div
                className="border-2 border-dashed shadow-sm rounded-xl"
                style={{
                  backgroundColor: 'var(--accent-soft)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="p-6 text-center">
                  <div className="flex justify-center mb-8">
                    <div
                      className="p-5 rounded-2xl shadow-inner"
                      style={{
                        background:
                          'linear-gradient(to bottom right, var(--surface), var(--border))',
                      }}
                    >
                      <Ghost strokeWidth={1.5} size={48} style={{ color: 'var(--muted)' }} />
                    </div>
                  </div>
                  <h3
                    className="font-bold text-2xl mb-3"
                    style={{
                      color: 'var(--foreground)',
                    }}
                  >
                    No assessments found
                  </h3>
                  <p
                    className="text-base mb-8 max-w-md mx-auto leading-relaxed"
                    style={{ color: 'var(--muted)' }}
                  >
                    Your current filters didn&apos;t match any assessments. Try selecting a
                    different industry or adjusting your search.
                  </p>
                  <Button
                    variant="secondary"
                    onPress={() => {
                      setSearchTerm('');
                      setSelectedIndustries(['all']);
                      setSortBy('created_at_desc');
                      setPage(1);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <AssessmentList
                  assessments={assessments}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onView={handleViewDetail}
                  onRename={handleRenameAssessment}
                  onDelete={handleDeleteAssessment}
                  onPrefetch={prefetchAssessment}
                  onTogglePublic={handleTogglePublic}
                  onToggleBenchmarks={handleToggleBenchmarks}
                />

                <div className="flex flex-col items-center justify-center gap-3 p-0 mt-6">
                  {/* Pagination info text */}
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    Showing{' '}
                    <span
                      className="font-semibold inline-block text-center"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)}
                    </span>{' '}
                    of{' '}
                    <span
                      className="font-semibold inline-block text-center"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {total}
                    </span>{' '}
                    results
                  </p>

                  <div className="flex sm:flex-row flex-col items-center justify-center gap-4 sm:gap-6 mt-1 sm:mt-0">
                    {/* MUI Pagination */}
                    <Pagination className="justify-center">
                      <Pagination.Content>
                        <Pagination.Item>
                          <Pagination.Previous
                            isDisabled={page === 1}
                            onPress={() => setPage(page - 1)}
                          >
                            <Pagination.PreviousIcon />
                            Previous
                          </Pagination.Previous>
                        </Pagination.Item>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                          <Pagination.Item key={p}>
                            <Pagination.Link isActive={p === page} onPress={() => setPage(p)}>
                              {p}
                            </Pagination.Link>
                          </Pagination.Item>
                        ))}
                        <Pagination.Item>
                          <Pagination.Next
                            isDisabled={page === totalPages}
                            onPress={() => setPage(page + 1)}
                          >
                            Next
                            <Pagination.NextIcon />
                          </Pagination.Next>
                        </Pagination.Item>
                      </Pagination.Content>
                    </Pagination>

                    {/* HeroUI v3 Select for page size */}
                    <div className="flex items-center gap-2">
                      <label
                        className="text-sm whitespace-nowrap"
                        style={{ color: 'var(--muted)' }}
                      >
                        Per page:
                      </label>
                      <Select
                        className="w-20"
                        placeholder="5"
                        value={String(pageSize)}
                        onChange={(value) => {
                          setPageSize(Number(value));
                          setPage(1);
                        }}
                        aria-label="Select page size"
                      >
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            <ListBox.Item id="5" textValue="5">
                              5
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                            <ListBox.Item id="10" textValue="10">
                              10
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                            <ListBox.Item id="20" textValue="20">
                              20
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                            <ListBox.Item id="50" textValue="50">
                              50
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                            <ListBox.Item id="100" textValue="100">
                              100
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          </ListBox>
                        </Select.Popover>
                      </Select>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Simple Back Home Button */}
      <div className="flex justify-center pt-2">
        <Button variant="secondary" onPress={handleBack} size="lg">
          <ArrowLeft strokeWidth={2.5} size={20} />
          Back to Home
        </Button>
      </div>
    </div>
  );
}
