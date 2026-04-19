import { ListBox, Pagination, Select, Skeleton, toast } from '@heroui/react';
import { useQueryClient } from '@tanstack/react-query';
import { Ghost, Home, MoveLeft, Plus, RotateCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { Button, ErrorDisplay } from '@/components/common';
import { INDUSTRY_OPTIONS } from '@/constants/industries';
import { useGlobalDialog } from '@/contexts/DialogContext';
import { getAssessments, updateAssessment } from '@/features/assessments/api/assessmentApi';
import { usePrefetchAssessment } from '@/features/assessments/hooks/useAssessment';
import { useAssessments } from '@/features/assessments/hooks/useAssessments';
import { useAssessmentStats } from '@/features/assessments/hooks/useAssessmentStats';
import { useDebounce } from '@/hooks/useDebounce';
import { toTitleCase } from '@/lib/formatting';
import { getSessionId } from '@/utils/session';
import { parseSortBy } from '@/utils/sortUtils';

import { AssessmentList, AssessmentListSkeleton, FilterBar, StatsGrid } from './components';

export default function MyAssessmentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sessionId = useMemo(() => getSessionId(), []);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [selectedIndustries, setSelectedIndustries] = useState(['all']);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isRenaming, setIsRenaming] = useState(false);
  const { openDeleteAssessmentDialog, openRenameAssessmentDialog } = useGlobalDialog();

  // Available page size options
  const pageSizeOptions = useMemo(() => [5, 10, 20, 50, 100], []);

  // Persist list filters in URL so users can share filtered lists
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const industries = searchParams.get('industry');
    if (industries) setSelectedIndustries(industries.split(',').filter(Boolean));
    const p = Number(searchParams.get('page') || 1);
    if (!Number.isNaN(p) && p > 0) setPage(p);
    const ps = Number(searchParams.get('pageSize') || 10);
    if (!Number.isNaN(ps) && ps > 0 && pageSizeOptions.includes(ps)) setPageSize(ps);
    else if (!Number.isNaN(ps) && ps > 0) setPageSize(10); // Default to 10 for invalid sizes
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
    if (pageSize && pageSize !== 10) params.pageSize = String(pageSize);
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
    minScore,
    maxScore,
    assessmentsByIndustry,
    isLoading: isAssessmentStatsLoading,
    error: isAssessmentStatsError,
  } = useAssessmentStats();

  // Transform data to match StatsGrid expectations
  const highestScore = maxScore;
  const lowestScore = minScore;
  const topIndustries = assessmentsByIndustry
    ? Object.entries(assessmentsByIndustry)
        .map(([industry, count]) => ({ industry, count }))
        .sort((a, b) => b.count - a.count)
    : [];

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, selectedIndustryKey, debouncedSortBy]);

  // Refetch assessment stats when component mounts or when user navigates back
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['assessmentStats'] });
  }, [queryClient]);

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
    return toTitleCase(industry.toString());
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

  // Memoized compare URL for Link component
  const compareUrl = useMemo(() => {
    if (selectedIds.size !== 2) return null;

    const selectedIdArray = Array.from(selectedIds);
    const publicIds = selectedIdArray
      .map((id) => {
        const assessment = assessments.find((a) => a.id === id);
        return assessment?.public_id;
      })
      .filter(Boolean);

    if (publicIds.length !== 2) return null;
    return `/assessments/compare?id1=${publicIds[0]}&id2=${publicIds[1]}`;
  }, [selectedIds, assessments]);

  const totalPages = useMemo(() => Math.ceil(total / pageSize), [total, pageSize]);

  // Prefetch adjacent pages for better UX
  useEffect(() => {
    if (totalPages > 1) {
      // Prefetch next page if it exists
      if (page < totalPages) {
        prefetchAssessmentsPage(page + 1);
      }
      // Prefetch previous page if it exists and we're not on page 1
      if (page > 1) {
        prefetchAssessmentsPage(page - 1);
      }
    }
  }, [page, totalPages, prefetchAssessmentsPage]);

  // Render skeleton cards for initial load - Beautiful spacing
  const renderInitialLoadPageSkeleton = useCallback(() => {
    return (
      <div className="mx-auto mt-6 max-w-4xl space-y-6">
        {/* Stats grid skeleton */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-2xl border-2 border-(--color-border-strong-alpha-80) bg-(--color-bg-card-light) p-5"
            >
              <Skeleton animationType="shimmer" className="mb-3 h-3 w-20" />
              <Skeleton animationType="shimmer" className="mb-2 h-8 w-16" />
              <Skeleton animationType="shimmer" className="h-3 w-24" />
            </div>
          ))}
        </div>

        {/* FilterBar Skeleton */}
        <div className="mb-6 space-y-3">
          {/* Search input skeleton */}
          <div className="relative">
            <div className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-(--color-text-muted)">
              <Skeleton animationType="shimmer" className="size-4" />
            </div>
            <Skeleton
              animationType="shimmer"
              className="h-9 w-full rounded-xl bg-(--color-input-bg) pr-4 pl-9"
            />
          </div>

          {/* Sort + Compare button row skeleton */}
          <div className="flex items-center justify-between gap-3">
            {/* Sort select skeleton */}
            <div className="max-w-50 flex-1">
              <Skeleton
                animationType="shimmer"
                className="h-9 w-full rounded-md bg-(--color-input-bg) pr-10"
              />
            </div>

            {/* Compare button skeleton */}
            <Skeleton
              animationType="shimmer"
              className="h-9 w-32 rounded-md bg-(--color-input-bg)"
            />
          </div>

          {/* Industry filter chips skeleton */}
          <div className="flex flex-wrap gap-2">
            {Array(12)
              .fill(0)
              .map((_, i) => (
                <Skeleton
                  key={i}
                  animationType="shimmer"
                  className="h-6 w-20 rounded-full! bg-(--color-input-bg)"
                />
              ))}
          </div>
        </div>

        {/* Assessment List Skeleton */}
        <div className="space-y-4">
          <AssessmentListSkeleton />
        </div>
      </div>
    );
  }, []);

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
        const msg = 'Name already exists';
        // toast.danger(msg, { timeout: 4000 });
        // msg is shown in rename dialog so no need of toast
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

  const handleViewDetail = useCallback(
    (publicId) => {
      navigate(`/assessments/${publicId}`);
    },
    [navigate],
  );

  const handleTogglePublic = useCallback(
    async (id) => {
      const assessment = assessments.find((a) => a.id === id);
      if (!assessment) return;

      const newValue = !assessment.is_public;

      try {
        await updateAssessment(id, { is_public: newValue });

        logger.log('Toggling public status for assessment:', id, 'to:', newValue);

        // Refetch the assessments list to update the list view
        await queryClient.refetchQueries({ queryKey: ['assessments'] });
        logger.log('Refetched assessments list');

        // If this assessment has a public_id, refetch both the private and public assessment
        // queries to update the results page if it's open
        if (assessment.public_id) {
          // Refetch private assessment view
          await queryClient.refetchQueries({
            queryKey: ['assessment', assessment.id],
          });
          logger.log('Refetched private assessment:', assessment.id);

          // Refetch public assessment view
          await queryClient.refetchQueries({
            queryKey: ['publicAssessment', assessment.public_id],
          });
          logger.log('Refetched public assessment:', assessment.public_id);
        }

        // Also refetch stats to keep them in sync
        await queryClient.refetchQueries({ queryKey: ['assessmentStats'] });
        logger.log('Refetched assessment stats');

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

  // Prefetch adjacent pages for better UX
  useEffect(() => {
    if (totalPages > 1) {
      // Prefetch next page if it exists
      if (page < totalPages) {
        prefetchAssessmentsPage(page + 1);
      }
      // Prefetch previous page if it exists and we're not on page 1
      if (page > 1) {
        prefetchAssessmentsPage(page - 1);
      }
    }
  }, [page, totalPages, prefetchAssessmentsPage]);

  // ------- Helper: Render the assessment list area (with early returns) --------
  const renderAssessmentListContent = () => {
    if (isAssessmentsLoading) {
      return <AssessmentListSkeleton />;
    }

    if (isAssessmentsError) {
      return (
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
              icon: RotateCw,
              onPress: refetch,
              variant: 'teal',
            },
            {
              label: 'Back to Home',
              icon: Home,
              variant: 'ghost',
              as: Link,
              to: '/',
            },
          ]}
          showDefaultActions={false}
        />
      );
    }

    // No assessments at all (stats_totalAssessments === 0)
    if (stats_totalAssessments === 0) {
      return (
        <div className="mt-16 rounded-2xl border-4 border-dashed border-(--color-border-ui) bg-(--color-bg-card-light) p-12 text-center">
          <Ghost strokeWidth={1.2} size={44} className="mx-auto mb-5 text-(--color-text-muted)" />
          <h3 className="mb-2 font-display text-xl font-semibold text-(--color-text-primary)">
            No assessments yet
          </h3>
          <p className="mx-auto mb-6 max-w-sm text-sm/relaxed text-(--color-text-muted)">
            Start your first assessment to track your circular economy progress and get personalized
            recommendations.
          </p>
          <Button as={Link} to="/" variant="primary">
            <Plus size={16} /> Start Your First Assessment
          </Button>
        </div>
      );
    }

    // Filtered results returned empty
    if (assessments.length === 0) {
      return (
        <div className="mt-10 rounded-2xl border-4 border-dashed border-(--color-border-ui) bg-(--color-bg-card-light) p-12 text-center">
          <Ghost strokeWidth={1.2} size={44} className="mx-auto mb-5 text-(--color-text-muted)" />
          <h3 className="mb-2 font-display text-xl font-semibold text-(--color-text-primary)">
            No assessments found
          </h3>
          <p className="mx-auto mb-6 max-w-sm text-sm/relaxed text-(--color-text-muted)">
            Your current filters didn&apos;t match any assessments. Try selecting a different
            industry or adjusting your search.
          </p>
          <Button
            variant="ghost"
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
      );
    }

    // Normal case: show list and pagination
    return (
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
        />

        {/* PAGINATION */}
        <div className="mt-6 flex flex-col items-center justify-center gap-3 p-0">
          <p className="text-sm text-(--color-text-muted)">
            Showing{' '}
            <span className="inline-block text-center font-medium text-(--color-text-primary)">
              {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)}
            </span>{' '}
            of{' '}
            <span className="inline-block text-center font-medium text-(--color-text-primary)">
              {total}
            </span>{' '}
            results
          </p>

          <div className="mt-1 flex flex-col items-center justify-center gap-4 sm:mt-0 sm:flex-row sm:gap-6">
            <Pagination
              total={totalPages}
              page={page}
              onChange={setPage}
              className="justify-center"
              classnames={{
                wrapper: 'gap-0',
                item: 'font-mono text-sm',
                cursor: 'bg-(--color-accent) text-white border-(--color-accent)',
                prev: 'font-mono text-sm',
                next: 'font-mono text-sm',
              }}
            >
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={page === 1}
                    onPress={() => {
                      if (page > 1) {
                        prefetchAssessmentsPage(page - 1);
                        setPage(page - 1);
                      }
                    }}
                  >
                    <Pagination.PreviousIcon />
                    Previous
                  </Pagination.Previous>
                </Pagination.Item>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Pagination.Item key={p}>
                    <Pagination.Link
                      isActive={p === page}
                      onPress={() => {
                        prefetchAssessmentsPage(p);
                        setPage(p);
                      }}
                    >
                      {p}
                    </Pagination.Link>
                  </Pagination.Item>
                ))}
                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={page === totalPages}
                    onPress={() => {
                      if (page < totalPages) {
                        prefetchAssessmentsPage(page + 1);
                        setPage(page + 1);
                      }
                    }}
                  >
                    Next
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>

            <div className="flex items-center gap-2">
              <label className="text-sm whitespace-nowrap text-(--color-text-muted)">
                Per page:
              </label>
              <Select
                className="w-20"
                value={String(pageSize)}
                onChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}
                aria-label="Select page size"
                variant="bordered"
                size="sm"
                classNames={{
                  trigger:
                    'border-(--color-border-strong-alpha-80) bg-(--color-input-bg) text-(--color-text-primary) pr-10',
                  popover: 'bg-(--color-select-popover-bg) border-(--color-border-strong-alpha-80)',
                }}
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {pageSizeOptions.map((size) => (
                      <ListBox.Item key={size} id={String(size)} textValue={String(size)}>
                        {size}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          </div>
        </div>
      </>
    );
  };

  // ---------- Main render with early returns for stats loading/error ----------
  // Case 1: Stats are still loading
  if (isAssessmentStatsLoading) {
    return <div className="space-y-6">{renderInitialLoadPageSkeleton()}</div>;
  }

  // Case 2: Stats failed to load
  if (isAssessmentStatsError) {
    return (
      <div className="space-y-6">
        <ErrorDisplay
          variant="error"
          title="Error Loading Assessments"
          message={
            isAssessmentStatsError?.message ||
            'An error occurred while loading your assessments. Please try again.'
          }
          actions={[
            {
              label: 'Retry',
              icon: RotateCw,
              onPress: refetch,
              variant: 'teal',
            },
            {
              label: 'Back to Home',
              icon: Home,
              variant: 'ghost',
              as: Link,
              to: '/',
            },
          ]}
          showDefaultActions={false}
        />
      </div>
    );
  }

  // Case 3: Stats loaded successfully – render normal content
  return (
    <div className="mx-auto mt-6 max-w-4xl space-y-6">
      {/* Section heading */}
      {stats_totalAssessments > 0 && (
        <div className="flex items-center justify-between">
          <h2 className="pl-2 font-display text-xl font-semibold text-(--color-text-primary)">
            My Assessments
          </h2>
        </div>
      )}

      {/* Stats grid — only if totalAssessments > 0 */}
      {stats_totalAssessments > 0 && (
        <StatsGrid
          averageScore={averageScore}
          totalAssessments={stats_totalAssessments}
          highestScore={highestScore}
          lowestScore={lowestScore}
          topIndustries={topIndustries}
        />
      )}

      {/* Filter bar */}
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
          compareUrl={compareUrl}
        />
      )}

      {/* List content */}
      <div>{renderAssessmentListContent()}</div>

      {/* Back button */}
      <div className="flex justify-center pt-4 pb-2">
        <Button as={Link} to="/" variant="ghost">
          <MoveLeft size={16} /> Back to Home
        </Button>
      </div>
    </div>
  );
}
