import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import * as savedJobService from '../../services/savedJobService';
import { formatBudget, formatRelativeTime } from '../../utils/helpers';
import Spinner from '../../components/Spinner/Spinner';
import EmptyState from '../../components/EmptyState/EmptyState';
import './SavedJobs.css';

/**
 * SavedJobs - Freelancer's bookmarked/saved job listings.
 */
const SavedJobs = () => {
  const { showToast } = useToast();

  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      // Backend returns { success: true, savedJobs: [...] }
      const data = await savedJobService.getSavedJobs();
      setSavedJobs(data.savedJobs || []);
    } catch (err) {
      showToast('Failed to load saved jobs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (jobId) => {
    setRemovingId(jobId);
    try {
      await savedJobService.toggleSaveJob(jobId);
      // Remove from local state - savedJobs is array of Job docs (populated directly)
      setSavedJobs(prev => prev.filter(job => job._id !== jobId));
      showToast('Job removed from saved list.', 'success');
    } catch (err) {
      showToast('Failed to unsave job.', 'error');
    } finally {
      setRemovingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':        return { label: 'Open',        cls: 'status--open' };
      case 'in-progress': return { label: 'In Progress', cls: 'status--progress' };
      case 'completed':   return { label: 'Completed',   cls: 'status--completed' };
      default:            return { label: 'Closed',      cls: 'status--closed' };
    }
  };

  if (loading) return <Spinner size="lg" fullPage />;

  return (
    <div className="page-container fade-in">
      <div className="container saved-container">
        <div className="saved-header">
          <div>
            <h1 className="saved-title">Saved Jobs</h1>
            <p className="saved-subtitle">
              {savedJobs.length} job{savedJobs.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <Link to="/freelancer/browse-jobs" className="saved-browse-btn">
            Browse More
          </Link>
        </div>

        {savedJobs.length === 0 ? (
          <EmptyState
            icon="🔖"
            title="No saved jobs"
            message="Save jobs you're interested in so you can easily find them later."
            actionText="Browse Jobs"
            actionLink="/freelancer/browse-jobs"
          />
        ) : (
          <div className="saved-grid">
            {savedJobs.map((item) => {
              const job = item.job || item;
              const jobId = job._id;
              const statusMeta = getStatusBadge(job.status);

              return (
                <div key={item._id || jobId} className="saved-card">
                  <div className="saved-card__header">
                    <span className={`saved-status ${statusMeta.cls}`}>
                      {statusMeta.label}
                    </span>
                    <button
                      className="saved-card__unsave"
                      onClick={() => handleUnsave(jobId)}
                      disabled={removingId === jobId}
                      aria-label="Remove from saved"
                      title="Remove from saved"
                    >
                      {removingId === jobId ? '...' : '🔖'}
                    </button>
                  </div>

                  <Link to={`/jobs/${jobId}`} className="saved-card__title">
                    {job.title}
                  </Link>

                  <p className="saved-card__desc">
                    {job.description?.slice(0, 120)}
                    {job.description?.length > 120 ? '…' : ''}
                  </p>

                  <div className="saved-card__meta">
                    {job.budget && (
                      <span className="saved-card__budget">
                        💰 {formatBudget(job.budget.min, job.budget.max)}
                      </span>
                    )}
                    {job.category && (
                      <span className="saved-card__category">🏷 {job.category}</span>
                    )}
                    {job.duration && (
                      <span className="saved-card__duration">⏱ {job.duration}</span>
                    )}
                  </div>

                  {job.skills?.length > 0 && (
                    <div className="saved-card__skills">
                      {job.skills.slice(0, 4).map((skill, i) => (
                        <span key={i} className="skill-tag">{skill}</span>
                      ))}
                      {job.skills.length > 4 && (
                        <span className="skill-tag skill-tag--more">+{job.skills.length - 4}</span>
                      )}
                    </div>
                  )}

                  <div className="saved-card__footer">
                    <span className="saved-card__saved-at">
                      Saved {formatRelativeTime(item.createdAt || job.createdAt)}
                    </span>
                    {job.status === 'open' && (
                      <Link to={`/jobs/${jobId}`} className="saved-card__apply-btn">
                        Apply Now
                      </Link>
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

export default SavedJobs;
