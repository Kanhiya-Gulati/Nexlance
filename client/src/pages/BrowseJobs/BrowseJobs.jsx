import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import * as jobService from '../../services/jobService';
import * as savedJobService from '../../services/savedJobService';
import { formatDate, formatBudget } from '../../utils/helpers';
import { CATEGORIES, DURATIONS, SKILLS_LIST } from '../../utils/constants';
import Spinner from '../../components/Spinner/Spinner';
import EmptyState from '../../components/EmptyState/EmptyState';
import './BrowseJobs.css';

const BrowseJobs = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);

  /* Filters */
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [duration, setDuration] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  /* Pagination */
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 12;

  /* Initialise saved job IDs from user object */
  useEffect(() => {
    if (user?.savedJobs) {
      const ids = user.savedJobs.map((j) => (typeof j === 'string' ? j : j._id));
      setSavedIds(new Set(ids));
    }
  }, [user]);

  /* Fetch jobs */
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (category) params.category = category;
      if (selectedSkills.length) params.skills = selectedSkills.join(',');
      if (budgetMin) params.budgetMin = budgetMin;
      if (budgetMax) params.budgetMax = budgetMax;
      if (duration) params.duration = duration;

      const data = await jobService.getJobs(params);
      // Backend returns { success, jobs: [...], totalPages, currentPage, totalJobs }
      setJobs(data.jobs || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      showToast('Failed to load jobs', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, category, selectedSkills, budgetMin, budgetMax, duration, showToast]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  /* Save / unsave handler */
  const handleToggleSave = async (jobId) => {
    try {
      setSavingId(jobId);
      await savedJobService.toggleSaveJob(jobId);
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (next.has(jobId)) {
          next.delete(jobId);
          showToast('Job removed from saved', 'success');
        } else {
          next.add(jobId);
          showToast('Job saved!', 'success');
        }
        return next;
      });
    } catch (err) {
      showToast('Failed to save job', 'error');
    } finally {
      setSavingId(null);
    }
  };

  /* Skill toggle */
  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
    setPage(1);
  };

  /* Search submit */
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  /* Reset filters */
  const resetFilters = () => {
    setSearch('');
    setCategory('');
    setSelectedSkills([]);
    setBudgetMin('');
    setBudgetMax('');
    setDuration('');
    setPage(1);
  };

  const hasActiveFilters = category || selectedSkills.length || budgetMin || budgetMax || duration;

  return (
    <div className="page-container fade-in">
      <div className="bj-layout container">
        {/* -------- Search Bar -------- */}
        <div className="bj-search-bar">
          <form onSubmit={handleSearch} className="bj-search-form">
            <svg className="bj-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="bj-search-input"
              placeholder="Search jobs by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="bj-search-btn">Search</button>
          </form>
          <button
            className={`bj-filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="7" y1="12" x2="17" y2="12" />
              <line x1="10" y1="18" x2="14" y2="18" />
            </svg>
            Filters
            {hasActiveFilters && <span className="bj-filter-dot" />}
          </button>
        </div>

        {/* -------- Filter Panel -------- */}
        {showFilters && (
          <div className="bj-filter-panel">
            <div className="bj-filter-group">
              <label className="bj-filter-label">Category</label>
              <select
                className="bj-filter-select"
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              >
                <option value="">All Categories</option>
                {(CATEGORIES || []).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="bj-filter-group">
              <label className="bj-filter-label">Budget Range</label>
              <div className="bj-budget-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  className="bj-budget-input"
                  value={budgetMin}
                  onChange={(e) => { setBudgetMin(e.target.value); setPage(1); }}
                />
                <span className="bj-budget-sep">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  className="bj-budget-input"
                  value={budgetMax}
                  onChange={(e) => { setBudgetMax(e.target.value); setPage(1); }}
                />
              </div>
            </div>

            <div className="bj-filter-group">
              <label className="bj-filter-label">Duration</label>
              <select
                className="bj-filter-select"
                value={duration}
                onChange={(e) => { setDuration(e.target.value); setPage(1); }}
              >
                <option value="">Any Duration</option>
                {(DURATIONS || []).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="bj-filter-group bj-filter-skills">
              <label className="bj-filter-label">Skills</label>
              <div className="bj-skills-list">
                {(SKILLS_LIST || []).slice(0, 20).map((skill) => (
                  <button
                    key={skill}
                    className={`bj-skill-tag ${selectedSkills.includes(skill) ? 'active' : ''}`}
                    onClick={() => toggleSkill(skill)}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <button className="bj-reset-btn" onClick={resetFilters}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* -------- Jobs Grid -------- */}
        {loading ? (
          <Spinner />
        ) : jobs.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No jobs found"
            message="Try adjusting your search or filters"
          />
        ) : (
          <>
            <div className="bj-results-count">
              Showing {jobs.length} job{jobs.length !== 1 ? 's' : ''}
            </div>

            <div className="bj-jobs-grid">
              {jobs.map((job) => (
                <div className="bj-job-card" key={job._id}>
                  <div className="bj-card-header">
                    <span className="bj-category-badge">{job.category || 'General'}</span>
                    <button
                      className={`bj-save-btn ${savedIds.has(job._id) ? 'saved' : ''}`}
                      onClick={() => handleToggleSave(job._id)}
                      disabled={savingId === job._id}
                      title={savedIds.has(job._id) ? 'Unsave' : 'Save'}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={savedIds.has(job._id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                  </div>

                  <Link to={`/jobs/${job._id}`} className="bj-card-title">
                    {job.title}
                  </Link>

                  <p className="bj-card-desc">
                    {job.description?.length > 120
                      ? job.description.substring(0, 120) + '...'
                      : job.description}
                  </p>

                  <div className="bj-card-skills">
                    {(job.skills || []).slice(0, 4).map((skill, i) => (
                      <span className="bj-skill-chip" key={i}>{skill}</span>
                    ))}
                    {(job.skills || []).length > 4 && (
                      <span className="bj-skill-chip bj-skill-more">
                        +{job.skills.length - 4}
                      </span>
                    )}
                  </div>

                  <div className="bj-card-footer">
                    <div className="bj-card-info">
                      <span className="bj-info-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="1" x2="12" y2="23" />
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        {formatBudget
                          ? formatBudget(job.budgetMin || job.budget?.min, job.budgetMax || job.budget?.max)
                          : `$${job.budgetMin || 0} - $${job.budgetMax || 0}`}
                      </span>
                      <span className="bj-info-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {job.duration || '—'}
                      </span>
                    </div>

                    <div className="bj-card-bottom">
                      <div className="bj-client-info">
                        <div className="bj-client-avatar">
                          {job.client?.avatar ? (
                            <img src={job.client.avatar} alt="" />
                          ) : (
                            <span>{job.client?.name?.charAt(0) || 'C'}</span>
                          )}
                        </div>
                        <span className="bj-client-name">{job.client?.name || 'Client'}</span>
                      </div>
                      <span className="bj-post-date">
                        {formatDate ? formatDate(job.createdAt) : job.createdAt}
                      </span>
                    </div>

                    <div className="bj-card-apps">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      {job.applicationsCount || job.applications?.length || 0} applicants
                    </div>
                  </div>

                  <Link to={`/jobs/${job._id}`} className="bj-view-btn">
                    View Details
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bj-pagination">
                <button
                  className="bj-page-btn"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  Previous
                </button>
                <span className="bj-page-info">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="bj-page-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BrowseJobs;
