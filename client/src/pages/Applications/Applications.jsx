import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import * as jobService from '../../services/jobService';
import * as applicationService from '../../services/applicationService';
import * as chatService from '../../services/chatService';
import { formatDate, formatBudget, getInitials, formatRelativeTime } from '../../utils/helpers';
import Spinner from '../../components/Spinner/Spinner';
import EmptyState from '../../components/EmptyState/EmptyState';
import './Applications.css';

const Applications = () => {
  const { jobId } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [startingChat, setStartingChat] = useState(false);
  const [completingProject, setCompletingProject] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Backend returns { success, job } and { success, applications }
      const [jobData, appData] = await Promise.all([
        jobService.getJob(jobId),
        applicationService.getJobApplications(jobId),
      ]);
      setJob(jobData.job || null);
      setApplications(appData.applications || []);
    } catch (err) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const handleAccept = async (applicationId) => {
    try {
      setActionLoading(applicationId);
      await applicationService.updateApplicationStatus(applicationId, { status: 'accepted' });
      showToast('Application accepted!', 'success');
      await fetchData();
    } catch (err) {
      showToast('Failed to accept application', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (applicationId) => {
    try {
      setActionLoading(applicationId);
      await applicationService.updateApplicationStatus(applicationId, { status: 'rejected' });
      showToast('Application rejected!', 'success');
      await fetchData();
    } catch (err) {
      showToast('Failed to reject application', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMessageFreelancer = async (freelancerId) => {
    try {
      setStartingChat(true);
      const data = await chatService.createConversation(freelancerId);
      navigate(`/chat/${data.conversation._id}`);
    } catch (err) {
      showToast('Could not open chat.', 'error');
    } finally {
      setStartingChat(false);
    }
  };

  const getStatusClass = (status) => {
    const map = {
      pending: 'app-status--pending',
      accepted: 'app-status--accepted',
      rejected: 'app-status--rejected',
      withdrawn: 'app-status--withdrawn',
    };
    return map[status] || 'app-status--pending';
  };

  const handleCompleteProject = async () => {
    if (!window.confirm('Are you sure you want to mark this project as completed? This action cannot be undone.')) return;
    try {
      setCompletingProject(true);
      await applicationService.completeProject(jobId);
      showToast('Project marked as completed! 🎉', 'success');
      await fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to complete project', 'error');
    } finally {
      setCompletingProject(false);
    }
  };

  const getStatusLabel = (status) => {
    const map = {
      pending: 'Pending',
      accepted: 'Accepted',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn',
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
      {/* Back Link */}
      <Link to="/client/dashboard" className="back-link">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to Dashboard
      </Link>

      {/* Job Info Header */}
      {job && (
        <div className="app-job-header">
          <div className="app-job-header-content">
            <div className="app-job-info">
              <h1 className="app-job-title">{job.title}</h1>
              <div className="app-job-meta">
                {job.category && (
                  <span className="app-job-category">{job.category}</span>
                )}
                <span className="app-job-budget">
                  💰 {formatBudget
                    ? formatBudget(job.budget?.min || job.budgetMin, job.budget?.max || job.budgetMax)
                    : `$${job.budget?.min || job.budgetMin || 0} - $${job.budget?.max || job.budgetMax || 0}`}
                </span>
                <span className={`app-job-status ${job.status === 'open' ? 'status-open' : job.status === 'in-progress' || job.status === 'in_progress' ? 'status-active' : 'status-closed'}`}>
                  {job.status}
                </span>
              </div>
            </div>
            <div className="app-job-count">
              <span className="app-count-number">{applications.length}</span>
              <span className="app-count-label">Application{applications.length !== 1 ? 's' : ''}</span>
            </div>
            {job.status === 'in-progress' && (
              <button
                className="btn-complete-project"
                onClick={handleCompleteProject}
                disabled={completingProject}
              >
                {completingProject ? (
                  <><span className="btn-spinner-sm"></span> Completing...</>
                ) : (
                  <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Mark as Complete</>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Applications List */}
      <div className="applications-section">
        <h2 className="section-title">Applications</h2>

        {applications.length === 0 ? (
          <EmptyState
            icon="📭"
            title="No applications yet"
            message="Applications will appear here when freelancers apply"
          />
        ) : (
          <div className="applications-list">
            {applications.map((app) => {
              const freelancer = app.freelancer || {};
              const name = freelancer.name || 'Freelancer';
              const avatar = freelancer.avatar || freelancer.profileImage;
              const freelancerId = freelancer._id || freelancer;
              const skills = app.skills || freelancer.skills || [];

              return (
                <div
                  className={`application-card ${getStatusClass(app.status)}`}
                  key={app._id}
                >
                  <div className="app-card-header">
                    <div className="app-freelancer">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={name}
                          className="app-avatar"
                        />
                      ) : (
                        <div className="app-avatar-initials">
                          {getInitials ? getInitials(name) : name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="app-freelancer-info">
                        <Link
                          to={`/profile/${freelancerId}`}
                          className="app-freelancer-name"
                        >
                          {name}
                        </Link>
                        <span className="app-applied-date">
                          Applied {formatRelativeTime ? formatRelativeTime(app.createdAt) : formatDate ? formatDate(app.createdAt) : app.createdAt}
                        </span>
                      </div>
                    </div>
                    <span className={`app-status-badge ${getStatusClass(app.status)}`}>
                      {getStatusLabel(app.status)}
                    </span>
                  </div>

                  {/* Skills */}
                  {skills.length > 0 && (
                    <div className="app-skills">
                      {skills.slice(0, 6).map((skill, idx) => (
                        <span key={idx} className="app-skill-tag">
                          {typeof skill === 'string' ? skill : skill.name || skill}
                        </span>
                      ))}
                      {skills.length > 6 && (
                        <span className="app-skill-more">+{skills.length - 6}</span>
                      )}
                    </div>
                  )}

                  {/* Cover Letter */}
                  {app.coverLetter && (
                    <div className="app-cover-letter">
                      <h4 className="app-section-label">Cover Letter</h4>
                      <p className="app-cover-text">{app.coverLetter}</p>
                    </div>
                  )}

                  {/* Proposal Details */}
                  <div className="app-proposal-details">
                    {(app.proposedBudget || app.budget) && (
                      <div className="app-detail">
                        <span className="app-detail-label">Proposed Budget</span>
                        <span className="app-detail-value">
                          ${app.proposedBudget || app.budget}
                        </span>
                      </div>
                    )}
                    {(app.estimatedDuration || app.duration) && (
                      <div className="app-detail">
                        <span className="app-detail-label">Est. Duration</span>
                        <span className="app-detail-value">
                          {app.estimatedDuration || app.duration}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="app-card-actions">
                    {app.status === 'pending' && (
                      <>
                        <button
                          className="btn-app-accept"
                          onClick={() => handleAccept(app._id)}
                          disabled={actionLoading === app._id}
                        >
                          {actionLoading === app._id ? (
                            <span className="btn-spinner-sm"></span>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                          Accept
                        </button>
                        <button
                          className="btn-app-reject"
                          onClick={() => handleReject(app._id)}
                          disabled={actionLoading === app._id}
                        >
                          {actionLoading === app._id ? (
                            <span className="btn-spinner-sm"></span>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          )}
                          Reject
                        </button>
                      </>
                    )}
                    {app.status === 'accepted' && (
                      <button
                        onClick={() => handleMessageFreelancer(freelancerId)}
                        disabled={startingChat}
                        className="btn-app-message"
                        style={{ border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        {startingChat ? 'Opening...' : 'Message Freelancer'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Applications;
