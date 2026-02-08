import React, { useEffect, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getSessionId } from '@/utils/session';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { formatTimestamp } from '@/lib/formatting';
import { useAssessments, usePrefetchAssessment } from '@/features/assessments';
import {
  Button,
  Card,
  Input,
  Select,
  Label,
  ListBox,
  Checkbox,
  Chip,
  Skeleton,
} from '@heroui/react';
import { Pagination } from '@heroui/pagination';
import { DeleteAssessmentDialog } from '@/components/dialogs';
import {
  Lock,
  ArrowLeft,
  Search,
  Eye,
  GitCompare,
  Plus,
  Award,
  Building,
  Lightbulb,
  Ghost,
  Edit,
  Trash2,
} from 'lucide-react';

// Memoized AssessmentCard Component
const AssessmentCard = React.memo(function AssessmentCard({
  assessment,
  isSelected,
  status,
  ratingVariant,
  onToggleSelect,
  onView,
  onRename,
  onDelete,
  onPrefetch,
}) {
  return (
    <Card
      className="border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 bg-white"
      onMouseEnter={() => onPrefetch(assessment.id)}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {/* Checkbox on the left */}
          <div className="pt-1.5 shrink-0">
            <Checkbox
              isSelected={isSelected}
              onChange={() => onToggleSelect(assessment.id)}
              size="lg"
              color="primary"
            />
          </div>

          {/* Content in the middle */}
          <div className="flex-1 min-w-0 space-y-3">
            <h3 className="font-bold text-lg text-slate-900 line-clamp-2 leading-tight">
              {assessment.title || 'Untitled Assessment'}
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <Chip variant="flat" color="secondary" size="sm" className="font-medium">
                {(assessment.industry || 'General').replace(/_/g, ' ').toUpperCase()}
              </Chip>

              <Chip variant="flat" color={ratingVariant} size="sm" className="font-bold">
                {assessment.overall_score}%
              </Chip>

              <Chip variant="flat" color={status.color} size="sm">
                {status.text}
              </Chip>
            </div>

            <p className="text-sm text-slate-500">
              Created {formatTimestamp(assessment.created_at)}
            </p>
          </div>

          {/* Action buttons on the right */}
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              size="md"
              color="primary"
              variant="tertiary"
              onPress={() => onView(assessment.id)}
              // startContent={<Eye className="w-4 h-4" />}
              className="font-semibold basis-24"
            >
              <Eye className="w-4 h-4 inline" />
              View
            </Button>
            <Button
              size="md"
              color="default"
              variant="outline"
              onPress={() => onRename(assessment.id)}
              // startContent={<Edit className="w-4 h-4" />}
              className="font-semibold basis-24"
            >
              <Edit className="w-4 h-4 inline" />
              Rename
            </Button>
            <Button
              size="md"
              color="danger"
              variant="danger"
              onPress={() => onDelete(assessment.id)}
              // startContent={<Trash2 className="w-4 h-4" />}
              className="font-semibold basis-24 flex justify-center"
            >
              <Trash2 className="w-4 h-4 inline" />
              Delete
            </Button>
          </div>
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
    created_at: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.instanceOf(Date),
    ]),
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  status: PropTypes.shape({
    color: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
  }).isRequired,
  ratingVariant: PropTypes.string.isRequired,
  onToggleSelect: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  onRename: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onPrefetch: PropTypes.func.isRequired,
};

