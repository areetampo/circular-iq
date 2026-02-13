import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import PropTypes from 'prop-types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getSessionId } from '@/utils/session';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { formatTimestamp, formatTruncatedList } from '@/lib/formatting';
import { INDUSTRY_OPTIONS } from '@/constants/industries';
import { getIndustryTheme } from '@/constants/industryThemes';
import {
  getAssessments,
  useAssessments,
  usePrefetchAssessment,
  useAssessmentStats,
} from '@/features/assessments';
import { parseSortBy } from './sortUtils';
import { updateAssessment } from '@/features/assessments/api/assessmentApi';
import { cn } from '@/utils/cn';
import {
  Card,
  Input,
  Select,
  Label,
  ListBox,
  Checkbox,
  Skeleton,
  Switch,
  Separator,
  Popover,
  Button as HeroButton,
  Chip,
} from '@heroui/react';
import Pagination from '@mui/material/Pagination';
import PaginationItem from '@mui/material/PaginationItem';
import { Button, ErrorDisplay } from '@/components/common';
import { DeleteAssessmentDialog, RenameAssessmentDialog } from '@/components/dialogs';
import {
  ArrowLeft,
  Search,
  Eye,
  GitCompare,
  Plus,
  Award,
  Building,
  Ghost,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Globe,
  Link2,
  Copy,
  Clock,
} from 'lucide-react';

