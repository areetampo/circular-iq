import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { getSessionId } from '@/utils/session';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import AppContainer from '@/components/layout/AppContainer';
import { formatTimestamp } from '@/lib/formatting';
import { useAssessments, getAssessmentById } from '@/features/assessments';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Search,
  Eye,
  Trash2,
  MoreVertical,
  GitCompare,
  Plus,
  TrendingUp,
  Award,
  Building,
  Lightbulb,
  Ghost,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function MyAssessmentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
      industry: filterIndustry !== 'all' ? filterIndustry : undefined,
    });

  const loading = isLoading;

  // Prefetch assessment data on hover for instant navigation
  const prefetchAssessment = (id) => {
    queryClient.prefetchQuery({
      queryKey: ['assessment', id],
      queryFn: () => getAssessmentById(id),
      staleTime: 1000 * 60 * 5, // 5 minutes - ensures hover-to-click transition is instant
    });
  };

  // Debounce search to avoid excessive requests
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
      selectedIds.delete(id); // Remove the assessment ID from the selected IDs
      setSelectedIds(new Set(selectedIds));
      addToast('Assessment deleted', 'success');
      setConfirmDeleteId(null);
      setShowDeleteModal(false);
    } catch {
      addToast('Delete failed. Please try again.', 'error'); // Notify user of failure
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

  // Render Skeleton Loading State
  const renderSkeletonTable = () => (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Skeleton className="w-4 h-4" />
            </TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead className="text-center">Score</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, idx) => (
            <TableRow key={idx}>
              <TableCell>
                <Skeleton className="w-4 h-4" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-[250px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-[100px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-[80px] mx-auto" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-[150px]" />
              </TableCell>
              <TableCell>
                <div className="flex justify-center gap-2">
                  <Skeleton className="w-20 h-9" />
                  <Skeleton className="w-20 h-9" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <AppContainer
      headerProps={{
        title: 'My Assessments',
        subtitle: 'Review and manage your saved circularity evaluations.',
      }}
    >
      {/* Authentication check */}
      {!authLoading && !isAuthenticated && (
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4 text-6xl">🔐</div>
            <CardTitle className="text-2xl">Authentication Required</CardTitle>
            <CardDescription>
              You need to log in to view and manage your assessments.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate('/login')} size="lg">
              Go to Login
            </Button>
          </CardContent>
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
          {/* Stats Cards */}
          {assessments.length > 0 && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2 text-xs font-semibold">
                    <TrendingUp className="w-4 h-4" />
                    Total Assessments
                  </CardDescription>
                  <CardTitle className="text-4xl font-bold text-primary">
                    {assessments.length}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                    <Award className="w-4 h-4" />
                    Average Score
                  </CardDescription>
                  <CardTitle className="text-4xl font-bold text-blue-600">
                    {Math.round(
                      assessments.reduce((sum, a) => sum + (a.overall_score || 0), 0) /
                        assessments.length,
                    )}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2 text-xs font-semibold text-purple-700">
                    <TrendingUp className="w-4 h-4" />
                    Highest Score
                  </CardDescription>
                  <CardTitle className="text-4xl font-bold text-purple-600">
                    {Math.max(...assessments.map((a) => a.overall_score || 0))}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2 text-xs font-semibold text-orange-700">
                    <Building className="w-4 h-4" />
                    Unique Industries
                  </CardDescription>
                  <CardTitle className="text-4xl font-bold text-orange-600">
                    {new Set(assessments.map((a) => a.industry)).size}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
          )}

          {/* Quick Tip Card */}
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="pt-6">
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
            </CardContent>
          </Card>

          {/* Controls Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Filter by Industry</label>
                  <Select
                    value={filterIndustry}
                    onValueChange={(value) => {
                      setFilterIndustry(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getIndustries().map((ind) => (
                        <SelectItem key={ind} value={ind}>
                          {ind === 'all' ? 'All Industries' : ind.replace(/_/g, ' ').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Sort by</label>
                  <Select
                    value={sortBy}
                    onValueChange={(value) => {
                      setSortBy(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Date Created</SelectItem>
                      <SelectItem value="overall_score">Score</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="industry">Industry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Search</label>
                  <div className="relative">
                    <Search className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
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
                <div className="text-sm font-medium text-muted-foreground">
                  {selectedIds.size} assessment{selectedIds.size !== 1 ? 's' : ''} selected
                </div>
                <div className="flex gap-2">
                  {selectedIds.size > 0 && (
                    <Button variant="outline" onClick={handleClearSelection}>
                      Clear Selection
                    </Button>
                  )}
                  <Button
                    onClick={handleCompareSelected}
                    disabled={selectedIds.size !== 2}
                    className="gap-2"
                  >
                    <GitCompare className="w-4 h-4" />
                    Compare Selected
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="space-y-4">
            {/* Loading State with Skeletons */}
            {loading && renderSkeletonTable()}

            {/* Error State */}
            {!loading && error && (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="mb-4 text-destructive">
                    <p className="text-lg font-semibold">Error loading assessments</p>
                    <p className="mt-2 text-sm text-muted-foreground">{error}</p>
                  </div>
                  <div className="flex justify-center gap-3">
                    <Button onClick={fetchAssessments}>Retry</Button>
                    <Button variant="outline" onClick={handleBack}>
                      Back to Home
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!loading && !error && filteredAssessments.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 rounded-full bg-muted">
                      <Ghost className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </div>
                  <CardTitle className="mb-2">No assessments found</CardTitle>
                  <CardDescription className="mb-6">
                    {searchTerm || filterIndustry !== 'all'
                      ? 'No assessments match your current filters. Try adjusting your search.'
                      : 'Create your first audit to see results here.'}
                  </CardDescription>
                  <Button onClick={handleBack} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Your First Audit
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Table with Data */}
            {!loading && !error && filteredAssessments.length > 0 && (
              <>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              selectedIds.size === assessments.length && assessments.length > 0
                            }
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedIds(new Set(assessments.map((a) => a.id)));
                              } else {
                                setSelectedIds(new Set());
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Industry</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssessments.map((assessment) => {
                        const status = getStatusBadge(assessment.overall_score);
                        return (
                          <TableRow
                            key={assessment.id}
                            className="group"
                            onMouseEnter={() => prefetchAssessment(assessment.id)}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.has(assessment.id)}
                                onCheckedChange={() => handleToggleSelect(assessment.id)}
                              />
                            </TableCell>
                            <TableCell className="font-semibold">
                              {assessment.title || 'Untitled Assessment'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="font-medium">
                                {(assessment.industry || 'General').replace(/_/g, ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={getRatingVariant(assessment.overall_score)}
                                className="text-base font-semibold"
                              >
                                {assessment.overall_score}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant}>{status.text}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatTimestamp(assessment.created_at)}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDetail(assessment.id)}
                                  onMouseEnter={() => prefetchAssessment(assessment.id)}
                                  className="gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  View
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => handleViewDetail(assessment.id)}
                                      className="gap-2"
                                    >
                                      <Eye className="w-4 h-4" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDelete(assessment.id)}
                                      className="gap-2 text-destructive focus:text-destructive"
                                      disabled={isDeleting && confirmDeleteId === assessment.id}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      {isDeleting && confirmDeleteId === assessment.id
                                        ? 'Deleting...'
                                        : 'Delete'}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {total > pageSize && (
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of{' '}
                      {total} results
                    </div>
                    <div className="flex items-center gap-4">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setPage(Math.max(1, page - 1))}
                              className={cn(
                                page <= 1 && 'pointer-events-none opacity-50',
                                'cursor-pointer',
                              )}
                            />
                          </PaginationItem>
                          {Array.from({ length: Math.ceil(total / pageSize) })
                            .map((_, i) => i + 1)
                            .filter(
                              (p) =>
                                p === 1 ||
                                p === Math.ceil(total / pageSize) ||
                                Math.abs(p - page) <= 1,
                            )
                            .map((p, idx, arr) => (
                              <React.Fragment key={p}>
                                {idx > 0 && arr[idx - 1] !== p - 1 && (
                                  <PaginationItem>
                                    <span className="px-2">...</span>
                                  </PaginationItem>
                                )}
                                <PaginationItem>
                                  <PaginationLink
                                    onClick={() => setPage(p)}
                                    isActive={page === p}
                                    className="cursor-pointer"
                                  >
                                    {p}
                                  </PaginationLink>
                                </PaginationItem>
                              </React.Fragment>
                            ))}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() =>
                                setPage(Math.min(Math.ceil(total / pageSize), page + 1))
                              }
                              className={cn(
                                page >= Math.ceil(total / pageSize) &&
                                  'pointer-events-none opacity-50',
                                'cursor-pointer',
                              )}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Per page:</label>
                        <Select
                          value={String(pageSize)}
                          onValueChange={(value) => {
                            setPageSize(Number(value));
                            setPage(1);
                          }}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[10, 20, 50, 100].map((n) => (
                              <SelectItem key={n} value={String(n)}>
                                {n}
                              </SelectItem>
                            ))}
                          </SelectContent>
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
            <Button variant="outline" onClick={handleBack} className="gap-2">
              ← Back to Home
            </Button>
          </div>

          {/* AlertDialog for Deletion Confirmation */}
          <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this assessment?
                  {confirmDeleteAssessment && (
                    <div className="p-3 mt-3 rounded-lg bg-muted">
                      <div className="font-semibold text-foreground">
                        {confirmDeleteAssessment.title || 'Untitled Assessment'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(confirmDeleteAssessment.created_at).toLocaleString()} •{' '}
                        {confirmDeleteAssessment.industry || 'General'}
                      </div>
                    </div>
                  )}
                  <p className="mt-3 text-sm font-semibold text-destructive">
                    This action cannot be undone.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => proceedDelete(confirmDeleteId)}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </AppContainer>
  );
}

MyAssessmentsPage.propTypes = {};
