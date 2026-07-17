import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import * as jobService from '../../services/jobService';
import * as applicationService from '../../services/applicationService';
import * as chatService from '../../services/chatService';
import { formatDate, formatBudget, getInitials } from '../../utils/helpers';
import Spinner from '../../components/Spinner/Spinner';
import './JobDetail.css';

const JobDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* Application form state */
  const [form, setForm] = useState({
    coverLetter: '',
    proposedBudget: '',
    estimatedDuration: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        // Backend returns { success: true, job: {...} }
        const data = await jobService.getJob(id);
        const jobData = data.job || null;
        setJob(jobData);

        /* Check if current user already applied */
        if (user && user.role === 'freelancer') {
          const appsData = await applicationService.getMyApplications();
          const applied = (appsData.applications || []).some(
            (app) => (app.job?._id || app.job) === id
          );
          setHasApplied(applied);
        }
      } catch (err) {
        showToast('Failed to load job details', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  /* Is owner? */
  const isOwner =
    user && (job?.client?._id === user._id || job?.client === user._id);
  const isFreelancer = user?.role === 'freelancer';

  /* Form helpers */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const errs = {};
    if (!form.coverLetter.trim()) errs.coverLetter = 'Cover letter is required';
    if (!form.proposedBudget || Number(form.proposedBudget) <= 0)
      errs.proposedBudget = 'Enter a valid budget';
    if (!form.estimatedDuration.trim())
      errs.estimatedDuration = 'Estimated duration is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* Submit application */
  const handleApply = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      await applicationService.applyForJob({
        jobId: id,
        coverLetter: form.coverLetter,
        proposedBudget: Number(form.proposedBudget),
        estimatedDuration: form.estimatedDuration,
      });
      showToast('Application submitted!', 'success');
      setShowModal(false);
      setHasApplied(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to apply', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /* Start chat with client */
  const [startingChat, setStartingChat] = useState(false);
  const handleMessageClient = async () => {
    const clientId = job?.client?._id || job?.client;
    if (!clientId) return;
    try {
      setStartingChat(true);
      // Create or get existing conversation
      const data = await chatService.createConversation(clientId);
      const conv = data.conversation;
      navigate(`/chat/${conv._id}`);
    } catch (err) {
      showToast('Failed to open chat.', 'error');
    } finally {
      setStartingChat(false);
    }
  };

  /* Delete job */
  const handleDelete = async () => {
    try {
      setDeleting(true);
      await jobService.deleteJob(id);
      showToast('Job deleted', 'success');
      navigate('/dashboard/client');
    } catch (err) {
      showToast('Failed to delete job', 'error');
    } finally {
      setDeleting(false);
    }
  };

  /* Status helpers */
  const getStatusClass = (status) => {
    const map = {
      open: 'jd-status-open',
      'in-progress': 'jd-status-active',
      in_progress: 'jd-status-active',
      completed: 'jd-status-completed',
      closed: 'jd-status-closed',
    };
    return map[status] || 'jd-status-open';
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

  /* Loading */
  if (loading) {
    return (
      <div className="page-container container fade-in">
        <Spinner />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="page-container container fade-in">
        <div className="jd-not-found">
          <h2>Job not found</h2>
          <Link to="/freelancer/browse-jobs" className="jd-back-link">
            Browse Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container container fade-in">
      {/* Back link */}
      <Link to="/freelancer/browse-jobs" className="jd-back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Jobs
      </Link>

      <div className="jd-grid">
        {/* -------- Main Content -------- */}
        <div className="jd-main">
          <div className="jd-header">
            <div className="jd-header-top">
              <h1 className="jd-title">{job.title}</h1>
              <span className={`jd-status-badge ${getStatusClass(job.status)}`}>
                {getStatusLabel(job.status)}
              </span>
            </div>

            <div className="jd-meta-row">
              {job.category && (
                <span className="jd-category-badge">{job.category}</span>
              )}
              <span className="jd-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Posted {formatDate ? formatDate(job.createdAt) : job.createdAt}
              </span>
              <span className="jd-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                {job.applicationsCount || job.applications?.length || 0} applicants
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="jd-section">
            <h2 className="jd-section-title">Description</h2>
            <div className="jd-description">
              {job.description?.split('\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>

          {/* Skills */}
          {job.skills?.length > 0 && (
            <div className="jd-section">
              <h2 className="jd-section-title">Required Skills</h2>
              <div className="jd-skills-list">
                {job.skills.map((skill, i) => (
                  <span className="jd-skill-chip" key={i}>{skill}</span>
                ))}
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="jd-details-grid">
            <div className="jd-detail-card">
              <div className="jd-detail-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div>
                <span className="jd-detail-label">Budget</span>
                <span className="jd-detail-value">
                  {formatBudget
                    ? formatBudget(job.budgetMin || job.budget?.min, job.budgetMax || job.budget?.max)
                    : `$${job.budgetMin || 0} - $${job.budgetMax || 0}`}
                </span>
              </div>
            </div>
            <div className="jd-detail-card">
              <div className="jd-detail-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <span className="jd-detail-label">Duration</span>
                <span className="jd-detail-value">{job.duration || 'Not specified'}</span>
              </div>
            </div>
            <div className="jd-detail-card">
              <div className="jd-detail-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <span className="jd-detail-label">Status</span>
                <span className="jd-detail-value">{getStatusLabel(job.status)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* -------- Sidebar -------- */}
        <div className="jd-sidebar">
          {/* Client Info Card */}
          <div className="jd-client-card">
            <h3 className="jd-client-heading">About the Client</h3>
            <div className="jd-client-profile">
              <div className="jd-client-avatar">
                {job.client?.avatar ? (
                  <img src={job.client.avatar} alt="" />
                ) : (
                  <span>
                    {getInitials
                      ? getInitials(job.client?.name)
                      : job.client?.name?.charAt(0) || 'C'}
                  </span>
                )}
              </div>
              <div>
                <Link
                  to={`/profile/${job.client?._id || job.client}`}
                  className="jd-client-name"
                >
                  {job.client?.name || 'Client'}
                </Link>
                <p className="jd-client-since">
                  Member since{' '}
                  {job.client?.createdAt
                    ? formatDate
                      ? formatDate(job.client.createdAt)
                      : job.client.createdAt
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="jd-actions-card">
            {isFreelancer && !isOwner && (
              <>
                {hasApplied ? (
                  <>
                    <button className="jd-btn-applied" disabled>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      Already Applied
                    </button>
                    {/* Message Client button - only after applying */}
                    <button
                      className="jd-btn-message"
                      onClick={handleMessageClient}
                      disabled={startingChat}
                    >
                      💬 {startingChat ? 'Opening...' : 'Message Client'}
                    </button>
                  </>
                ) : (
                  <button
                    className="jd-btn-apply"
                    onClick={() => setShowModal(true)}
                    disabled={job.status !== 'open'}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                    Apply Now
                  </button>
                )}
              </>
            )}

            {isOwner && (
              <>
                <Link to={`/client/edit-job/${job._id}`} className="jd-btn-edit">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit Job
                </Link>
                <Link
                  to={`/client/applications/${job._id}`}
                  className="jd-btn-view-apps"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  View Applications
                </Link>
                <button
                  className="jd-btn-delete"
                  onClick={() => setDeleteConfirm(true)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete Job
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* -------- Apply Modal -------- */}
      {showModal && (
        <div className="jd-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="jd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="jd-modal-header">
              <h2>Apply for this Job</h2>
              <button
                className="jd-modal-close"
                onClick={() => setShowModal(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleApply} className="jd-modal-form">
              <div className="jd-form-group">
                <label>Cover Letter *</label>
                <textarea
                  name="coverLetter"
                  rows="5"
                  placeholder="Explain why you're the best fit for this job..."
                  value={form.coverLetter}
                  onChange={handleChange}
                  className={errors.coverLetter ? 'jd-input-error' : ''}
                />
                {errors.coverLetter && (
                  <span className="jd-error-msg">{errors.coverLetter}</span>
                )}
              </div>

              <div className="jd-form-row">
                <div className="jd-form-group">
                  <label>Proposed Budget ($) *</label>
                  <input
                    type="number"
                    name="proposedBudget"
                    placeholder="e.g. 500"
                    value={form.proposedBudget}
                    onChange={handleChange}
                    className={errors.proposedBudget ? 'jd-input-error' : ''}
                  />
                  {errors.proposedBudget && (
                    <span className="jd-error-msg">{errors.proposedBudget}</span>
                  )}
                </div>
                <div className="jd-form-group">
                  <label>Estimated Duration *</label>
                  <input
                    type="text"
                    name="estimatedDuration"
                    placeholder="e.g. 2 weeks"
                    value={form.estimatedDuration}
                    onChange={handleChange}
                    className={errors.estimatedDuration ? 'jd-input-error' : ''}
                  />
                  {errors.estimatedDuration && (
                    <span className="jd-error-msg">{errors.estimatedDuration}</span>
                  )}
                </div>
              </div>

              <div className="jd-modal-actions">
                <button
                  type="button"
                  className="jd-btn-cancel"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="jd-btn-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------- Delete Confirm -------- */}
      {deleteConfirm && (
        <div className="jd-modal-overlay" onClick={() => setDeleteConfirm(false)}>
          <div className="jd-modal jd-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="jd-delete-content">
              <div className="jd-delete-icon">⚠️</div>
              <h3>Delete this job?</h3>
              <p>This action cannot be undone. All applications will be removed.</p>
              <div className="jd-modal-actions">
                <button
                  className="jd-btn-cancel"
                  onClick={() => setDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  className="jd-btn-confirm-delete"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;
