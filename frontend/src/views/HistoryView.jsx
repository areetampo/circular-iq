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
        <div className="history-controls">
          <div className="control-group">
            <label>Filter by Industry:</label>
            <select
              value={filterIndustry}
              onChange={(e) => {
                setFilterIndustry(e.target.value);
                setPage(1);
              }}
            >
              {getIndustries().map((ind) => (
                <option key={ind} value={ind}>
                  {ind === 'all' ? 'All Industries' : ind.replace(/_/g, ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
            >
              <option value="created_at">Latest</option>
              <option value="overall_score">Highest Score</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>

          <div className="control-group" style={{ minWidth: '220px' }}>
            <label>Search:</label>
            <input
              type="search"
              value={searchTerm}
              placeholder="Search title or industry"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="action-btn"
                style={{ marginTop: '0.5rem' }}
                onClick={() => {
                  setSearchTerm('');
                  setPage(1);
                  fetchAssessments();
                }}
              >
                Clear
              </button>
            )}
          </div>

          <div className="control-group compare-wrapper">
            <button
              className="compare-button"
              onClick={handleCompareSelected}
              disabled={selectedIds.size !== 2 || loading}
              title={
                selectedIds.size !== 2
                  ? 'Select exactly 2 assessments to compare'
                  : 'Compare selected assessments'
              }
            >
              Compare Selected ({selectedIds.size}/2)
            </button>
          </div>

          <div className="control-group" style={{ alignItems: 'flex-end' }}>
            <button className="compare-button" onClick={fetchAssessments} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          <div className="control-group" style={{ alignItems: 'flex-end' }}>
            <button
              className="compare-button"
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
              Clear Filters
            </button>
          </div>
        </div>

        {/* Quick Tip */}
        <div
          style={{
            background: '#f5f9ff',
            border: '2px dashed #4a90e2',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            fontSize: '0.95rem',
            color: '#555',
          }}
        >
          <strong style={{ color: '#1976d2' }}>💡 Tip:</strong> Select exactly 2 assessments and
          click "Compare Selected" to see how your initiative evolved over time, or compare
          different strategies side-by-side.
        </div>

        {/* Stats Card */}
        {assessments.length > 0 && (
          <div className="stats-card">
            <div className="stat">
              <div className="stat-label">Total Assessments</div>
              <div className="stat-value">{assessments.length}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Average Score</div>
              <div className="stat-value">
                {Math.round(
                  assessments.reduce((sum, a) => sum + (a.overall_score || 0), 0) /
                    assessments.length,
                )}
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">Highest Score</div>
              <div className="stat-value">
                {Math.max(...assessments.map((a) => a.overall_score || 0))}
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">Unique Industries</div>
              <div className="stat-value">{new Set(assessments.map((a) => a.industry)).size}</div>
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
            <table className="assessments-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(new Set(assessments.map((a) => a.id)));
                        } else {
                          setSelectedIds(new Set());
                        }
                      }}
                    />
                  </th>
                  <th>Title</th>
                  <th>Industry</th>
                  <th>Score</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssessments.map((assessment) => (
                  <tr key={assessment.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(assessment.id)}
                        onChange={() => handleToggleSelect(assessment.id)}
                      />
                    </td>
                    <td className="title-cell">
                      <strong>{assessment.title || 'Untitled'}</strong>
                    </td>
                    <td className="industry-cell">
                      <span className="badge">{assessment.industry || 'General'}</span>
                    </td>
                    <td className="score-cell">
                      <div
                        className="score-badge"
                        style={{ color: getRatingColor(assessment.overall_score) }}
                      >
                        <strong>{assessment.overall_score}/100</strong>
                      </div>
                    </td>
                    <td className="date-cell">
                      {new Date(assessment.created_at).toLocaleDateString()}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="action-btn view-btn"
                        onClick={() => handleViewDetail(assessment.id)}
                      >
                        View
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(assessment.id)}
                        disabled={deletingIds.has(assessment.id)}
                      >
                        {deletingIds.has(assessment.id) ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {!loading && !error && total > 0 && (
            <div
              className="pagination-controls"
              style={{
                marginTop: '1rem',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ color: '#666' }}>
                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total} ·
                Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
              </span>
              <button
                className="action-btn"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1 || loading}
              >
                ← Prev
              </button>
              <button
                className="action-btn"
                onClick={() => setPage(page + 1)}
                disabled={page * pageSize >= total || loading}
              >
                Next →
              </button>
              <label style={{ marginLeft: '0.5rem' }}>Per page:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
