import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import * as applicationService from '../../services/applicationService';
import { formatDate, formatBudget, formatRelativeTime } from '../../utils/helpers';
import Spinner from '../../components/Spinner/Spinner';
import EmptyState from '../../components/EmptyState/EmptyState';
import './MyApplications.css';

/**
 * MyApplications - Freelancer view of all submitted applications.
 * Shows job title, budget, status badge, and applied date.
 */
const MyApplications = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      // Backend returns { success: true, applications: [...] }
      const data = await applicationService.getMyApplications();
      setApplications(data.applications || []);
    } catch (err) {
      showToast('Failed to load your applications.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const STATUS_FILTERS = ['all', 'pending', 'reviewed', 'accepted', 'rejected', 'completed'];

  const filtered = filter === 'all'
    ? applications
    : applications.filter(app => app.status === filter);

  const getStatusMeta = (status) => {
    switch (status) {
      case 'completed': return { label: 'Completed ✅', className: 'badge--completed' };
      case 'accepted': return { label: 'Accepted', className: 'badge--success' };
      case 'rejected': return { label: 'Rejected', className: 'badge--error' };
      case 'reviewed': return { label: 'Reviewed', className: 'badge--warning' };
      default:         return { label: 'Pending',  className: 'badge--info' };
    }
  };

  if (loading) return <Spinner size="lg" fullPage />;

  return (
    <div className="page-container fade-in">
      <div className="container my-apps-container">
        {/* Header */}
        <div className="my-apps-header">
          <div>
            <h1 className="my-apps-title">My Applications</h1>
            <p className="my-apps-subtitle">
              Track all {applications.length} application{applications.length !== 1 ? 's' : ''} you've submitted
            </p>
          </div>
          <Link to="/freelancer/browse-jobs" className="my-apps-browse-btn">
            Browse More Jobs
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="my-apps-filters">
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'filter-tab--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'all' && (
                <span className="filter-tab__count">{applications.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No applications yet"
            message={filter === 'all'
              ? "You haven't applied to any jobs yet. Start browsing open jobs!"
              : `No applications with status "${filter}".`}
            actionText="Browse Jobs"
            actionLink="/freelancer/browse-jobs"
          />
        ) : (
          <div className="my-apps-list">
            {filtered.map((app) => {
              const statusMeta = getStatusMeta(app.status);
              return (
                <div key={app._id} className="app-card">
                  <div className="app-card__main">
                    <div className="app-card__info">
                      <Link to={`/jobs/${app.job?._id}`} className="app-card__job-title">
                        {app.job?.title || 'Job (removed)'}
                      </Link>
                      <div className="app-card__meta">
                        {app.job?.budget && (
                          <span className="app-card__budget">
                            💰 {formatBudget(app.job.budget.min, app.job.budget.max)}
                          </span>
                        )}
                        {app.job?.category && (
                          <span className="app-card__category">🏷 {app.job.category}</span>
                        )}
                        <span className="app-card__date">
                          Applied {formatRelativeTime(app.createdAt)}
                        </span>
                      </div>

                      {/* Cover letter preview */}
                      {app.coverLetter && (
                        <p className="app-card__cover-preview">
                          "{app.coverLetter.slice(0, 150)}{app.coverLetter.length > 150 ? '…' : ''}"
                        </p>
                      )}
                    </div>

                    <div className="app-card__right">
                      <span className={`badge ${statusMeta.className}`}>
                        {statusMeta.label}
                      </span>
                      {app.bidAmount && (
                        <span className="app-card__bid">
                          Your bid: <strong>${app.bidAmount.toLocaleString()}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Client feedback if available */}
                  {app.clientNote && (
                    <div className="app-card__feedback">
                      <span className="app-card__feedback-label">Client Note:</span>
                      <p>{app.clientNote}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;
