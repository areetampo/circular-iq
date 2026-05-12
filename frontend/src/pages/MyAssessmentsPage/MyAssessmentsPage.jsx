import { Input, Label, ListBox, Pagination, Select, Skeleton, toast } from '@heroui/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronUp,
  Eraser,
  Home,
  MoveLeft,
  Plus,
  RotateCw,
  ScrollText,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';

import { Button, DetailsDisplay } from '@/components/common';
import { INDUSTRY_OPTIONS } from '@/constants/industries';
import { useGlobalDialog } from '@/contexts/DialogContext';
import { getAssessments, updateAssessment } from '@/features/assessments/api/assessmentApi';
import {
  useAssessments,
  useAssessmentStats,
  usePrefetchAssessment,
} from '@/features/assessments/hooks';
import { useAuth, useDebounce } from '@/hooks';
import { toTitleCase } from '@/lib/formatting';
import { getSessionId } from '@/utils/session';
import { parseSortBy } from '@/utils/sortUtils';

import { AssessmentList, AssessmentListSkeleton, FilterBar, StatsGrid } from './components';

export default function MyAssessmentsPage() {
  const { isAuthenticated, authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sessionId = useMemo(() => getSessionId(), []);
  const [selectedIds, setSelectedIds] = useState(new Map()); // Store id -> public_id mapping
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [selectedIndustries, setSelectedIndustries] = useState(['all']);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isRenaming, setIsRenaming] = useState(false);
  const [pageJumpValue, setPageJumpValue] = useState(null);
  const [isJumpInputFocused, setIsJumpInputFocused] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [previousFilterValues, setPreviousFilterValues] = useState({
    debouncedSearchTerm: '',
    selectedIndustryKey: 'all',
    debouncedSortBy: 'created_at_desc',
  });
  const { openDeleteAssessmentDialog, openRenameAssessmentDialog } = useGlobalDialog();

  // Available page size options
  const pageSizeOptions = useMemo(() => [5, 10, 20, 50, 100], []);

  // Persist list filters in URL so users can share filtered lists
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    logger.info('INIT URL READING DEBUG: Reading URL parameters');

    const industries = searchParams.get('industry');
    logger.info('INIT URL READING DEBUG: industries from URL:', industries);
    if (industries) setSelectedIndustries(industries.split(',').filter(Boolean));

    const p = Number(searchParams.get('page') || 1);
    logger.info('INIT URL READING DEBUG: page from URL:', p);
    if (!Number.isNaN(p) && p > 0) setPage(p);

    const ps = Number(searchParams.get('pageSize') || 10);
    logger.info('INIT URL READING DEBUG: pageSize from URL:', ps);
    if (!Number.isNaN(ps) && ps > 0 && pageSizeOptions.includes(ps)) setPageSize(ps);
    else if (!Number.isNaN(ps) && ps > 0) setPageSize(10); // Default to 10 for invalid sizes

    const s = searchParams.get('search');
    logger.info('INIT URL READING DEBUG: search from URL:', s);
    if (s) setSearchTerm(s);

    const sb = searchParams.get('sortBy');
    logger.info('INIT URL READING DEBUG: sortBy from URL:', sb);
    if (sb) setSortBy(sb);

    // Mark as initialized after reading URL parameters
    logger.info('INIT URL READING DEBUG: Setting isInitialized to true');

    setIsInitialized(true);

    // Initialize previous filter values with current values to prevent false positives
    setPreviousFilterValues({
      debouncedSearchTerm: s || '',
      selectedIndustryKey: industries
        ? industries.split(',').filter(Boolean).sort().join('|')
        : 'all',
      debouncedSortBy: sb || 'created_at_desc',
    });
  }, []);

  // sync params when debounced values change (only after initialization)
  useEffect(() => {
    // Don't sync URL parameters during initialization to prevent overriding initial values
    if (!isInitialized) {
      logger.info('URL SYNC DEBUG: Skipping - not initialized');
      return;
    }

    logger.info('URL SYNC DEBUG: Syncing URL params', {
      selectedIndustries,
      page,
      pageSize,
      searchTerm,
      sortBy,
    });

    const params = new URLSearchParams(searchParams);

    // Handle industry parameter
    if (
      !selectedIndustries ||
      (selectedIndustries.length === 1 && selectedIndustries[0] === 'all')
    ) {
      params.delete('industry');
    } else {
      params.set('industry', selectedIndustries.join(','));
    }

    // Always set page parameter (even if it's 1)
    if (page) params.set('page', String(page));
    else params.delete('page');

    // Handle pageSize parameter
    if (pageSize && pageSize !== 10) params.set('pageSize', String(pageSize));
    else params.delete('pageSize');

    // Handle search parameter
    if (searchTerm) params.set('search', searchTerm);
    else params.delete('search');

    // Handle sortBy parameter
    if (sortBy && sortBy !== 'created_at_desc') params.set('sortBy', sortBy);
    else params.delete('sortBy');

    logger.info('URL SYNC DEBUG: Setting URL params:', params.toString());
    setSearchParams(params, { replace: true });
  }, [selectedIndustries, page, pageSize, searchTerm, sortBy, isInitialized]);

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

  // Show authentication message for unauthenticated users
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="flex flex-col gap-6">
        <DetailsDisplay
          variant="info"
          icon={ScrollText}
          title="Sign in to view your assessments"
          description="You can create an account or sign in to access your assessment history. You also get unlimited evaluations by doing so!"
          showDefaultActions={false}
          actions={[
            {
              label: 'Sign In',
              icon: Home,
              variant: 'teal',
              as: Link,
              to: '/auth?view=login',
              state: { from: location },
            },
          ]}
        />
      </div>
    );
  }

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
    logger.info('PAGE RESET DEBUG:', {
      isInitialized,
      page,
      debouncedSearchTerm,
      selectedIndustryKey,
      debouncedSortBy,
      previousFilterValues,
    });

    if (!isInitialized) {
      logger.info('PAGE RESET DEBUG: Skipping - not initialized');
      return;
    }

    // Check if filters actually changed from previous values
    const filtersChanged =
      previousFilterValues.debouncedSearchTerm !== debouncedSearchTerm ||
      previousFilterValues.selectedIndustryKey !== selectedIndustryKey ||
      previousFilterValues.debouncedSortBy !== debouncedSortBy;

    logger.info('PAGE RESET DEBUG: Filters changed?', filtersChanged);

    if (filtersChanged && page > 1) {
      logger.info('PAGE RESET DEBUG: Resetting page from', page, 'to 1');
      setPage(1);
      // Update previous values after reset
      setPreviousFilterValues({
        debouncedSearchTerm,
        selectedIndustryKey,
        debouncedSortBy,
      });
    } else {
      logger.info('PAGE RESET DEBUG: Not resetting - filters unchanged or page is', page);
      // Still update previous values to track current state
      setPreviousFilterValues({
        debouncedSearchTerm,
        selectedIndustryKey,
        debouncedSortBy,
      });
    }
  }, [debouncedSearchTerm, selectedIndustryKey, debouncedSortBy, isInitialized]);

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
        retry: false, // Don't retry on error to prevent repeated toasts
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

  const handleToggleSelect = useCallback((id, publicId) => {
    setSelectedIds((prev) => {
      const newSelected = new Map(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.set(id, publicId);
      }
      return newSelected;
    });
  }, []);

  // Memoized compare URL for Link component
  const compareUrl = useMemo(() => {
    if (selectedIds.size !== 2) return null;

    const publicIds = Array.from(selectedIds.values());

    if (publicIds.length !== 2) return null;
    return `/assessments/compare?id1=${publicIds[0]}&id2=${publicIds[1]}`;
  }, [selectedIds]);

  const totalPages = useMemo(() => Math.ceil(total / pageSize), [total, pageSize]);

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
              className="rounded-2xl border-2 border-(--color-border-strong-alpha-80) bg-(--color-bg-card-light) p-5 pb-14"
            >
              <Skeleton animationType="shimmer" className="mb-3 h-3 w-20" />
              <Skeleton animationType="shimmer" className="mb-2 h-8 w-16" />
              <Skeleton animationType="shimmer" className="h-3 w-24" />
            </div>
          ))}
        </div>

        {/* FilterBar Skeleton */}
        <div className="my-6 space-y-3">
          {/* Search input skeleton */}
          <div className="relative">
            <div className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-(--color-text-muted)">
              <Skeleton animationType="shimmer" className="size-4" />
            </div>
            <Skeleton animationType="shimmer" className="h-9 w-full rounded-xl pr-4 pl-9" />
          </div>

          {/* Sort + Button row skeleton */}
          <div className="flex items-center justify-between gap-3">
            {/* Sort select skeleton */}
            <div className="max-w-50 flex-1">
              <Skeleton animationType="shimmer" className="h-9 w-full pr-10" />
            </div>

            {/* 'to share page', 'to compare page', 'compare selected assessments' buttons skeleton */}
            <div className="flex items-center gap-2">
              <Skeleton animationType="shimmer" className="h-9 w-40" />
              <Skeleton animationType="shimmer" className="h-9 w-40" />
              <Skeleton animationType="shimmer" className="h-9 w-40" />
            </div>
          </div>

          {/* Industry filter chips skeleton */}
          <div className="my-1.5 flex flex-wrap gap-2">
            {Array(12)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} animationType="shimmer" className="ro h-6 w-20" />
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
          const next = new Map(prev);
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

  const handleRenameAssessment = useCallback(
    (id) => {
      const assessment = assessments.find((a) => a.id === id);

      // Create a handler specific to this assessment that captures the id
      const handleRenameForThisAssessment = async (newTitle) => {
        logger.log('handleRenameForThisAssessment called:', { id, newTitle });

        if (!id) {
          toast.danger('No assessment selected for rename', { timeout: 3500 });
          throw new Error('No assessment selected for rename');
        }

        setIsRenaming(true);
        try {
          // Prevent duplicate names with proactive check like ResultsPage
          try {
            logger.log('Checking for duplicates:', { newTitle, id });
            const existing = await getAssessments({ search: newTitle, pageSize: 100 });
            logger.log('Existing assessments found:', existing?.assessments?.length || 0);

            const dup = Array.isArray(existing?.assessments)
              ? existing.assessments.find(
                  (a) =>
                    a.id !== id &&
                    a.title &&
                    a.title.trim().toLowerCase() === String(newTitle).trim().toLowerCase(),
                )
              : null;

            logger.log('Duplicate found:', dup ? { id: dup.id, title: dup.title } : null);

            if (dup) {
              logger.log('Throwing duplicate error');
              throw new Error('Name already exists');
            }
          } catch (checkErr) {
            if (checkErr.message === 'Name already exists') {
              logger.log('Re-throwing duplicate error');
              throw checkErr;
            }
            // If duplicate check fails, log warning but continue with rename
            logger.warn('Duplicate name check failed, continuing with rename:', checkErr?.message);
          }

          const detailCacheKey = ['assessment', id];

          queryClient.setQueriesData({ queryKey: ['assessments'] }, (old) => {
            if (!old || !old.assessments) return old;
            return {
              ...old,
              assessments: old.assessments.map((assessment) =>
                assessment.id === id ? { ...assessment, title: newTitle } : assessment,
              ),
            };
          });

          queryClient.setQueryData(detailCacheKey, (old) => {
            if (!old) return old;
            const detail = old.assessment ? old.assessment : old;
            const updated = { ...detail, title: newTitle };
            return old.assessment ? { ...old, assessment: updated } : updated;
          });

          const result = await updateAssessment(id, { title: newTitle });
          toast.success('Assessment renamed successfully', { timeout: 3000 });
          return result;
        } catch (err) {
          // Revert optimistic updates on any error
          const previousAssessments = queryClient.getQueriesData({ queryKey: ['assessments'] });
          const detailCacheKey = ['assessment', id];
          const previousAssessment = queryClient.getQueryData(detailCacheKey);

          previousAssessments.forEach(([key, data]) => {
            queryClient.setQueryData(key, data);
          });
          queryClient.setQueryData(detailCacheKey, previousAssessment);

          // Only show toast for non-duplicate errors
          const isDuplicateError =
            err.message === 'Name already exists' ||
            err.message === 'name already exists' ||
            err.message.includes('name already exists');

          if (!isDuplicateError) {
            const errorMsg = err?.message || 'Please try again.';
            toast.danger(`Rename failed: ${errorMsg}`, { timeout: 4000 });
          }
          throw err;
        } finally {
          setIsRenaming(false);
        }
      };

      openRenameAssessmentDialog({
        defaultName: assessment?.title || '',
        onRename: handleRenameForThisAssessment,
        isLoading: isRenaming,
      });
    },
    [assessments, openRenameAssessmentDialog, isRenaming, queryClient],
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

  const handlePageJump = useCallback(() => {
    const pageNumber = Number(pageJumpValue);
    if (pageNumber && pageNumber >= 1 && pageNumber <= totalPages && !Number.isNaN(pageNumber)) {
      prefetchAssessmentsPage(pageNumber);
      setPage(pageNumber);
      setPageJumpValue(null);
      setIsJumpInputFocused(false);
    } else {
      // Don't show toast for invalid range, just silently handle it
      if (pageNumber && pageNumber > totalPages) {
        // If user entered a page beyond total, jump to last page
        prefetchAssessmentsPage(totalPages);
        setPage(totalPages);
        setPageJumpValue(null);
        setIsJumpInputFocused(false);
      } else {
        toast.danger(`Please enter a valid page number between 1 and ${totalPages}`, {
          timeout: 3000,
        });
      }
    }
  }, [pageJumpValue, totalPages, prefetchAssessmentsPage]);

  // Use debounced page jump value for automatic fetching
  const debouncedPageJumpValue = useDebounce(pageJumpValue, 500);

  // Auto-jump when debounced value changes
  useEffect(() => {
    if (debouncedPageJumpValue && isJumpInputFocused) {
      const pageNumber = Number(debouncedPageJumpValue);
      if (pageNumber >= 1 && pageNumber <= totalPages && !Number.isNaN(pageNumber)) {
        prefetchAssessmentsPage(pageNumber);
        setPage(pageNumber);
      }
    }
  }, [debouncedPageJumpValue, isJumpInputFocused, totalPages, prefetchAssessmentsPage]);

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
        <DetailsDisplay
          variant="error"
          title="Error Loading Assessments"
          description={
            isAssessmentsError.message ||
            'An error occurred while loading your assessments. Please try again.'
          }
          actions={[
            {
              label: 'Retry',
              icon: RotateCw,
              variant: 'teal',
              onPress: refetch,
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
        <DetailsDisplay
          variant="neutral"
          title="No assessments yet"
          description="Start your first assessment to track your circular economy progress and get personalized recommendations."
          showDefaultActions={false}
          actions={[
            {
              label: 'Start Your First Assessment',
              icon: Plus,
              variant: 'teal',
              as: HashLink,
              to: '/#ce-assessment-form',
              smooth: true,
            },
          ]}
        />
      );
    }

    // Filtered results returned empty
    if (assessments.length === 0) {
      return (
        <DetailsDisplay
          variant="neutral"
          title="No assessments found"
          description="Your current filters didn't match any assessments. Try selecting a different
            industry or adjusting your search."
          showDefaultActions={false}
          actions={[
            {
              label: 'Clear Filters',
              icon: Eraser,
              variant: 'ghost',
              onPress: () => {
                setSearchTerm('');
                setSelectedIndustries(['all']);
                setSortBy('created_at_desc');
                setPage(1);
              },
            },
          ]}
        />
      );
    }

    // Normal case: show list and pagination
    return (
      <>
        {/* PAGINATION */}
        <div className="my-3 flex flex-col items-center justify-center gap-1">
          <p className="text-sm text-(--color-text-muted)">
            Showing{' '}
            <span className="inline-block text-center font-medium text-(--color-text-primary)">
              {(page - 1) * pageSize + 1}
              <span className="mx-0.5">-</span>
              {Math.min(page * pageSize, total)}
            </span>{' '}
            of{' '}
            <span className="inline-block text-center font-medium text-(--color-text-primary)">
              {total}
            </span>{' '}
            results
          </p>

          <div className="-mr-2 flex items-center justify-center gap-6">
            <Pagination
              total={totalPages}
              page={page}
              onChange={setPage}
              className="justify-center"
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
                {getPageNumbers().map((p, i) =>
                  p === 'ellipsis' ? (
                    <Pagination.Item key={`ellipsis-${i}`}>
                      <Pagination.Ellipsis />
                    </Pagination.Item>
                  ) : (
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
                  ),
                )}
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

            {totalPages > 7 && (
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="assessments-page-pagination-jump-to"
                  className="text-sm font-normal whitespace-nowrap text-(--color-text-muted)"
                >
                  Jump to:
                </Label>
                <div className="relative flex items-center">
                  <Input
                    id="assessments-page-pagination-jump-to"
                    className="number-input-field w-16"
                    type="number"
                    min="1"
                    max={totalPages}
                    value={isJumpInputFocused ? pageJumpValue : pageJumpValue || page}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setPageJumpValue(newValue);
                    }}
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
                        const newValue = Math.min(Number(pageJumpValue || page) + 1, totalPages);
                        setPageJumpValue(newValue);

                        // Automatically fetch the displayed page
                        if (newValue >= 1 && newValue <= totalPages) {
                          prefetchAssessmentsPage(newValue);
                          setPage(newValue);
                        }
                      }}
                    >
                      <ChevronUp size={16} strokeWidth={2} />
                    </button>
                    <button
                      tabIndex={-1}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const newValue = Math.max(Number(pageJumpValue || page) - 1, 1);
                        setPageJumpValue(newValue);

                        // Automatically fetch the displayed page
                        if (newValue >= 1 && newValue <= totalPages) {
                          prefetchAssessmentsPage(newValue);
                          setPage(newValue);
                        }
                      }}
                    >
                      <ChevronDown size={16} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Label
                htmlFor="assessments-page-pagination-total-assessments-display-per-page"
                className="text-sm font-normal whitespace-nowrap text-(--color-text-muted)"
              >
                Per page:
              </Label>
              <Select
                id="assessments-page-pagination-total-assessments-display-per-page"
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
        <DetailsDisplay
          variant="error"
          title="Error Loading Assessments"
          description={
            isAssessmentStatsError?.message ||
            'An error occurred while loading your assessments. Please try again.'
          }
          actions={[
            {
              label: 'Retry',
              icon: RotateCw,
              variant: 'teal',
              onPress: refetch,
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
      {/* {stats_totalAssessments > 0 && (
        <div className="flex items-center justify-between">
          <h2 className="pl-2 font-display text-xl font-semibold text-(--color-text-primary)">
            My Assessments
          </h2>
        </div>
      )} */}

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
        <Button variant="ghost" as={Link} to="/" icon={MoveLeft}>
          Back to Home
        </Button>
      </div>
    </div>
  );
}
