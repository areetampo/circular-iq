import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HistoryView.css';

export default function HistoryView({ onViewDetail }) {
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortBy, setSortBy] = useState('created_at');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssessments();
  }, [sortBy, filterIndustry]);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        sortBy,
        order: 'desc',
        limit: 100,
      });

      if (filterIndustry !== 'all') {
        queryParams.append('industry', filterIndustry);
      }

      const response = await fetch(`${apiBase}/assessments?${queryParams}`);
      const data = await response.json();
      setAssessments(data.assessments || []);
      setError(null);
    } catch (err) {
      setError('Failed to load assessments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assessment?')) return;

    try {
      const response = await fetch(`${apiBase}/assessments/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Delete failed');

      setAssessments(assessments.filter((a) => a.id !== id));
      selectedIds.delete(id);
      setSelectedIds(new Set(selectedIds));
    } catch (err) {
      alert('Failed to delete assessment');
      console.error(err);
    }
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
      alert('Please select exactly 2 assessments to compare');
      return;
    }

    const ids = Array.from(selectedIds);
    navigate(`/compare/${ids[0]}/${ids[1]}`);
  };

  const handleViewDetail = (id) => {
    navigate(`/assessments/${id}`);
  };

  const getIndustries = () => {
    const industries = new Set(assessments.map((a) => a.industry).filter(Boolean));
    return ['all', ...Array.from(industries)];
  };

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
        <div className="history-controls">
          <div className="control-group">
            <label>Filter by Industry:</label>
            <select value={filterIndustry} onChange={(e) => setFilterIndustry(e.target.value)}>
              {getIndustries().map((ind) => (
                <option key={ind} value={ind}>
                  {ind === 'all' ? 'All Industries' : ind.replace(/_/g, ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="created_at">Latest</option>
              <option value="overall_score">Highest Score</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>

          <div className="control-group compare-wrapper">
            <button
              className="compare-button"
              onClick={handleCompareSelected}
              disabled={selectedIds.size !== 2}
              title={
                selectedIds.size !== 2
                  ? 'Select exactly 2 assessments to compare'
                  : 'Compare selected assessments'
              }
            >
              Compare Selected ({selectedIds.size}/2)
            </button>
          </div>
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
          {loading && <p className="loading">Loading assessments...</p>}
          {error && <p className="error">{error}</p>}

          {!loading && assessments.length === 0 && (
            <div className="empty-state">
              <p>No assessments saved yet.</p>
              <p>Complete an evaluation and click "Save Assessment" to start tracking.</p>
            </div>
          )}

          {!loading && assessments.length > 0 && (
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
                {assessments.map((assessment) => (
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
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
