import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import * as applicationService from '../../services/applicationService';
import * as savedJobService from '../../services/savedJobService';
import { formatDate, formatBudget, formatRelativeTime } from '../../utils/helpers';
import Spinner from '../../components/Spinner/Spinner';
import EmptyState from '../../components/EmptyState/EmptyState';
import './FreelancerDashboard.css';

const FreelancerDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [appsData, savedData] = await Promise.all([
          applicationService.getMyApplications(),
          savedJobService.getSavedJobs(),
        ]);
        // Backend returns { success, applications } and { success, savedJobs }
        setApplications(appsData.applications || []);
        setSavedJobs(savedData.savedJobs || savedData.jobs || []);
      } catch (err) {
        showToast('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- computed stats ---------- */
  const stats = useMemo(() => {
    const total = applications.length;
    const accepted = applications.filter((a) => a.status === 'accepted').length;
    const pending = applications.filter((a) => a.status === 'pending').length;
    const saved = savedJobs.length;
    return { total, accepted, pending, saved };
  }, [applications, savedJobs]);

  /* ---------- helpers ---------- */
  const getStatusClass = (status) => {
    const map = {
      pending: 'fl-status-pending',
      accepted: 'fl-status-accepted',
      rejected: 'fl-status-rejected',
    };
    return map[status] || 'fl-status-pending';
  };

  const getStatusLabel = (status) => {
    const map = { pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected' };
    return map[status] || status;
  };

  /* ---------- loading ---------- */
  if (loading) {
    return (
      <div className="page-container container fade-in">
        <Spinner />
      </div>
    );
  }

  /* recent applications – latest 5 */
  const recentApps = [...applications]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="page-container container fade-in">
      {/* -------- Welcome Header -------- */}
      <div className="fl-dashboard-welcome">
        <div className="fl-welcome-text">
          <h1 className="fl-welcome-title">
            Welcome back, {user?.name || 'Freelancer'}!{' '}
            <span className="fl-wave-emoji">👋</span>
          </h1>
          <p className="fl-welcome-subtitle">
            Track your applications and discover new opportunities
          </p>
        </div>
        <Link to="/freelancer/browse-jobs" className="fl-btn-browse">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Browse Jobs
        </Link>
      </div>

      {/* -------- Stats Grid -------- */}
      <div className="fl-stats-grid">
        <div className="fl-stat-card fl-stat-card--blue">
          <div className="fl-stat-icon">📨</div>
          <div className="fl-stat-info">
            <span className="fl-stat-number">{stats.total}</span>
            <span className="fl-stat-label">Total Applications</span>
          </div>
        </div>
        <div className="fl-stat-card fl-stat-card--green">
          <div className="fl-stat-icon">✅</div>
          <div className="fl-stat-info">
            <span className="fl-stat-number">{stats.accepted}</span>
            <span className="fl-stat-label">Accepted</span>
          </div>
        </div>
        <div className="fl-stat-card fl-stat-card--gold">
          <div className="fl-stat-icon">⏳</div>
          <div className="fl-stat-info">
            <span className="fl-stat-number">{stats.pending}</span>
            <span className="fl-stat-label">Pending</span>
          </div>
        </div>
        <div className="fl-stat-card fl-stat-card--purple">
          <div className="fl-stat-icon">💜</div>
          <div className="fl-stat-info">
            <span className="fl-stat-number">{stats.saved}</span>
            <span className="fl-stat-label">Saved Jobs</span>
          </div>
        </div>
      </div>

      {/* -------- Recent Applications -------- */}
      <div className="fl-section">
        <div className="fl-section-header">
          <h2 className="fl-section-title">Recent Applications</h2>
          {applications.length > 5 && (
            <Link to="/freelancer/my-applications" className="fl-view-all">
              View All
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>

        {recentApps.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No applications yet"
            message="Start applying to jobs to see your applications here"
            actionText="Browse Jobs"
            actionLink="/freelancer/browse-jobs"
          />
        ) : (
          <div className="fl-applications-list">
            {recentApps.map((app) => (
              <div className="fl-app-card" key={app._id}>
                <div className="fl-app-main">
                  <Link
                    to={`/jobs/${app.job?._id || app.job}`}
                    className="fl-app-title"
                  >
                    {app.job?.title || 'Untitled Job'}
                  </Link>
                  <span className={`fl-status-badge ${getStatusClass(app.status)}`}>
                    {getStatusLabel(app.status)}
                  </span>
                </div>
                <div className="fl-app-meta">
                  <span className="fl-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    {app.job?.client?.name || 'Client'}
                  </span>
                  <span className="fl-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    ${app.proposedBudget || '—'}
                  </span>
                  <span className="fl-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {formatRelativeTime
                      ? formatRelativeTime(app.createdAt)
                      : formatDate
                        ? formatDate(app.createdAt)
                        : app.createdAt}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* -------- Quick Links -------- */}
      <div className="fl-quick-links">
        <Link to="/freelancer/browse-jobs" className="fl-quick-card">
          <div className="fl-quick-icon">🔍</div>
          <div className="fl-quick-info">
            <h3>Browse Jobs</h3>
            <p>Find your next opportunity</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
        <Link to="/freelancer/saved-jobs" className="fl-quick-card">
          <div className="fl-quick-icon">💜</div>
          <div className="fl-quick-info">
            <h3>Saved Jobs</h3>
            <p>{stats.saved} jobs saved</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
        <Link to="/freelancer/my-applications" className="fl-quick-card">
          <div className="fl-quick-icon">📝</div>
          <div className="fl-quick-info">
            <h3>My Applications</h3>
            <p>{stats.total} applications sent</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default FreelancerDashboard;