// Memoized AssessmentCard Component - Beautiful Redesign with VISIBLE Checkbox
const AssessmentCard = React.memo(function AssessmentCard({
  assessment,
  isSelected,
  onToggleSelect,
  onView,
  onRename,
  onDelete,
  onPrefetch,
  onTogglePublic,
  onToggleBenchmarks,
  onCopyShareLink,
}) {
  // Status mapping with icons
  const getStatus = (score) => {
    if (score >= 80)
      return {
        text: 'Excellent',
        color: 'success',
        icon: CheckCircle2,
      };
    if (score >= 60)
      return {
        text: 'Good',
        color: 'accent',
        icon: CheckCircle2,
      };
    if (score >= 40)
      return {
        text: 'Needs Work',
        color: 'warning',
        icon: Clock,
      };
    return {
      text: 'Critical',
      color: 'danger',
      icon: AlertCircle,
    };
  };

  const assessmentCardButtons = [
    {
      label: 'View',
      icon: Eye,
      variant: 'teal',
      onClick: () => onView(assessment.id),
      className: '',
    },
    {
      label: 'Rename',
      icon: Edit,
      variant: 'info',
      onClick: () => onRename(assessment.id),
      className: '',
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'danger',
      onClick: () => onDelete(assessment.id),
      className: '',
    },
  ];

  const status = getStatus(assessment.overall_score);
  const StatusIcon = status.icon;

  return (
    <Card
      className={cn(
        'group relative overflow-hidden bg-slate-50 transition-all duration-200 ease-out ',
        isSelected ? 'shadow-lg shadow-blue-100' : 'hover:shadow-lg',
      )}
      onMouseEnter={() => onPrefetch(assessment.id)}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/0 via-transparent to-slate-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative p-0 xxs:p-3 space-y-5">
        {/* Header Section */}
        <div className="flex items-start gap-4">
          {/* Checkbox - Clean round style */}
          <div className="pt-0.5 shrink-0">
            <Checkbox
              isSelected={isSelected}
              onChange={() => onToggleSelect(assessment.id)}
              size="lg"
              color="primary"
              className="cursor-pointer"
            >
              <Checkbox.Control className="size-6 rounded-full before:rounded-full border">
                <Checkbox.Indicator />
              </Checkbox.Control>
            </Checkbox>
          </div>

          {/* Content Section */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Title with better typography */}
            <h3
              className="font-semibold text-xl text-slate-900 leading-tight truncate group-hover:text-blue-700 transition-colors duration-200 ml-0.5"
              title={assessment.title}
            >
              {assessment.title || 'Untitled Assessment'}
            </h3>

            {/* Metadata chips with timestamp - responsive layout */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Industry Badge */}
              <Chip variant="secondary" color="default" size="lg">
                <Building className="w-3.5 h-3.5" />
                <Chip.Label className="uppercase">
                  {(assessment.industry || 'General').replace(/_/g, ' ')}
                </Chip.Label>
              </Chip>

              {/* Score Badge - Prominent */}
              <Chip
                variant="primary"
                color={
                  assessment.overall_score >= 80
                    ? 'success'
                    : assessment.overall_score >= 60
                      ? 'accent'
                      : assessment.overall_score >= 40
                        ? 'warning'
                        : 'danger'
                }
                size="lg"
              >
                <Chip.Label className="text-white">{assessment.overall_score}%</Chip.Label>
              </Chip>

              {/* Status Badge */}
              <Chip variant="soft" color={status.color} size="lg">
                <StatusIcon className="w-3.5 h-3.5" />
                <Chip.Label>{status.text}</Chip.Label>
              </Chip>

              {/* Timestamp - Inline on desktop, wraps on mobile */}
              <div className="flex items-center gap-1.5 text-sm text-slate-500 ml-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="italic">Created {formatTimestamp(assessment.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Prominent and well-spaced */}
        <div className="flex flex-wrap gap-2 sm:py-2 px-4">
          {assessmentCardButtons.map((btn) => {
            const Icon = btn.icon;
            return (
              <Button
                key={btn.label}
                size="md"
                variant={btn.variant}
                onPress={btn.onClick}
                className={cn('flex-1 sm:flex-none', btn.className)}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium hidden xxs:inline">{btn.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Toggles Section - Enhanced visual design */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4">
          {/* Global Benchmarks Toggle */}
          <Switch
            isSelected={assessment.contribute_to_global_benchmarks || false}
            onChange={() => onToggleBenchmarks(assessment.id)}
            size="md"
            color="primary"
            className="shrink-0"
          >
            <div
              className={cn(
                'w-full group/toggle flex items-center justify-between gap-3 p-2 xxs:p-4 rounded-xl border transition-all duration-300 flex-col xxs:flex-row',
                assessment.contribute_to_global_benchmarks
                  ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:border-blue-200 hover:bg-blue-50/50',
              )}
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div
                  className={cn(
                    'p-2 rounded-lg transition-all duration-300',

                    assessment.contribute_to_global_benchmarks
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-slate-200 text-slate-600 group-hover/toggle:bg-blue-100 group-hover/toggle:text-blue-600',
                  )}
                >
                  <Globe className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900">Global Benchmarks</div>
                  <div className="text-xs text-slate-600 text-wrap">Share anonymously</div>
                </div>
              </div>
              <Switch.Control className="transition-all duration-300">
                <Switch.Thumb />
              </Switch.Control>
            </div>
          </Switch>

          {/* Public Access Toggle */}
          <Switch
            isSelected={assessment.is_public || false}
            onChange={() => onTogglePublic(assessment.id)}
            size="md"
            color="success"
            className="transition-all duration-300"
          >
            <div
              className={cn(
                'w-full group/toggle flex items-center justify-between gap-3 p-2 xxs:p-4 rounded-xl border transition-all duration-300 flex-col xxs:flex-row',
                assessment.is_public
                  ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300 shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50',
              )}
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div
                  className={cn(
                    'p-2 rounded-lg transition-all duration-300',
                    assessment.is_public
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-slate-200 text-slate-600 group-hover/toggle:bg-emerald-100 group-hover/toggle:text-emerald-600',
                  )}
                >
                  <Link2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900">Public Access</div>
                  <div className="text-xs text-slate-600 text-wrap">Share via link</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Button
                  onClick={() => onCopyShareLink(assessment.id, assessment.public_id)}
                  disabled={!assessment.is_public || !assessment.public_id}
                  className={`
                  rounded-lg transition-all duration-200
                  ${
                    assessment.is_public && assessment.public_id
                      ? 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200 hover:scale-110 cursor-pointer shadow-sm'
                      : 'text-slate-300 bg-slate-100 cursor-not-allowed opacity-50'
                  }
                `}
                  title={
                    assessment.is_public && assessment.public_id
                      ? 'Copy share link'
                      : 'Enable public access first'
                  }
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Switch>
        </div>
      </div>
    </Card>
  );
});

AssessmentCard.propTypes = {
  assessment: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    industry: PropTypes.string,
    overall_score: PropTypes.number,
    is_public: PropTypes.bool,
    public_id: PropTypes.string,
    contribute_to_global_benchmarks: PropTypes.bool,
    created_at: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.instanceOf(Date),
    ]),
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  onToggleSelect: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  onRename: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onPrefetch: PropTypes.func.isRequired,
  onTogglePublic: PropTypes.func.isRequired,
  onToggleBenchmarks: PropTypes.func.isRequired,
  onCopyShareLink: PropTypes.func.isRequired,
};

// Memoized AssessmentCardSkeleton - Matches the actual Assessment Card structure
const AssessmentCardSkeleton = React.memo(function AssessmentCardSkeleton() {
  return (
    <Card className="group relative overflow-hidden bg-white">
      <div className="relative p-3 space-y-5">
        {/* Header Section */}
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <div className="pt-0.5 shrink-0">
            <Skeleton animationType="shimmer" className="w-6 h-6 rounded-full" />
          </div>

          {/* Content Section */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Title */}
            <Skeleton animationType="shimmer" className="h-6 w-3/4 rounded ml-0.5" />

            {/* Metadata chips row */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Industry Badge */}
              <Skeleton animationType="shimmer" className="h-7 w-24 rounded-full" />

              {/* Score Badge */}
              <Skeleton animationType="shimmer" className="h-7 w-16 rounded-full" />

              {/* Status Badge */}
              <Skeleton animationType="shimmer" className="h-7 w-28 rounded-full" />

              {/* Timestamp */}
              <Skeleton animationType="shimmer" className="h-4 w-32 rounded ml-1" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 sm:py-2 px-4">
          <Skeleton
            animationType="shimmer"
            className="h-9 w-24 rounded-lg flex-1 sm:flex-none min-w-[100px]"
          />
          <Skeleton
            animationType="shimmer"
            className="h-9 w-24 rounded-lg flex-1 sm:flex-none min-w-[100px]"
          />
          <Skeleton
            animationType="shimmer"
            className="h-9 w-24 rounded-lg flex-1 sm:flex-none min-w-[100px]"
          />
        </div>

        {/* Toggles Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4">
          {/* Global Benchmarks Toggle */}
          <div className="flex items-center justify-between gap-3 p-2 xxs:p-4 rounded-xl border bg-slate-50 border-slate-200 flex-col xxs:flex-row">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Skeleton animationType="shimmer" className="w-8 h-8 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0 space-y-1">
                <Skeleton animationType="shimmer" className="h-3.5 w-32 rounded" />
                <Skeleton animationType="shimmer" className="h-3 w-24 rounded" />
              </div>
            </div>
            <Skeleton animationType="shimmer" className="w-11 h-6 rounded-full shrink-0" />
          </div>

          {/* Public Access Toggle */}
          <div className="flex items-center justify-between gap-3 p-2 xxs:p-4 rounded-xl border bg-slate-50 border-slate-200 flex-col xxs:flex-row">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Skeleton animationType="shimmer" className="w-8 h-8 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0 space-y-1">
                <Skeleton animationType="shimmer" className="h-3.5 w-28 rounded" />
                <Skeleton animationType="shimmer" className="h-3 w-20 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Skeleton animationType="shimmer" className="w-11 h-6 rounded-full" />
              <Skeleton animationType="shimmer" className="w-8 h-8 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
});

// Memoized Assessment List Component - Beautiful spacing
const AssessmentList = React.memo(function AssessmentList({
  assessments,
  selectedIds,
  onToggleSelect,
  onView,
  onRename,
  onDelete,
  onPrefetch,
  onTogglePublic,
  onToggleBenchmarks,
  onCopyShareLink,
}) {
  return (
    <>
      {assessments.map((assessment) => {
        return (
          <AssessmentCard
            key={assessment.id}
            assessment={assessment}
            isSelected={selectedIds.has(assessment.id)}
            onToggleSelect={onToggleSelect}
            onView={onView}
            onRename={onRename}
            onDelete={onDelete}
            onPrefetch={onPrefetch}
            onTogglePublic={onTogglePublic}
            onToggleBenchmarks={onToggleBenchmarks}
            onCopyShareLink={onCopyShareLink}
          />
        );
      })}
    </>
  );
});

AssessmentList.propTypes = {
  assessments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string,
      industry: PropTypes.string,
      overall_score: PropTypes.number,
      created_at: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.instanceOf(Date),
      ]),
    }),
  ).isRequired,
  selectedIds: PropTypes.instanceOf(Set).isRequired,
  onToggleSelect: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  onRename: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onPrefetch: PropTypes.func.isRequired,
  onTogglePublic: PropTypes.func.isRequired,
  onToggleBenchmarks: PropTypes.func.isRequired,
  onCopyShareLink: PropTypes.func.isRequired,
};