// Memoized Assessment List Component
const AssessmentList = React.memo(function AssessmentList({
  assessments,
  selectedIds,
  onToggleSelect,
  onView,
  onRename,
  onDelete,
  onPrefetch,
  getRatingColor,
  getStatusBadge,
}) {
  return (
    <div className="space-y-4">
      {assessments.map((assessment) => {
        const status = getStatusBadge(assessment.overall_score);
        const ratingVariant = getRatingColor(assessment.overall_score);
        return (
          <AssessmentCard
            key={assessment.id}
            assessment={assessment}
            isSelected={selectedIds.has(assessment.id)}
            status={status}
            ratingVariant={ratingVariant}
            onToggleSelect={onToggleSelect}
            onView={onView}
            onRename={onRename}
            onDelete={onDelete}
            onPrefetch={onPrefetch}
          />
        );
      })}
    </div>
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
  getRatingColor: PropTypes.func.isRequired,
  getStatusBadge: PropTypes.func.isRequired,
};

export default function MyAssessmentsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortBy, setSortBy] = useState('created_at');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, assessmentId: null });
  const { addToast } = useToast();

  // Debounce search and sort to prevent constant reloading
  const debouncedSearchTerm = useDebounce(searchTerm, 350);
  const debouncedSortBy = useDebounce(sortBy, 300);

  const { assessments, total, isLoading, error, refetch, removeAssessmentAsync, isDeleting } =
    useAssessments({
      sessionId: getSessionId(),
      page: String(page),
      pageSize: String(pageSize),
      sortBy: debouncedSortBy,
      order: 'desc',
      search: debouncedSearchTerm,
    });

  const prefetchAssessment = usePrefetchAssessment();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, filterIndustry, debouncedSortBy]);

  const formatIndustryLabel = useCallback((industry) => {
    if (!industry) return 'General';
    return industry
      .toString()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }, []);

  const averageScore = useMemo(() => {
    if (!assessments.length) return 0;
    const totalScore = assessments.reduce(
      (sum, assessment) => sum + (assessment.overall_score || 0),
      0,
    );
    return Math.round(totalScore / assessments.length);
  }, [assessments]);

  const topIndustry = useMemo(() => {
    if (!assessments.length) return null;
    const counts = assessments.reduce((acc, assessment) => {
      const industry = assessment.industry || 'general';
      acc[industry] = (acc[industry] || 0) + 1;
      return acc;
    }, {});

    const [industry, count] = Object.entries(counts).reduce(
      (max, [ind, count]) => (count > max[1] ? [ind, count] : max),
      ['general', 0],
    );

    return { industry, count };
  }, [assessments]);

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
    navigate(`/compare?id1=${ids[0]}&id2=${ids[1]}`);
  }, [selectedIds, addToast, navigate]);

  const handleViewDetail = useCallback(
    (id) => {
      navigate(`/assessments/${id}`);
    },
    [navigate],
  );

  const handleRenameAssessment = useCallback(() => {
    addToast('Rename feature coming soon', 'info');
  }, [addToast]);

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

  const industries = useMemo(() => {
    const industrySet = new Set(assessments.map((a) => a.industry).filter(Boolean));
    return ['all', ...Array.from(industrySet)];
  }, [assessments]);

  const filteredAssessments = useMemo(() => {
    let filtered = assessments;

    if (filterIndustry && filterIndustry !== 'all') {
      filtered = filtered.filter((a) => a.industry === filterIndustry);
    }

    return filtered;
  }, [assessments, filterIndustry]);

  const confirmDeleteAssessment = useMemo(
    () => assessments.find((a) => a.id === deleteDialog.assessmentId),
    [assessments, deleteDialog.assessmentId],
  );

  const getRatingColor = useCallback((score) => {
    if (score >= 80) return 'success';
    if (score >= 50) return 'warning';
    return 'danger';
  }, []);

  const getStatusBadge = useCallback((score) => {
    if (score >= 75) return { color: 'success', text: 'Excellent' };
    if (score >= 50) return { color: 'warning', text: 'Good' };
    return { color: 'danger', text: 'Needs Improvement' };
  }, []);

  const totalPages = useMemo(() => Math.ceil(total / pageSize), [total, pageSize]);

  const renderSkeletonCards = useCallback(
    () => (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Card key={idx} className="p-5 sm:p-6 bg-white border border-slate-200">
            <div className="flex items-start gap-4">
              <Skeleton className="w-6 h-6 mt-1.5 rounded shrink-0" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-7 w-3/4 rounded" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-28 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-32 rounded-full" />
                </div>
                <Skeleton className="h-5 w-48 rounded" />
              </div>
              <div className="flex gap-2 shrink-0">
                <Skeleton className="w-20 h-10 rounded-lg" />
                <Skeleton className="w-24 h-10 rounded-lg" />
                <Skeleton className="w-24 h-10 rounded-lg" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    ),
    [],
  );

  return (
    <>
      {!authLoading && !isAuthenticated && (
        <Card className="max-w-md mx-auto shadow-lg border border-slate-200">
          <div className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-blue-50">
                <Lock className="w-16 h-16 text-blue-600" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Authentication Required</h2>
            <p className="text-slate-600 mb-6">
              You need to log in to view and manage your assessments.
            </p>
            <Button
              onPress={() => navigate('/login')}
              size="lg"
              color="primary"
              className="font-semibold px-8"
            >
              Go to Login
            </Button>
          </div>
        </Card>
      )}

      {authLoading && (
        <div className="flex justify-center py-12">
          <div className="space-y-4 text-center">
            <Skeleton className="h-8 w-64 mx-auto rounded" />
            <Skeleton className="h-4 w-80 mx-auto rounded" />
          </div>
        </div>
      )}

      {isAuthenticated && !authLoading && (
        <div className="space-y-6">
          {/* Summary Cards */}
          {assessments.length > 0 && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Card className="bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-100 border-2 border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-white shadow-sm">
                      <Award className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
                        Average Score
                      </p>
                      <h3 className="text-5xl font-extrabold text-emerald-700 mb-1">
                        {averageScore}
                      </h3>
                      <p className="text-sm text-emerald-600 font-medium">Across all assessments</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-50 via-indigo-50 to-indigo-100 border-2 border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-white shadow-sm">
                      <Building className="w-7 h-7 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">
                        Primary Focus
                      </p>
                      <h3 className="text-2xl font-bold text-indigo-800 mb-1">
                        {topIndustry ? formatIndustryLabel(topIndustry.industry) : '—'}
                      </h3>
                      <p className="text-sm text-indigo-600 font-medium">
                        {topIndustry
                          ? `${topIndustry.count} assessment${topIndustry.count !== 1 ? 's' : ''}`
                          : 'No assessments'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Pro Tip Card */}
          {assessments.length > 0 && (
            <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 shadow-sm">
              <div className="flex items-start gap-4 p-6">
                <div className="p-3 rounded-xl bg-white shadow-sm shrink-0">
                  <Lightbulb className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-blue-900 text-base mb-1.5">Pro Tip</h4>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    Select exactly 2 assessments and click "Compare Selected" to see how your
                    initiative evolved over time, or compare different strategies side-by-side.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Filters & Controls Card - stays fixed, doesn't move */}
          {assessments.length > 0 && (
            <Card className="border-2 border-slate-200 shadow-sm bg-white">
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Filter by Industry */}
                  <div className="flex flex-col gap-2">
                    <Select
                      className="w-full"
                      placeholder="All industries"
                      value={filterIndustry}
                      onChange={(value) => {
                        setFilterIndustry(value || 'all');
                        setPage(1);
                      }}
                      variant="bordered"
                      size="md"
                    >
                      <Label className="text-sm font-semibold text-slate-700">
                        Filter by Industry
                      </Label>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {industries.map((ind) => (
                            <ListBox.Item
                              key={ind}
                              id={ind}
                              textValue={
                                ind === 'all'
                                  ? 'All Industries'
                                  : ind.replace(/_/g, ' ').toUpperCase()
                              }
                            >
                              {ind === 'all'
                                ? 'All Industries'
                                : ind.replace(/_/g, ' ').toUpperCase()}
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>

                  {/* Sort by */}
                  <div className="flex flex-col gap-2">
                    <Select
                      className="w-full"
                      placeholder="Sort by"
                      value={sortBy}
                      onChange={(value) => {
                        setSortBy(value || 'created_at');
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
                          <ListBox.Item id="created_at" textValue="Date Created">
                            Date Created
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                          <ListBox.Item id="overall_score" textValue="Score">
                            Score
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                          <ListBox.Item id="title" textValue="Title">
                            Title
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                          <ListBox.Item id="industry" textValue="Industry">
                            Industry
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>

                  {/* Search */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700">Search</label>
                    <div className="relative">
                      <Search className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-slate-400 pointer-events-none z-10" />
                      <Input
                        type="text"
                        placeholder="Search by title or industry..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        variant="bordered"
                        size="md"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Compare Section */}
                <div className="flex items-center justify-between pt-5 border-t-2 border-slate-100">
                  <p className="text-sm text-slate-600 font-medium">
                    Select exactly 2 assessments for comparison
                  </p>
                  <Button
                    onPress={handleCompareSelected}
                    isDisabled={selectedIds.size !== 2}
                    color="primary"
                    variant="shadow"
                    size="md"
                    className="gap-2 font-bold px-6"
                  >
                    <GitCompare className="w-4 h-4" />
                    {selectedIds.size}/2 Compare Selected
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Assessment List Section - ONLY this section shows loading */}
          <div>
            {isLoading && renderSkeletonCards()}

            {!isLoading && error && (
              <Card className="border-2 border-red-200 bg-red-50 shadow-sm">
                <div className="py-12 text-center p-6">
                  <div className="mb-6">
                    <p className="text-xl font-bold text-red-700 mb-2">Error loading assessments</p>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                  <div className="flex justify-center gap-3">
                    <Button
                      onPress={() => refetch()}
                      color="danger"
                      variant="shadow"
                      className="font-semibold"
                    >
                      Retry
                    </Button>
                    <Button variant="bordered" onPress={handleBack} className="font-semibold">
                      Back to Home
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {!isLoading && !error && assessments.length === 0 && (
              <Card className="border-2 border-dashed border-slate-300 bg-slate-50 shadow-sm">
                <div className="py-20 px-6 text-center">
                  <div className="flex justify-center mb-8">
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 shadow-inner">
                      <Ghost className="w-12 h-12 text-slate-500" strokeWidth={1.5} />
                    </div>
                  </div>
                  <h3 className="font-bold text-2xl text-slate-900 mb-3">No assessments yet</h3>
                  <p className="text-base text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
                    Start your first assessment to track your circular economy progress and get
                    personalized recommendations.
                  </p>
                  <Button
                    onPress={handleBack}
                    color="primary"
                    variant="shadow"
                    size="lg"
                    className="gap-2 font-bold px-8"
                  >
                    <Plus className="w-5 h-5" />
                    Start Your First Assessment
                  </Button>
                </div>
              </Card>
            )}

            {!isLoading && !error && assessments.length > 0 && filteredAssessments.length === 0 && (
              <Card className="border-2 border-dashed border-slate-300 bg-slate-50 shadow-sm">
                <div className="py-20 px-6 text-center">
                  <div className="flex justify-center mb-8">
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 shadow-inner">
                      <Ghost className="w-12 h-12 text-slate-500" strokeWidth={1.5} />
                    </div>
                  </div>
                  <h3 className="font-bold text-2xl text-slate-900 mb-3">No assessments found</h3>
                  <p className="text-base text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
                    Your current filter didn&apos;t match any assessments. Try selecting a different
                    industry.
                  </p>
                  <Button
                    variant="shadow"
                    color="default"
                    onPress={() => {
                      setSearchTerm('');
                      setFilterIndustry('all');
                      setPage(1);
                    }}
                    className="font-semibold px-8"
                  >
                    Clear Filters
                  </Button>
                </div>
              </Card>
            )}

            {!isLoading && !error && filteredAssessments.length > 0 && (
              <>
                <AssessmentList
                  assessments={filteredAssessments}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onView={handleViewDetail}
                  onRename={handleRenameAssessment}
                  onDelete={handleDeleteAssessment}
                  onPrefetch={prefetchAssessment}
                  getRatingColor={getRatingColor}
                  getStatusBadge={getStatusBadge}
                />

                {total > pageSize && (
                  <Card className="mt-6 border-2 border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5">
                      <div className="text-sm text-slate-600 font-medium">
                        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of{' '}
                        {total} results
                      </div>
                      <div className="flex items-center gap-4 flex-wrap justify-center">
                        <Pagination
                          isCompact
                          showControls
                          page={page}
                          total={totalPages}
                          onChange={(newPage) => setPage(newPage)}
                          size="md"
                        />
                        <div className="flex items-center gap-2 border-l-2 border-slate-200 pl-4">
                          <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                            Per page:
                          </label>
                          <Select
                            className="w-20"
                            placeholder="10"
                            value={String(pageSize)}
                            onChange={(value) => {
                              setPageSize(Number(value));
                              setPage(1);
                            }}
                            variant="bordered"
                            size="sm"
                          >
                            <Select.Trigger>
                              <Select.Value />
                              <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover>
                              <ListBox>
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
                  </Card>
                )}
              </>
            )}
          </div>

          {/* Simple Back Home Button */}
          <div className="flex justify-start pt-6 border-t-2 border-slate-200">
            <Button
              variant="outline"
              onPress={handleBack}
              size="lg"
              // startContent={<ArrowLeft className="w-5 h-5" strokeWidth={2.5} />}
              className="font-semibold border-black border-2"
            >
              <ArrowLeft className="w-5 h-5 inline" strokeWidth={2.5} />
              Back to Home
            </Button>
          </div>

          {deleteDialog.isOpen && deleteDialog.assessmentId && (
            <DeleteAssessmentDialog
              open={true}
              onOpenChange={handleDeleteDialogChange}
              assessmentName={confirmDeleteAssessment?.title}
              onConfirm={handleConfirmDelete}
              isLoading={isDeleting}
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
      )}
    </>
  );
}

MyAssessmentsPage.propTypes = {};
