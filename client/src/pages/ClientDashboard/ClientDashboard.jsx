import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import * as jobService from '../../services/jobService';
import { formatDate, formatBudget, formatRelativeTime } from '../../utils/helpers';
import { JOB_STATUS } from '../../utils/constants';
import Spinner from '../../components/Spinner/Spinner';
import EmptyState from '../../components/EmptyState/EmptyState';
import './ClientDashboard.css';

const ClientDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      // Backend returns { success: true, jobs: [...], totalJobs, totalPages }
      const data = await jobService.getJobs({ limit: 100 });
      const allJobs = data.jobs || [];
      // Filter to only this client's jobs
      const myJobs = allJobs.filter(
        (job) => job.client?._id === user?._id || job.client === user?._id
      );
      setJobs(myJobs);
    } catch (err) {
      showToast('Failed to load jobs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const total = jobs.length;
    const active = jobs.filter(
      (j) => j.status === 'in-progress' || j.status === 'in_progress'
    ).length;
    const completed = jobs.filter((j) => j.status === 'completed').length;
    const totalApplications = jobs.reduce(
      (sum, j) => sum + (j.applications?.length || j.applicationsCount || 0),
      0
    );
    return { total, active, completed, totalApplications };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (filter === 'all') return jobs;
    return jobs.filter((j) => j.status === filter);
  }, [jobs, filter]);

  const handleDelete = async (jobId) => {
    try {
      setDeleting(true);
      await jobService.deleteJob(jobId);
      showToast('Job deleted successfully', 'success');
      setDeleteConfirm(null);
      fetchJobs();
    } catch (err) {
      showToast('Failed to delete job', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusClass = (status) => {
    const map = {
      open: 'status-open',
      'in-progress': 'status-active',
      in_progress: 'status-active',
      completed: 'status-completed',
      closed: 'status-closed',
    };
    return map[status] || 'status-open';
  };

  const getStatusLabel = (status) => {
    const map = {
      open: 'Open',
      'in-progress': 'In Progress',
      in_progress: 'In Progress',
      completed: 'Completed',
      closed: 'Closed',
    };
    return map[status] || status;
  };

  if (loading) {
    return (
      <div className="page-container container fade-in">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="page-container container fade-in">
      {/* Welcome Header */}
      <div className="dashboard-welcome">
        <div className="welcome-text">
          <h1 className="welcome-title">
            Welcome back, {user?.name || 'Client'}! <span className="wave-emoji">👋</span>
          </h1>
          <p className="welcome-subtitle">
            Manage your projects and find top talent
          </p>
        </div>
        <Link to="/client/create-job" className="btn-post-job">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Post a New Job
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card--blue">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total Jobs Posted</span>
          </div>
        </div>
        <div className="stat-card stat-card--green">
          <div className="stat-icon">🚀</div>
          <div className="stat-info">
            <span className="stat-number">{stats.active}</span>
            <span className="stat-label">Active Projects</span>
          </div>
        </div>
        <div className="stat-card stat-card--purple">
          <div className="stat-icon">📨</div>
          <div className="stat-info">
            <span className="stat-number">{stats.totalApplications}</span>
            <span className="stat-label">Applications Received</span>
          </div>
        </div>
        <div className="stat-card stat-card--gold">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-number">{stats.completed}</span>
            <span className="stat-label">Completed Projects</span>
          </div>
        </div>
      </div>

      {/* My Jobs Section */}
      <div className="jobs-section">
        <div className="section-header">
          <h2 className="section-title">My Jobs</h2>
          <select
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Jobs</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {filteredJobs.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No jobs posted yet"
            message="Start by posting your first job"
            actionText="Post a Job"
            actionLink="/client/create-job"
          />
        ) : (
          <div className="jobs-list">
            {filteredJobs.map((job) => (
              <div className="job-card-dashboard" key={job._id}>
                <div className="job-card-main">
                  <div className="job-card-top">
                    <Link to={`/jobs/${job._id}`} className="job-card-title">
                      {job.title}
                    </Link>
                    <span className={`status-badge ${getStatusClass(job.status)}`}>
                      {getStatusLabel(job.status)}
                    </span>
                  </div>

                  <div className="job-card-meta">
                    {job.category && (
                      <span className="category-badge">{job.category}</span>
                    )}
                    <span className="meta-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                      {formatBudget(job.budgetMin, job.budgetMax)}
                    </span>
                    <span className="meta-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {formatDate ? formatDate(job.createdAt) : job.createdAt}
                    </span>
                    <span className="meta-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      {job.applications?.length || job.applicationsCount || 0} Applications
                    </span>
                  </div>
                </div>

                <div className="job-card-actions">
                  <Link
                    to={`/client/applications/${job._id}`}
                    className="btn-action btn-view"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    View Applications
                    {(job.applications?.length || job.applicationsCount) > 0 && (
                      <span className="app-count-badge">
                        {job.applications?.length || job.applicationsCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to={`/client/edit-job/${job._id}`}
                    className="btn-action btn-edit"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit
                  </Link>
                  <button
                    className="btn-action btn-delete"
                    onClick={() => setDeleteConfirm(job._id)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Delete
                  </button>
                </div>

                {/* Delete Confirm Dialog */}
                {deleteConfirm === job._id && (
                  <div className="delete-confirm-overlay">
                    <div className="delete-confirm-dialog">
                      <div className="delete-confirm-icon">⚠️</div>
                      <h3>Delete this job?</h3>
                      <p>This action cannot be undone. All applications will also be removed.</p>
                      <div className="delete-confirm-actions">
                        <button
                          className="btn-cancel"
                          onClick={() => setDeleteConfirm(null)}
                          disabled={deleting}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn-confirm-delete"
                          onClick={() => handleDelete(job._id)}
                          disabled={deleting}
                        >
                          {deleting ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
