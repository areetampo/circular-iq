import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getSessionId } from '@/utils/session';
import { useToast } from '@/hooks/useToast';
import { formatTimestamp } from '@/lib/formatting';
import { useAssessments, usePrefetchAssessment } from '@/features/assessments';
// ✅ Only components that exist in HeroUI v3.0.0-beta.5
import {
  Button,
  Card,
  Input,
  Select,
  Checkbox,
  Chip,
  Skeleton,
  Label,
  ListBox,
} from '@heroui/react';
import { DeleteAssessmentDialog } from '@/components/dialogs';
import { Lock, ArrowLeft } from 'lucide-react';

import {
  Search,
  Eye,
  Trash2,
  MoreVertical,
  GitCompare,
  Plus,
  Award,
  Building,
  Lightbulb,
  Ghost,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function MyAssessmentsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortBy, setSortBy] = useState('created_at');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { addToast } = useToast();
  const searchRef = useRef('');

  const { assessments, total, isLoading, error, refetch, removeAssessment, isDeleting } =
    useAssessments({
      sessionId: getSessionId(),
      page: String(page),
      pageSize: String(pageSize),
      sortBy,
      order: 'desc',
      search: searchRef.current,
    });

  const loading = isLoading;

  const formatIndustryLabel = (industry) => {
    if (!industry) return 'General';
    return industry
      .toString()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

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

  const prefetchAssessment = usePrefetchAssessment();

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      searchRef.current = searchTerm && searchTerm.trim() ? searchTerm.trim() : '';
      fetchAssessments();
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchAssessments = async () => {
    await refetch();
  };

  const proceedDelete = async (id) => {
    try {
      await removeAssessment(id);
      selectedIds.delete(id);
      setSelectedIds(new Set(selectedIds));
      addToast('Assessment deleted', 'success');
      setConfirmDeleteId(null);
      setShowDeleteModal(false);
    } catch {
      addToast('Delete failed. Please try again.', 'error');
      setConfirmDeleteId(null);
      setShowDeleteModal(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleToggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleCompareSelected = () => {
    if (selectedIds.size !== 2) {
      addToast('Please select exactly 2 assessments to compare', 'info');
      return;
    }

    const ids = Array.from(selectedIds);
    navigate(`/compare?id1=${ids[0]}&id2=${ids[1]}`);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleViewDetail = (id) => {
    navigate(`/assessments/${id}`);
  };

  const handleBack = () => {
    navigate('/');
  };

  const getIndustries = () => {
    const industries = new Set(assessments.map((a) => a.industry).filter(Boolean));
    return ['all', ...Array.from(industries)];
  };

  const filteredAssessments = assessments.filter((assessment) => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    const titleMatch = (assessment.title || '').toLowerCase().includes(search);
    const industryMatch = (assessment.industry || '').toLowerCase().includes(search);
    return titleMatch || industryMatch;
  });

  const confirmDeleteAssessment = assessments.find((a) => a.id === confirmDeleteId);

  const getRatingVariant = (score) => {
    if (score >= 80) return 'default';
    if (score >= 50) return 'secondary';
    return 'destructive';
  };

  const getStatusBadge = (score) => {
    if (score >= 75) return { variant: 'default', text: 'Excellent' };
    if (score >= 50) return { variant: 'secondary', text: 'Good' };
    return { variant: 'destructive', text: 'Needs Improvement' };
  };

  const getChipColor = (variant) => {
    if (variant === 'destructive') return 'danger';
    if (variant === 'secondary') return 'secondary';
    return 'primary';
  };

  const totalPages = Math.ceil(total / pageSize);

  // Custom Pagination Component
  const CustomPagination = () => {
    if (total <= pageSize) return null;

    return (
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onPress={() => setPage((p) => Math.max(1, p - 1))}
          isDisabled={page === 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => {
              // Show first page, last page, current page, and adjacent pages
              return p === 1 || p === totalPages || Math.abs(p - page) <= 1;
            })
            .map((p, idx, arr) => {
              // Add ellipsis if there's a gap
              const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;

              return (
                <React.Fragment key={p}>
                  {showEllipsis && <span className="px-2 text-gray-400">...</span>}
                  <Button
                    variant={p === page ? 'primary' : 'secondary'}
                    size="sm"
                    onPress={() => setPage(p)}
                    className={p === page ? 'bg-primary-500 text-white' : ''}
                  >
                    {p}
                  </Button>
                </React.Fragment>
              );
            })}
        </div>

        <Button
          variant="secondary"
          size="sm"
          onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
          isDisabled={page === totalPages}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  // Render Skeleton Loading State
  const renderSkeletonCards = () => (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, idx) => (
        <Card key={idx}>
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-[300px]" />
                <Skeleton className="h-4 w-[200px]" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-[100px]" />
                  <Skeleton className="h-6 w-[80px]" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="w-20 h-9" />
                <Skeleton className="w-20 h-9" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <>
      {/* Authentication check */}
      {!authLoading && !isAuthenticated && (
        <Card className="max-w-md mx-auto">
          <Card.Header className="border-b text-center">
            <div className="flex justify-center mb-4">
              <Lock className="w-16 h-16 text-[#4a90e2]" strokeWidth={1.5} />
            </div>
            <Card.Title className="text-2xl">Authentication Required</Card.Title>
            <Card.Description className="mt-1">
              You need to log in to view and manage your assessments.
            </Card.Description>
          </Card.Header>
          <Card.Description className="flex justify-center">
            <Button
              onPress={() => navigate('/login')}
              size="lg"
              className="bg-primary-500 text-white"
            >
              Go to Login
            </Button>
          </Card.Description>
        </Card>
      )}

      {/* Loading state while auth is being checked */}
      {authLoading && (
        <div className="flex justify-center py-12">
          <div className="space-y-4">
            <Skeleton className="w-[200px] h-8" />
            <Skeleton className="w-[300px] h-4" />
          </div>
        </div>
      )}

      {/* Assessments content - only show if authenticated */}
      {isAuthenticated && !authLoading && (
        <div className="space-y-6">
          {/* Summary Header */}
          {assessments.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="border-2 border-emerald-200 bg-linear-to-br from-emerald-50 to-emerald-100">
                <div className="pb-3">
                  <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                    <Award className="w-4 h-4" />
                    Average Circularity Score
                  </p>
                  <h3 className="text-4xl font-bold text-emerald-700 mt-2">{averageScore}</h3>
                </div>
              </Card>

              <Card className="border-2 border-slate-200 bg-linear-to-br from-slate-50 to-slate-100">
                <div className="pb-3">
                  <p className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Building className="w-4 h-4" />
                    Primary Focus
                  </p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-2">
                    {topIndustry ? formatIndustryLabel(topIndustry.industry) : '—'}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {topIndustry
                      ? `${topIndustry.count} assessment${topIndustry.count !== 1 ? 's' : ''}`
                      : 'No assessments'}
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* Quick Tip Card */}
          {assessments.length > 0 && (
            <Card className="border-2 border-blue-200 bg-linear-to-r from-blue-50 to-indigo-50">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-6 h-6 text-blue-600 mt-0.5" />
                <div>
                  <span className="font-bold text-blue-800">Tip: </span>
                  <span className="text-slate-700">
                    Select exactly 2 assessments and click &quot;Compare Selected&quot; to see how
                    your initiative evolved over time, or compare different strategies side-by-side.
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Controls Card */}
          {assessments.length > 0 && (
            <Card>
              <div>
                <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-3">
                  <div className="flex flex-col space-y-2">
                    <Select
                      value={filterIndustry}
                      onChange={(value) => {
                        setFilterIndustry(value);
                        setPage(1);
                      }}
                      placeholder="All industries"
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
                          {getIndustries().map((ind) => (
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

                  <div className="flex flex-col space-y-2">
                    <Select
                      value={sortBy}
                      onChange={(value) => {
                        setSortBy(value);
                        setPage(1);
                      }}
                      placeholder="Sort by"
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

                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Search</label>
                    <div className="relative">
                      <Search className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-gray-600" />
                      <Input
                        type="text"
                        placeholder="Search by title or industry..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm font-medium text-gray-600">
                    {selectedIds.size} assessment{selectedIds.size !== 1 ? 's' : ''} selected
                  </div>
                  <div className="flex gap-2">
                    {selectedIds.size > 0 && (
                      <Button variant="secondary" onPress={handleClearSelection}>
                        Clear Selection
                      </Button>
                    )}
                    <Button
                      onPress={handleCompareSelected}
                      isDisabled={selectedIds.size !== 2}
                      className="gap-2 bg-primary-500 text-white"
                    >
                      <GitCompare className="w-4 h-4" />
                      Compare Selected
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Main Content */}
          <div className="space-y-4">
            {/* Loading State with Skeletons */}
            {loading && renderSkeletonCards()}

            {/* Error State */}
            {!loading && error && (
              <Card>
                <div className="py-12 text-center">
                  <div className="mb-4 text-red-600">
                    <p className="text-lg font-semibold">Error loading assessments</p>
                    <p className="mt-2 text-sm text-gray-600">{error}</p>
                  </div>
                  <div className="flex justify-center gap-3">
                    <Button onPress={fetchAssessments} className="bg-primary-500 text-white">
                      Retry
                    </Button>
                    <Button variant="secondary" onPress={handleBack}>
                      Back to Home
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Empty State */}
            {!loading && !error && assessments.length === 0 && (
              <Card className="border-dashed">
                <div className="py-12 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 rounded-full bg-gray-100">
                      <Ghost className="w-8 h-8 text-gray-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2 text-lg text-gray-900">No assessments yet</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Start your first assessment to track your circularity progress.
                  </p>
                  <Button onPress={handleBack} className="gap-2 bg-primary-500 text-white">
                    <Plus className="w-4 h-4" />
                    Start Your First Assessment
                  </Button>
                </div>
              </Card>
            )}

            {/* Filtered Empty State */}
            {!loading && !error && assessments.length > 0 && filteredAssessments.length === 0 && (
              <Card className="border-dashed">
                <div className="py-12 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 rounded-full bg-gray-100">
                      <Ghost className="w-8 h-8 text-gray-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2 text-lg text-gray-900">No assessments found</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    No assessments match your current filters. Try adjusting your search.
                  </p>
                  <Button
                    variant="secondary"
                    onPress={() => {
                      setSearchTerm('');
                      setFilterIndustry('all');
                      setPage(1);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </Card>
            )}

            {/* Card List with Data */}
            {!loading && !error && filteredAssessments.length > 0 && (
              <>
                <div className="space-y-3">
                  {filteredAssessments.map((assessment) => {
                    const status = getStatusBadge(assessment.overall_score);
                    return (
                      <Card
                        key={assessment.id}
                        className="hover:shadow-md transition-shadow"
                        onMouseEnter={() => prefetchAssessment(assessment.id)}
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            {/* Left: Checkbox & Info */}
                            <div className="flex items-start gap-4 flex-1">
                              <div className="pt-1">
                                <Checkbox
                                  isSelected={selectedIds.has(assessment.id)}
                                  onChange={() => handleToggleSelect(assessment.id)}
                                >
                                  <Checkbox.Control>
                                    <Checkbox.Indicator />
                                  </Checkbox.Control>
                                </Checkbox>
                              </div>

                              <div className="flex-1 space-y-2">
                                <h3 className="font-semibold text-lg text-gray-900">
                                  {assessment.title || 'Untitled Assessment'}
                                </h3>

                                <div className="flex flex-wrap items-center gap-2">
                                  <Chip
                                    variant="flat"
                                    color="secondary"
                                    size="sm"
                                    className="font-medium"
                                  >
                                    {(assessment.industry || 'General').replace(/_/g, ' ')}
                                  </Chip>

                                  <Chip
                                    variant="flat"
                                    color={getChipColor(getRatingVariant(assessment.overall_score))}
                                    size="sm"
                                    className="font-semibold"
                                  >
                                    Score: {assessment.overall_score}
                                  </Chip>

                                  <Chip
                                    variant="flat"
                                    color={getChipColor(status.variant)}
                                    size="sm"
                                  >
                                    {status.text}
                                  </Chip>
                                </div>

                                <p className="text-sm text-gray-500">
                                  Created {formatTimestamp(assessment.created_at)}
                                </p>
                              </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onPress={() => handleViewDetail(assessment.id)}
                                onMouseEnter={() => prefetchAssessment(assessment.id)}
                                className="gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination */}
                {total > pageSize && (
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of{' '}
                      {total} results
                    </div>
                    <div className="flex items-center gap-4">
                      <CustomPagination />
                      <div className="flex items-center gap-2">
                        <Select
                          value={String(pageSize)}
                          onChange={(value) => {
                            setPageSize(Number(value));
                            setPage(1);
                          }}
                          placeholder="Select"
                        >
                          <Label className="text-sm font-medium">Per page:</Label>
                          <Select.Trigger className="w-20">
                            <Select.Value />
                            <Select.Indicator />
                          </Select.Trigger>
                          <Select.Popover>
                            <ListBox>
                              {[10, 20, 50, 100].map((n) => (
                                <ListBox.Item key={n} id={String(n)} textValue={String(n)}>
                                  {n}
                                  <ListBox.ItemIndicator />
                                </ListBox.Item>
                              ))}
                            </ListBox>
                          </Select.Popover>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-start">
            <Button variant="secondary" onPress={handleBack} className="gap-2">
              <ArrowLeft className="w-4 h-4 text-gray-700" strokeWidth={2.5} /> Back to Home
            </Button>
          </div>

          {/* Delete Assessment Dialog */}
          <DeleteAssessmentDialog
            open={showDeleteModal}
            onOpenChange={setShowDeleteModal}
            assessmentName={confirmDeleteAssessment?.title}
            onConfirm={() => proceedDelete(confirmDeleteId)}
          />
        </div>
      )}
    </>
  );
}

MyAssessmentsPage.propTypes = {};
