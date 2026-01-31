import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { getSessionId } from '@/utils/session';
import { useToast } from '@/hooks/useToast';
import Loader from '@/components/common/Loader';
import AppContainer from '@/components/layout/AppContainer';
import { formatTimestamp } from '@/lib/formatting';
import { useAssessments } from '@/features/assessments';

export default function MyAssessmentsPage({ onViewDetail = () => {}, onBack = () => {} }) {
  const navigate = useNavigate();
  const [initialLoad, setInitialLoad] = useState(true);
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

  const {
    assessments,
    total,
    isLoading,
    isError,
    error,
    refetch,
    removeAssessment,
    isDeleting,
    deleteError,
  } = useAssessments({
    sessionId: getSessionId(),
    page: String(page),
    pageSize: String(pageSize),
    sortBy,
    order: 'desc',
    search: searchRef.current,
    industry: filterIndustry !== 'all' ? filterIndustry : undefined,
  });

  const loading = isLoading;

  useEffect(() => {
    if (!isLoading) {
      setInitialLoad(false);
    }
  }, [isLoading]);

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
      selectedIds.delete(id);
      setSelectedIds(new Set(selectedIds));
      addToast('Assessment deleted', 'success');
      setConfirmDeleteId(null);
      setShowDeleteModal(false);
    } catch (err) {
      // Global error handler will show the error toast
      // Just cleanup the UI state
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
      addToast('Select exactly 2 assessments to compare', 'warning');
      return;
    }

    const ids = Array.from(selectedIds);
    navigate(`/compare/${ids[0]}/${ids[1]}`);
  };

  const handleViewDetail = (id) => {
    if (onViewDetail) {
      onViewDetail(id);
      return;
    }
    navigate(`/assessments/${id}`);
  };

  const getIndustries = () => {
    const industries = new Set(assessments.map((a) => a.industry).filter(Boolean));
    return ['all', ...Array.from(industries)];
  };

  // Delete confirmation modal
  const renderDeleteModal = () => {
    if (!showDeleteModal || !confirmDeleteId) return null;
    const target = assessments.find((a) => a.id === confirmDeleteId);
    return (
      <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
        <div
          className="modal-dialog"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: '520px' }}
        >
          <div className="modal-header">
            <h2>Delete Assessment</h2>
            <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
              ×
            </button>
          </div>
          <div className="modal-body" style={{ lineHeight: 1.7 }}>
            <p style={{ marginBottom: '0.75rem' }}>
              Are you sure you want to delete this assessment?
            </p>
            {target && (
              <div
                style={{
                  background: '#f8f9fa',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  padding: '0.75rem',
                }}
              >
                <div style={{ fontWeight: 600, color: '#2c3e50' }}>
                  {target.title || 'Untitled Assessment'}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  {new Date(target.created_at).toLocaleString()} • {target.industry || 'General'}
                </div>
              </div>
            )}
            <p style={{ marginTop: '0.75rem', color: '#b00020' }}>This action cannot be undone.</p>
          </div>
          <div
            className="modal-footer"
            style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}
          >
            <button className="modal-cancel-button" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </button>
            <button
              className="bg-[#dc3545] text-white border border-[#c82333] py-2 px-4 rounded-md font-bold cursor-pointer transition-[background,box-shadow] duration-200 hover:bg-[#c82333] hover:shadow-[0_2px_8px_rgba(220,53,69,0.2)]"
              onClick={() => proceedDelete(confirmDeleteId)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const filteredAssessments = assessments.filter((assessment) => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    const titleMatch = (assessment.title || '').toLowerCase().includes(search);
    const industryMatch = (assessment.industry || '').toLowerCase().includes(search);
    return titleMatch || industryMatch;
  });

  const getRatingColor = (score) => {
    return score >= 75
      ? 'bg-emerald-100 text-emerald-700'
      : score >= 50
        ? 'bg-amber-100 text-amber-700'
        : 'bg-rose-100 text-rose-700';
  };

  return (
    <AppContainer
      headerProps={{
        title: 'My Assessments',
        subtitle: 'Review and manage your saved circularity evaluations.',
      }}
    >
      {/* Stats Card */}
      {assessments.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
          <div className="p-6 text-center border-2 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 rounded-xl">
            <div className="mb-2 text-sm font-semibold text-emerald-700">Total Assessments</div>
            <div className="text-4xl font-bold text-emerald-600">{assessments.length}</div>
          </div>
          <div className="p-6 text-center border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
            <div className="mb-2 text-sm font-semibold text-blue-700">Average Score</div>
            <div className="text-4xl font-bold text-blue-600">
              {Math.round(
                assessments.reduce((sum, a) => sum + (a.overall_score || 0), 0) /
                  assessments.length,
              )}
            </div>
          </div>
          <div className="p-6 text-center border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
            <div className="mb-2 text-sm font-semibold text-purple-700">Highest Score</div>
            <div className="text-4xl font-bold text-purple-600">
              {Math.max(...assessments.map((a) => a.overall_score || 0))}
            </div>
          </div>
          <div className="p-6 text-center border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl">
            <div className="mb-2 text-sm font-semibold text-orange-700">Unique Industries</div>
            <div className="text-4xl font-bold text-orange-600">
              {new Set(assessments.map((a) => a.industry)).size}
            </div>
          </div>
        </div>
      )}

      {/* Quick Tip */}
      <div className="p-5 mb-6 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <span className="font-bold text-blue-800">Tip:</span>
            <span className="ml-2 text-slate-700">
              Select exactly 2 assessments and click &quot;Compare Selected&quot; to see how your
              initiative evolved over time, or compare different strategies side-by-side.
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      {renderDeleteModal()}
      <div className="p-6 mb-6 bg-white shadow-md rounded-xl">
        <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-semibold text-slate-700">Filter by Industry:</label>
            <select
              value={filterIndustry}
              onChange={(e) => {
                setFilterIndustry(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white hover:border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 transition-all"
            >
              {getIndustries().map((ind) => (
                <option key={ind} value={ind}>
                  {ind === 'all' ? 'All Industries' : ind.replace(/_/g, ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="mb-2 text-sm font-semibold text-slate-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white hover:border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 transition-all"
            >
              <option value="created_at">Date Created</option>
              <option value="overall_score">Score</option>
              <option value="title">Title</option>
              <option value="industry">Industry</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="mb-2 text-sm font-semibold text-slate-700">Search:</label>
            <input
              type="text"
              placeholder="Search by title or industry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white hover:border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200">
          <div className="text-sm font-medium text-slate-600">
            {selectedIds.size} assessment{selectedIds.size !== 1 ? 's' : ''} selected
          </div>
          <button
            onClick={handleCompareSelected}
            disabled={selectedIds.size !== 2}
            className="bg-[#34a83a] text-white border-none py-2.5 px-5 rounded-md font-semibold cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#2a8a2f] hover:shadow-[0_2px_8px_rgba(52,168,58,0.3)] disabled:text-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Compare Selected
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        {initialLoad && loading && (
          <Loader heading="Loading assessments..." message="Fetching your saved evaluations." />
        )}
        {!initialLoad && loading && (
          <Loader
            heading="Refreshing assessments..."
            message="Please wait while we update the list."
          />
        )}
        {error && (
          <div className="py-8 text-center text-[#dc3545]">
            <p>{error}</p>
            <button
              className="py-2 px-4 border-none rounded cursor-pointer text-[0.85rem] font-semibold transition-[background] duration-200 bg-[#4a90e2] text-white hover:bg-[#357abd] mr-2"
              onClick={fetchAssessments}
            >
              Retry
            </button>
            {onBack && (
              <button
                className="py-2 px-4 border-none rounded cursor-pointer text-[0.85rem] font-semibold transition-[background] duration-200 bg-[#4a90e2] text-white hover:bg-[#357abd]"
                onClick={onBack}
              >
                Back
              </button>
            )}
          </div>
        )}

        {!loading && !error && filteredAssessments.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <p>No assessments match the current filters.</p>
            <p>Try clearing filters or run a new evaluation and save it.</p>
            {onBack && (
              <button
                className="mt-4 py-2 px-4 border-none rounded cursor-pointer text-[0.85rem] font-semibold transition-[background] duration-200 bg-[#4a90e2] text-white hover:bg-[#357abd]"
                onClick={onBack}
              >
                Start an Evaluation
              </button>
            )}
          </div>
        )}

        {!loading && !error && filteredAssessments.length > 0 && (
          <div className="relative overflow-x-auto bg-white border-2 border-gray-300 rounded-lg">
            <table className="w-full border-collapse">
              <thead className="border-b-2 border-gray-300 bg-gradient-to-r from-slate-100 to-slate-200">
                <tr>
                  <th className="px-4 py-4 text-left border-b border-gray-300 font-bold text-[#2c3e50]">
                    <input
                      type="checkbox"
                      className="w-4 h-4 cursor-pointer accent-emerald-600"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(new Set(assessments.map((a) => a.id)));
                        } else {
                          setSelectedIds(new Set());
                        }
                      }}
                    />
                  </th>
                  <th className="px-4 md:px-6 py-4 text-left border-b border-gray-300 font-bold text-[#2c3e50] text-sm tracking-wider uppercase">
                    Title
                  </th>
                  <th className="px-4 md:px-6 py-4 text-left border-b border-gray-300 font-bold text-[#2c3e50] text-sm tracking-wider uppercase">
                    Industry
                  </th>
                  <th className="px-4 md:px-6 py-4 text-center border-b border-gray-300 font-bold text-[#2c3e50] text-sm tracking-wider uppercase">
                    Score
                  </th>
                  <th className="px-4 md:px-6 py-4 text-left border-b border-gray-300 font-bold text-[#2c3e50] text-sm tracking-wider uppercase">
                    Created
                  </th>
                  <th className="px-4 md:px-6 py-4 text-center border-b border-gray-300 font-bold text-[#2c3e50] text-sm tracking-wider uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAssessments.map((assessment) => (
                  <tr
                    key={assessment.id}
                    className="transition-colors even:bg-slate-100 hover:bg-slate-200"
                  >
                    <td className="px-4 py-4 text-left border-b border-gray-300">
                      <input
                        type="checkbox"
                        className="w-4 h-4 cursor-pointer accent-emerald-600"
                        checked={selectedIds.has(assessment.id)}
                        onChange={() => handleToggleSelect(assessment.id)}
                      />
                    </td>
                    <td className="px-4 py-4 text-left border-b border-gray-300 md:px-6">
                      <div className="font-semibold text-slate-800">
                        {assessment.title || 'Untitled'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-left border-b border-gray-300 md:px-6">
                      <span className="inline-block px-3 py-1 text-sm font-semibold text-blue-700 uppercase bg-blue-100 rounded-full text-nowrap">
                        {assessment.industry.replace(/_/g, ' ') || 'General'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center border-b border-gray-300 md:px-6">
                      <div
                        className={`inline-block px-2 py-1 rounded-lg font-semibold text-lg text-nowrap ${getRatingColor(
                          assessment.overall_score,
                        )}`}
                      >
                        {assessment.overall_score} / 100
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-left border-b border-gray-300 md:px-6 text-slate-600">
                      {formatTimestamp(assessment.created_at)}
                    </td>
                    <td className="px-4 py-4 border-b border-gray-300 md:px-6">
                      <div className="flex flex-col justify-center gap-2">
                        <button
                          className="p-2 text-sm font-medium text-white transition-all bg-blue-500 rounded-lg shadow-md hover:bg-blue-600 hover:scale-105"
                          onClick={() => handleViewDetail(assessment.id)}
                        >
                          View
                        </button>
                        <button
                          className="p-2 text-sm font-medium text-white transition-all bg-red-500 rounded-lg shadow-md hover:bg-red-600 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleDelete(assessment.id)}
                          disabled={isDeleting && confirmDeleteId === assessment.id}
                        >
                          {isDeleting && confirmDeleteId === assessment.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && total > 0 && (
          <div className="flex flex-row flex-wrap items-center justify-center p-5 mt-6 gap-y-2 gap-x-10">
            <div className="flex justify-center items-center min-h-[40px]">
              <p className="text-sm font-medium text-center text-slate-600">
                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
                &nbsp; · Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-slate-300"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1 || loading}
              >
                ← Previous
              </button>
              <button
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-slate-300"
                onClick={() => setPage(page + 1)}
                disabled={page * pageSize >= total || loading}
              >
                Next →
              </button>
              <div className="flex items-center gap-2 ml-2">
                <label className="text-sm font-semibold text-slate-700">Per page:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-3 py-2 text-sm transition-all bg-white border rounded-lg border-slate-300 hover:border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {onBack && (
        <div className="flex justify-start mt-8">
          <button
            className="bg-gray-100 text-[#2c3e50] border border-gray-300 py-3 px-6 rounded-md font-semibold cursor-pointer transition-[background] duration-200 hover:bg-[#e8e8e8]"
            onClick={onBack}
          >
            ← Back to Home
          </button>
        </div>
      )}
    </AppContainer>
  );
}

MyAssessmentsPage.propTypes = {
  onViewDetail: PropTypes.func,
  onBack: PropTypes.func,
};