// Memoized AssessmentListSkeleton - Matches the actual Assessment List structure
const AssessmentListSkeleton = React.memo(function AssessmentListSkeleton() {
  return Array.from({ length: 5 }).map((_, idx) => <AssessmentCardSkeleton key={idx} />);
});

// Memoized Industry Filter Chip Component - Optimized with industry-specific theming
const IndustryFilterChip = React.memo(function IndustryFilterChip({
  industry,
  isSelected,
  onToggle,
  label,
}) {
  const theme = getIndustryTheme(industry);

  return (
    <Chip
      onClick={() => onToggle(industry)}
      className={cn(
        'cursor-pointer select-none transition-colors duration-200 ease-in-out',
        'border font-medium',
        isSelected
          ? `${theme.selectedBg} ${theme.selectedText} ${theme.selectedBorder}`
          : `bg-white ${theme.unselectedText} ${theme.unselectedBorder}`,
        !isSelected && theme.hoverClasses,
      )}
      aria-pressed={isSelected}
    >
      <Chip.Label className="px-1">{label}</Chip.Label>
    </Chip>
  );
});

IndustryFilterChip.propTypes = {
  industry: PropTypes.string.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
};

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
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, assessmentId: null });
  const [renameDialog, setRenameDialog] = useState({ isOpen: false, assessmentId: null });
  const [isRenaming, setIsRenaming] = useState(false);
  const { addToast } = useToast();

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
      addToast('Please select exactly 2 assessments to compare', 'info');
      return;
    }

    const ids = Array.from(selectedIds);
    navigate(`/assessments/compare?id1=${ids[0]}&id2=${ids[1]}`);
  }, [selectedIds, addToast, navigate]);

  const handleViewDetail = useCallback(
    (id) => {
      navigate(`/assessments/${id}`);
    },
    [navigate],
  );

  const handleRenameAssessment = useCallback((id) => {
    setRenameDialog({ isOpen: true, assessmentId: id });
  }, []);

  const handleRenameDialogChange = useCallback((open) => {
    if (!open) {
      setRenameDialog({ isOpen: false, assessmentId: null });
    }
  }, []);

  const handleDeleteAssessment = useCallback((id) => {
    console.log('[HANDLE_DELETE_ASSESSMENT]', { id });
    setDeleteDialog({ isOpen: true, assessmentId: id });
  }, []);

  const handleDeleteDialogChange = useCallback((open) => {
    console.log('[HANDLE_DELETE_DIALOG_CHANGE]', { open });
    if (!open) {
      console.log('[CLOSING_AND_CLEARING_DELETE_DIALOG]');
      setDeleteDialog({ isOpen: false, assessmentId: null });
    }
  }, []);

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const proceedDelete = useCallback(
    async (id) => {
      if (!id) {
        addToast('No assessment selected for deletion', 'error');
        throw new Error('No assessment selected for deletion');
      }

      try {
        console.log('[DELETE_START]', { id });
        const result = await removeAssessmentAsync(id);
        console.log('[DELETE_SUCCESS]', { id, result });

        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        addToast('Assessment deleted successfully', 'success');

        // Only close dialog on success - let ConfirmDialog handle this
        return result;
      } catch (err) {
        console.error('[DELETE_ERROR]', { id, error: err.message, fullError: err });
        const errorMsg = err?.message || 'Please try again.';
        addToast(`Delete failed: ${errorMsg}`, 'error');
        // THROW the error so ConfirmDialog knows not to close the dialog
        throw err;
      }
    },
    [removeAssessmentAsync, addToast],
  );

  const handleConfirmDelete = useCallback(() => {
    return proceedDelete(deleteDialog.assessmentId);
  }, [proceedDelete, deleteDialog.assessmentId]);

  const handleConfirmRename = useCallback(
    async (newTitle) => {
      if (!renameDialog.assessmentId) {
        addToast('No assessment selected for rename', 'error');
        throw new Error('No assessment selected for rename');
      }

      // Duplicate name check among user's assessments
      if (
        assessments.some(
          (a) =>
            a.id !== renameDialog.assessmentId &&
            a.title &&
            a.title.trim().toLowerCase() === String(newTitle).trim().toLowerCase(),
        )
      ) {
        const msg = 'You already have an assessment with that name';
        addToast(msg, 'error');
        throw new Error(msg);
      }

      const detailCacheKey = ['assessment', renameDialog.assessmentId];
      const previousAssessments = queryClient.getQueriesData({ queryKey: ['assessments'] });
      const previousAssessment = queryClient.getQueryData(detailCacheKey);

      queryClient.setQueriesData({ queryKey: ['assessments'] }, (old) => {
        if (!old || !old.assessments) return old;
        return {
          ...old,
          assessments: old.assessments.map((assessment) =>
            assessment.id === renameDialog.assessmentId
              ? { ...assessment, title: newTitle }
              : assessment,
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
        const result = await updateAssessment(renameDialog.assessmentId, { title: newTitle });
        addToast('Assessment renamed successfully', 'success');
        return result;
      } catch (err) {
        previousAssessments.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
        queryClient.setQueryData(detailCacheKey, previousAssessment);
        const errorMsg = err?.message || 'Please try again.';
        addToast(`Rename failed: ${errorMsg}`, 'error');
        throw err;
      } finally {
        setIsRenaming(false);
      }
    },
    [renameDialog.assessmentId, addToast, queryClient],
  );

  const handleTogglePublic = useCallback(
    async (id) => {
      const assessment = assessments.find((a) => a.id === id);
      if (!assessment) return;

      const newValue = !assessment.is_public;

      try {
        await updateAssessment(id, { is_public: newValue });
        queryClient.invalidateQueries({ queryKey: ['assessments'] });
        addToast(newValue ? 'Assessment is now public' : 'Assessment is now private', 'success');
      } catch (error) {
        console.error('Error updating public status:', error);
        addToast(`Failed to update sharing settings: ${error}`, 'error');
      }
    },
    [assessments, addToast, queryClient],
  );

  const handleToggleBenchmarks = useCallback(
    async (id) => {
      const assessment = assessments.find((a) => a.id === id);
      if (!assessment) return;

      const newValue = !assessment.contribute_to_global_benchmarks;

      try {
        await updateAssessment(id, { contribute_to_global_benchmarks: newValue });
        queryClient.invalidateQueries({ queryKey: ['assessments'] });
        addToast(
          newValue
            ? 'Now contributing to global benchmarks'
            : 'No longer contributing to global benchmarks',
          'success',
        );
      } catch (error) {
        console.error('Error updating benchmark settings:', error);
        addToast(`Failed to update benchmark settings: ${error}`, 'error');
      }
    },
    [assessments, addToast, queryClient],
  );

  const handleCopyShareLink = useCallback(
    async (id, publicId) => {
      if (!publicId) {
        addToast('Share link not available', 'error');
        return;
      }

      const shareUrl = `${window.location.origin}/assessments/share/${publicId}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        addToast('Share link copied to clipboard', 'success');
      } catch (error) {
        console.error('Error copying share link:', error);
        addToast(`Failed to copy share link: ${error}`, 'error');
      }
    },
    [addToast],
  );

  const confirmDeleteAssessment = useMemo(
    () => assessments.find((a) => a.id === deleteDialog.assessmentId),
    [assessments, deleteDialog.assessmentId],
  );

  const confirmRenameAssessment = useMemo(
    () => assessments.find((a) => a.id === renameDialog.assessmentId),
    [assessments, renameDialog.assessmentId],
  );

  const totalPages = useMemo(() => Math.ceil(total / pageSize), [total, pageSize]);

  // Render skeleton cards for initial load - Beautiful spacing
  const renderInitialLoadPageSkeleton = useCallback(() => {
    // SummaryCardSkeleton - Matches the actual Summary Card structure
    function SummaryCardSkeleton() {
      return (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/60 rounded-2xl px-6 py-5 shadow-sm">
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
        <Card className="border-2 border-slate-200 shadow-sm bg-white">
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-5 border-t-2 border-slate-100">
              <Skeleton animationType="shimmer" className="h-4 w-64 rounded" />
              <Skeleton animationType="shimmer" className="h-10 w-44 rounded-lg" />
            </div>
          </div>
        </Card>
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
              variant: 'neutral-soft',
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
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/60 rounded-2xl px-6 py-5 shadow-sm hover:shadow-md hover:border-emerald-300/60 transition-all duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">
                      Average Score
                    </p>
                    <div className="flex items-baseline gap-3">
                      <h3 className="text-4xl font-black text-emerald-900">{averageScore}</h3>
                    </div>
                    <p className="text-sm font-medium text-emerald-700/80 mt-2">
                      Across {stats_totalAssessments} assessment
                      {stats_totalAssessments !== 1 ? 's' : ''}
                    </p>
                    <div className="flex items-center gap-6 mt-3">
                      <div>
                        <p className="text-xs text-emerald-600/75 font-medium">High</p>
                        <p className="text-lg font-bold text-emerald-900">{highestScore}</p>
                      </div>
                      <Separator orientation="vertical" className="bg-emerald-400/50" />
                      <div>
                        <p className="text-xs text-emerald-600/75 font-medium">Low</p>
                        <p className="text-lg font-bold text-emerald-900">{lowestScore}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-100/80 shrink-0">
                    <Award className="w-6 h-6 text-emerald-700" />
                  </div>
                </div>
              </div>
              {/* Primary Focus Card */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200/60 rounded-2xl px-6 py-5 shadow-sm hover:shadow-md hover:border-indigo-300/60 transition-all duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-2">
                      Primary Focus
                    </p>
                    <h3 className="text-2xl font-bold text-indigo-900 leading-tight">
                      {topIndustries && topIndustries.length > 0
                        ? (() => {
                            const { display } = formatTruncatedList(topIndustries, 2);
                            const hasMore = topIndustries.length > 2;
                            return hasMore ? `${display}...` : display;
                          })()
                        : '—'}
                    </h3>
                    {topIndustries && topIndustries.length > 2 && (
                      <Popover>
                        <Popover.Trigger>
                          <button
                            type="button"
                            className="text-indigo-700 bg-indigo-100/60 hover:bg-indigo-200/60 font-semibold mt-3 px-3 py-1 rounded-sm text-sm"
                          >
                            View All
                          </button>
                        </Popover.Trigger>
                        <Popover.Content className="max-w-xs">
                          <Popover.Dialog>
                            <Popover.Heading className="text-indigo-900 font-bold">
                              All Industries
                            </Popover.Heading>
                            <div className="mt-3 space-y-1.5">
                              {topIndustries.map((industry, idx) => (
                                <div key={idx} className="text-sm text-indigo-700">
                                  •{' '}
                                  {industry.industry
                                    .replace(/_/g, ' ')
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </div>
                              ))}
                            </div>
                          </Popover.Dialog>
                        </Popover.Content>
                      </Popover>
                    )}
                    <p className="text-sm font-medium text-indigo-700/80 mt-2">
                      {topIndustries && topIndustries.length > 0
                        ? `${topIndustries[0].count} assessment${topIndustries[0].count !== 1 ? 's' : ''} ${topIndustries.length > 1 ? 'each' : ''}`
                        : 'No data available'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-100/80 shrink-0">
                    <Building className="w-6 h-6 text-indigo-700" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters & Controls Card - STATIC during filter changes - Beautiful spacing */}
          {stats_totalAssessments > 0 && (
            <Card className="border-2 border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
              <div className="p-6 space-y-6">
                {/* Sort and Search Row - compact responsive layout */}
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-48">
                      <Select
                        className="w-full"
                        placeholder="Sort by"
                        value={sortBy}
                        onChange={(value) => {
                          setSortBy(value || 'created_at_desc');
                          setPage(1);
                        }}
                        variant="bordered"
                        size="md"
                      >
                        <Label className="text-sm font-semibold text-slate-700">Sort by</Label>
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            <ListBox.Item id="created_at_asc" textValue="Date Created (Oldest)">
                              Date Created (Oldest)
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                            <ListBox.Item id="created_at_desc" textValue="Date Created (Newest)">
                              Date Created (Newest)
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                            <ListBox.Item id="title_asc" textValue="Title (A-Z)">
                              Title (A-Z)
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                            <ListBox.Item id="title_desc" textValue="Title (Z-A)">
                              Title (Z-A)
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                            <ListBox.Item id="overall_score_asc" textValue="Score (Low to High)">
                              Score (Low to High)
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                            <ListBox.Item id="overall_score_desc" textValue="Score (High to Low)">
                              Score (High to Low)
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          </ListBox>
                        </Select.Popover>
                      </Select>
                    </div>

                    {/* Small helper action to reset sorting quickly */}
                    <HeroButton
                      onClick={() => setSortBy('created_at_desc')}
                      size="md"
                      variant="ghost"
                      className="hidden md:inline-flex"
                    >
                      Reset
                    </HeroButton>
                  </div>

                  {/* Search placed to the right on larger screens, full-width on mobile */}
                  <div className="flex-1 lg:ml-6">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-slate-700">Search</label>
                      <div className="relative">
                        <Search className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-slate-400 pointer-events-none z-10" />
                        <Input
                          type="text"
                          placeholder="Search by title..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          variant="bordered"
                          size="md"
                          className="pl-10 w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Industry Filter Chips */}
                {industryOptions.length > 1 && (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Filter by Industry
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {industryOptions.map((industry) => (
                        <IndustryFilterChip
                          key={industry}
                          industry={industry}
                          isSelected={selectedIndustries.includes(industry)}
                          onToggle={handleToggleIndustry}
                          label={
                            industry === 'all' ? 'All Industries' : formatIndustryLabel(industry)
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Compare Section - Beautiful spacing */}
                {/* <Separator orientation="horizontal" className="h-[1.5px]" /> */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <p className="text-sm text-slate-600 font-medium italic">
                    Select exactly 2 assessments to see how your initiative evolved over time or
                    compare strategies side-by-side.
                  </p>
                  <Button
                    onPress={handleCompareSelected}
                    isDisabled={selectedIds.size !== 2}
                    variant="teal"
                    size="md"
                  >
                    <GitCompare className="w-4 h-4" />
                    {selectedIds.size}/2 Compare Selected
                  </Button>
                </div>
              </div>
            </Card>
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
                    variant: 'neutral-soft',
                  },
                ]}
                showDefaultActions={false}
              />
            ) : stats_totalAssessments === 0 ? (
              <Card className="border-2 border-dashed border-slate-300 bg-slate-50/60 shadow-sm">
                <div className="p-6 text-center">
                  <div className="flex justify-center mb-8">
                    <div className="p-5 rounded-2xl bg-linear-to-br from-slate-100 to-slate-200 shadow-inner">
                      <Ghost className="w-12 h-12 text-slate-500" strokeWidth={1.5} />
                    </div>
                  </div>
                  <h3 className="font-bold text-2xl text-slate-900 mb-3">No assessments yet</h3>
                  <p className="text-base text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
                    Start your first assessment to track your circular economy progress and get
                    personalized recommendations.
                  </p>
                  <Button onPress={handleBack} variant="success" size="lg">
                    <Plus className="w-5 h-5" />
                    Start Your First Assessment
                  </Button>
                </div>
              </Card>
            ) : assessments.length === 0 ? (
              <Card className="border-2 border-dashed border-slate-300 bg-slate-50/40 shadow-sm">
                <div className="p-6 text-center">
                  <div className="flex justify-center mb-8">
                    <div className="p-5 rounded-2xl bg-linear-to-br from-slate-100 to-slate-200 shadow-inner">
                      <Ghost className="w-12 h-12 text-slate-500" strokeWidth={1.5} />
                    </div>
                  </div>
                  <h3 className="font-bold text-2xl text-slate-900 mb-3">No assessments found</h3>
                  <p className="text-base text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
                    Your current filters didn&apos;t match any assessments. Try selecting a
                    different industry or adjusting your search.
                  </p>
                  <Button
                    variant="neutral"
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
              </Card>
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
                  onCopyShareLink={handleCopyShareLink}
                />

                <div className="flex flex-col items-center justify-center gap-3 p-0 mt-6">
                  {/* Pagination info text */}
                  <p className="text-sm text-slate-600">
                    Showing{' '}
                    <span className="font-semibold text-slate-900 inline-block text-center">
                      {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)}
                    </span>{' '}
                    of{' '}
                    <span className="font-semibold text-slate-900 inline-block text-center">
                      {total}
                    </span>{' '}
                    results
                  </p>

                  <div className="flex sm:flex-row flex-col items-center justify-center gap-4 sm:gap-6 mt-1 sm:mt-0">
                    {/* MUI Pagination */}
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={(event, value) => setPage(value)}
                      color="success"
                      // variant="outlined"
                      shape="circular"
                      showFirstButton
                      showLastButton
                      renderItem={(item) => (
                        <PaginationItem
                          {...item}
                          onMouseEnter={() => prefetchAssessmentsPage(item.page)}
                          onFocus={() => prefetchAssessmentsPage(item.page)}
                        />
                      )}
                    />

                    {/* HeroUI v3 Select for page size */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-slate-600 whitespace-nowrap">Per page:</label>
                      <Select
                        className="w-20"
                        placeholder="5"
                        value={String(pageSize)}
                        onChange={(value) => {
                          setPageSize(Number(value));
                          setPage(1);
                        }}
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
        <Button variant="neutral-soft" onPress={handleBack} size="lg">
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
          Back to Home
        </Button>
      </div>
      {/* Dialogs */}
      {deleteDialog.isOpen && deleteDialog.assessmentId && (
        <DeleteAssessmentDialog
          open={true}
          onOpenChange={handleDeleteDialogChange}
          assessmentName={confirmDeleteAssessment?.title}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
        />
      )}
      {renameDialog.isOpen && renameDialog.assessmentId && (
        <RenameAssessmentDialog
          isOpen={true}
          onOpenChange={handleRenameDialogChange}
          defaultName={confirmRenameAssessment?.title || ''}
          defaultIsPublic={confirmRenameAssessment?.is_public || false}
          defaultPublicId={confirmRenameAssessment?.public_id || null}
          defaultContributeToGlobal={
            confirmRenameAssessment?.contribute_to_global_benchmarks || false
          }
          onRename={handleConfirmRename}
          isLoading={isRenaming}
        />
      )}
      {/* DEBUG: Direct test delete button */}
      {import.meta.env.MODE === 'development' && deleteDialog.assessmentId && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            padding: '10px 20px',
            backgroundColor: '#ff4444',
            color: 'white',
            cursor: 'pointer',
            borderRadius: '4px',
            zIndex: 9999,
          }}
          onClick={() => {
            console.log('[TEST_DELETE_BUTTON_CLICKED]', {
              assessmentId: deleteDialog.assessmentId,
            });
            proceedDelete(deleteDialog.assessmentId);
          }}
        >
          🧪 TEST DELETE {deleteDialog.assessmentId}
        </div>
      )}
    </div>
  );
}

MyAssessmentsPage.propTypes = {};
