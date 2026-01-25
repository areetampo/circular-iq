import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HistoryView.css';
import { getSessionId } from '../utils/session';
import { useToast } from '../hooks/useToast';

export default function HistoryView({ onViewDetail, onBack }) {
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortBy, setSortBy] = useState('created_at');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetchAssessments();
  }, [sortBy, filterIndustry, page, pageSize]);

  // Debounce search to avoid excessive requests
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchAssessments();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const fetchAssessments = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        sortBy,
        order: 'desc',
        page: String(page),
        pageSize: String(pageSize),
      });

      if (filterIndustry !== 'all') {
        queryParams.append('industry', filterIndustry);
      }

      // Filter by sessionId to show only current session's assessments
      queryParams.append('sessionId', getSessionId());
      if (searchTerm && searchTerm.trim()) {
        queryParams.append('search', searchTerm.trim());
      }

      const response = await fetch(`${apiBase}/assessments?${queryParams}`);

      if (!response.ok) {
        const message = `Request failed (${response.status})`;
        throw new Error(message);
      }

      const data = await response.json();
      setAssessments(data.assessments || []);
      setTotal(Number(data.total || 0));
      setError(null);
    } catch (err) {
      const message = err?.message || 'Failed to load assessments';
      setError(message);
      addToast(message, 'error');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const proceedDelete = async (id) => {
    try {
      const nextDeleting = new Set(deletingIds);
      nextDeleting.add(id);
      setDeletingIds(nextDeleting);

      const response = await fetch(`${apiBase}/assessments/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Delete failed');

      setAssessments(assessments.filter((a) => a.id !== id));
      selectedIds.delete(id);
      setSelectedIds(new Set(selectedIds));
      addToast('Assessment deleted', 'success');
    } catch (err) {
      addToast('Failed to delete assessment', 'error');
      console.error(err);
    } finally {
      const nextDeleting = new Set(deletingIds);
      nextDeleting.delete(id);
      setDeletingIds(nextDeleting);
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
              className="danger-button"
              onClick={() => proceedDelete(confirmDeleteId)}
              disabled={deletingIds.has(confirmDeleteId)}
            >
              {deletingIds.has(confirmDeleteId) ? 'Deleting…' : 'Delete'}
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
    if (score >= 75) return '#28a745';
    if (score >= 50) return '#ffc107';
    return '#dc3545';
  };

  return (
    <div className="app-container">
      <div className="history-view">
        {/* Header */}
        <div className="header-section">
          <div className="logo-icon">
            <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="28" stroke="#34a83a" strokeWidth="3" fill="none" />
              <path
                d="M32 4 L32 20 M32 44 L32 60 M4 32 L20 32 M44 32 L60 32"
                stroke="#34a83a"
                strokeWidth="2"
              />
            </svg>
          </div>
          <h1 className="main-title">My Assessments</h1>
          <p className="subtitle">Portfolio of saved circular economy evaluations</p>
        </div>

        {/* Controls */}

        {renderDeleteModal()}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-slate-700 mb-2">
                Filter by Industry:
              </label>
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
              <label className="text-sm font-semibold text-slate-700 mb-2">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white hover:border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 transition-all"
              >
                <option value="created_at">Latest</option>
                <option value="overall_score">Highest Score</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-slate-700 mb-2">Search:</label>
              <input
                type="search"
                value={searchTerm}
                placeholder="Search title or industry"
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm hover:border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:scale-105"
              onClick={handleCompareSelected}
              disabled={selectedIds.size !== 2 || loading}
              title={
                selectedIds.size !== 2
                  ? 'Select exactly 2 assessments to compare'
                  : 'Compare selected assessments'
              }
            >
              🔄 Compare Selected ({selectedIds.size}/2)
            </button>
            <button
              className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 shadow-md hover:shadow-lg hover:scale-105"
              onClick={fetchAssessments}
              disabled={loading}
            >
              {loading ? '↻ Refreshing…' : '↻ Refresh'}
            </button>
            <button
              className="px-5 py-2.5 bg-slate-500 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 shadow-md hover:shadow-lg hover:scale-105"
              onClick={() => {
                setFilterIndustry('all');
                setSortBy('created_at');
                setSearchTerm('');
                setPage(1);
                setPageSize(10);
                fetchAssessments();
              }}
              disabled={loading}
            >
              ✖ Clear Filters
            </button>
          </div>
        </div>

        {/* Quick Tip */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <span className="font-bold text-blue-800">Tip:</span>
              <span className="text-slate-700 ml-2">
                Select exactly 2 assessments and click "Compare Selected" to see how your initiative
                evolved over time, or compare different strategies side-by-side.
              </span>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        {assessments.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6 text-center">
              <div className="text-sm font-semibold text-emerald-700 mb-2">Total Assessments</div>
              <div className="text-4xl font-bold text-emerald-600">{assessments.length}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 text-center">
              <div className="text-sm font-semibold text-blue-700 mb-2">Average Score</div>
              <div className="text-4xl font-bold text-blue-600">
                {Math.round(
                  assessments.reduce((sum, a) => sum + (a.overall_score || 0), 0) /
                    assessments.length,
                )}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 text-center">
              <div className="text-sm font-semibold text-purple-700 mb-2">Highest Score</div>
              <div className="text-4xl font-bold text-purple-600">
                {Math.max(...assessments.map((a) => a.overall_score || 0))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-6 text-center">
              <div className="text-sm font-semibold text-orange-700 mb-2">Unique Industries</div>
              <div className="text-4xl font-bold text-orange-600">
                {new Set(assessments.map((a) => a.industry)).size}
              </div>
            </div>
          </div>
        )}

        {/* Assessments Table */}
        <div className="assessments-table-container">
          {loading && initialLoad && (
            <div className="loading-block">
              <div className="loading-spinner" />
              <p className="loading">Loading assessments...</p>
              <p className="loading-sub">Fetching your saved evaluations.</p>
            </div>
          )}

          {!initialLoad && loading && (
            <div className="loading-overlay">
              <div className="loading-spinner" />
              <p>Refreshing…</p>
            </div>
          )}
          {error && (
            <div className="error">
              <p>{error}</p>
              <button className="action-btn view-btn" onClick={fetchAssessments}>
                Retry
              </button>
              {onBack && (
                <button className="action-btn" onClick={onBack}>
                  Back
                </button>
              )}
            </div>
          )}

          {!loading && !error && filteredAssessments.length === 0 && (
            <div className="empty-state">
              <p>No assessments match the current filters.</p>
              <p>Try clearing filters or run a new evaluation and save it.</p>
              {onBack && (
                <button className="action-btn view-btn" onClick={onBack}>
                  Start an Evaluation
                </button>
              )}
            </div>
          )}

          {!loading && !error && filteredAssessments.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-100 to-slate-200">
                  <tr>
                    <th className="px-4 py-4 text-left">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-emerald-600 cursor-pointer"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(new Set(assessments.map((a) => a.id)));
                          } else {
                            setSelectedIds(new Set());
                          }
                        }}
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                      Industry
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-slate-700 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAssessments.map((assessment) => (
                    <tr key={assessment.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-emerald-600 cursor-pointer"
                          checked={selectedIds.has(assessment.id)}
                          onChange={() => handleToggleSelect(assessment.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">
                          {assessment.title || 'Untitled'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold uppercase">
                          {assessment.industry || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div
                          className={`inline-block px-4 py-2 rounded-lg font-bold text-lg ${
                            assessment.overall_score >= 75
                              ? 'bg-green-100 text-green-700'
                              : assessment.overall_score >= 50
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {assessment.overall_score}/100
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm">
                        {new Date(assessment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-all hover:scale-105 shadow-md"
                            onClick={() => handleViewDetail(assessment.id)}
                          >
                            View
                          </button>
                          <button
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-all hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleDelete(assessment.id)}
                            disabled={deletingIds.has(assessment.id)}
                          >
                            {deletingIds.has(assessment.id) ? 'Deleting…' : 'Delete'}
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
            <div className="bg-white rounded-xl shadow-md p-5 mt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="text-sm text-slate-600 font-medium">
                  Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}{' '}
                  · Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
                </div>
                <div className="flex items-center gap-3">
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
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white hover:border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 transition-all"
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
