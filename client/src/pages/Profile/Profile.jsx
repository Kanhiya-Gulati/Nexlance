import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import * as profileService from '../../services/profileService';
import * as chatService from '../../services/chatService';
import { formatDate, getInitials } from '../../utils/helpers';
import Spinner from '../../components/Spinner/Spinner';
import './Profile.css';

/**
 * StarRating Component - Picker or display.
 */
const StarRating = ({ value, onChange, readOnly }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-picker">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star-icon ${star <= (hover || value) ? 'filled' : ''}`}
          onClick={() => !readOnly && onChange && onChange(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
        >
          ★
        </span>
      ))}
    </div>
  );
};

/**
 * Profile - Fiverr/Upwork Style professional Freelance & Client Profile.
 * Double-mode split layout depending on role.
 */
const Profile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [clientJobs, setClientJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState(false);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, reviewText: '', projectName: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await profileService.getProfile(id);
      setProfile(data.user || null);
      setClientJobs(data.jobs || []);
    } catch (err) {
      showToast('Profile not found.', 'error');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = async () => {
    try {
      setStartingChat(true);
      const data = await chatService.createConversation(profile._id);
      navigate(`/chat/${data.conversation._id}`);
    } catch (err) {
      showToast('Could not open chat.', 'error');
    } finally {
      setStartingChat(false);
    }
  };

  const handleHireClick = () => {
    showToast('Starting hire discussion...', 'success');
    handleMessage();
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) {
      showToast('Please select a star rating', 'warning');
      return;
    }
    if (!reviewForm.reviewText.trim()) {
      showToast('Please write a review', 'warning');
      return;
    }
    try {
      setSubmittingReview(true);
      await profileService.addReview(profile._id, {
        rating: reviewForm.rating,
        reviewText: reviewForm.reviewText,
        projectName: reviewForm.projectName,
      });
      showToast('Review submitted successfully!', 'success');
      setReviewForm({ rating: 0, reviewText: '', projectName: '' });
      setShowReviewForm(false);
      fetchProfile();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit review';
      showToast(msg, 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <Spinner size="lg" fullPage />;
  if (!profile) return null;

  const isOwner = user?._id === profile._id;
  const isFreelancer = profile.role === 'freelancer';
  const isClient = profile.role === 'client';

  // Reviews list & rating
  const reviewsList = profile.reviews || [];
  const totalReviews = reviewsList.length;
  const avgRating = totalReviews > 0
    ? (reviewsList.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : null;

  // Verification & badges helper
  const isVerifiedClient = isClient && profile.isEmailVerified;
  const isPaymentVerified = isClient && (profile.isPaymentVerified ?? true);
  const isTopClient = isClient && avgRating && Number(avgRating) >= 4.5;
  const lastActiveTime = "Active 2 hours ago";
  const responseTime = profile.stats?.responseTime || '1 hour';
  const successRate = profile.stats?.successRate ?? 100;
  const repeatClients = profile.stats?.repeatClients ?? 0;

  // Client stats calculations
  const totalJobsPosted = clientJobs.length;
  const activeJobs = clientJobs.filter(j => j.status === 'open' || j.status === 'in-progress' || j.status === 'in_progress');
  const completedJobs = clientJobs.filter(j => j.status === 'completed');
  const freelancersHiredCount = clientJobs.filter(j => j.assignedFreelancer).length;
  const totalMoneySpent = clientJobs.reduce((sum, j) => sum + (j.budgetMax || j.budgetMin || 0), 0);
  const avgBudget = totalJobsPosted > 0 ? Math.round(totalMoneySpent / totalJobsPosted) : 0;

  return (
    <div className="page-container container fade-in">
      <div className="upwork-profile-layout">

        {/* ==========================================
            LEFT COLUMN (Dynamic based on Client/Freelancer)
           ========================================== */}
        <aside className="upwork-profile-left">
          <div className="upwork-left-card">

            {/* Avatar */}
            <div className="upwork-avatar-container">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="upwork-avatar-img" />
              ) : (
                <div className="upwork-avatar-initials">{getInitials(profile.name)}</div>
              )}
              {profile.isOnline && <span className="upwork-online-indicator" />}
            </div>

            <h1 className="upwork-name">{profile.name}</h1>
            
            {/* Title / Industry */}
            {isFreelancer && profile.title && <p className="upwork-title">{profile.title}</p>}
            {isClient && profile.industry && <p className="upwork-title">🏭 {profile.industry}</p>}
            {isClient && profile.tagline && <p className="upwork-tagline">"{profile.tagline}"</p>}

            {/* Rating */}
            <div className="upwork-stars-row">
              {avgRating ? (
                <>
                  <span className="upwork-stars">⭐ {avgRating}</span>
                  <span className="upwork-reviews-count">({totalReviews} review{totalReviews !== 1 ? 's' : ''})</span>
                </>
              ) : (
                <span className="upwork-reviews-count">No reviews yet</span>
              )}
            </div>

            {/* Meta List */}
            <div className="upwork-meta-list">
              {profile.location && (
                <div className="upwork-meta-item">📍 {profile.location}</div>
              )}
              {isFreelancer && (
                <div className="upwork-meta-item">
                  🌐 {profile.languages?.length > 0 ? profile.languages.join(', ') : 'English'}
                </div>
              )}
              {isFreelancer && (
                <div className="upwork-meta-item">
                  <span className={`upwork-availability-tag ${profile.availability === 'Busy' ? 'busy' : 'available'}`}>
                    ● {profile.availability || 'Available'}
                  </span>
                </div>
              )}
              {isClient && profile.companySize && (
                <div className="upwork-meta-item">👥 Size: {profile.companySize} employees</div>
              )}
              {isClient && profile.businessType && (
                <div className="upwork-meta-item">💼 Type: {profile.businessType}</div>
              )}
              <div className="upwork-meta-item">📅 Member since {formatDate(profile.createdAt)}</div>
            </div>

            {/* Verifications & Badges */}
            <div className="upwork-verification-box">
              {isClient && isVerifiedClient && (
                <div className="upwork-badge-pill verified">
                  <span>Verified Client</span> <span className="check-icon">✅</span>
                </div>
              )}
              {isClient && isPaymentVerified && (
                <div className="upwork-badge-pill payment">
                  <span>Payment Verified</span> <span className="check-icon">💳</span>
                </div>
              )}
              {isClient && isTopClient && (
                <div className="upwork-badge-pill top-rated">
                  <span>Top Client</span> <span className="check-icon">🏆</span>
                </div>
              )}
              <div className="upwork-verification-item">
                <span>Email Verified</span><span>✅</span>
              </div>
              <div className="upwork-verification-item">
                <span>Phone Verified</span><span>✅</span>
              </div>
            </div>

            {/* Availability / Last Active info */}
            {isClient && (
              <div className="upwork-active-info-box">
                <div className="active-info-row">⏱️ {lastActiveTime}</div>
                <div className="active-info-row">⚡ Replies within {profile.stats?.responseTime || '1 hour'}</div>
              </div>
            )}

            {/* Actions */}
            <div className="upwork-actions">
              {isOwner ? (
                <Link to="/profile/edit" className="upwork-btn upwork-btn-primary full-width">
                  ⚙️ Edit Profile
                </Link>
              ) : (
                <>
                  {isFreelancer && user?.role === 'client' && (
                    <button onClick={handleHireClick} className="upwork-btn upwork-btn-primary full-width">
                      🚀 Hire Freelancer
                    </button>
                  )}
                  <button
                    onClick={handleMessage}
                    disabled={startingChat}
                    className="upwork-btn upwork-btn-secondary full-width"
                  >
                    💬 Message
                  </button>
                </>
              )}
            </div>

            {/* Social & Contact Links */}
            {(profile.links?.website || profile.links?.github || profile.links?.linkedin || profile.links?.twitter || profile.phone || profile.email) && (
              <div className="upwork-left-social">
                <p className="upwork-left-social-title">Contact & Links</p>
                {profile.links?.website && (
                  <a href={profile.links.website} target="_blank" rel="noopener noreferrer" className="upwork-left-social-link website">
                    <span className="left-social-icon">🌐</span> Website
                  </a>
                )}
                {profile.links?.linkedin && (
                  <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" className="upwork-left-social-link linkedin">
                    <span className="left-social-icon">💼</span> LinkedIn
                  </a>
                )}
                {isFreelancer && profile.links?.github && (
                  <a href={profile.links.github} target="_blank" rel="noopener noreferrer" className="upwork-left-social-link">
                    <span className="left-social-icon">🐙</span> GitHub
                  </a>
                )}
                {isClient && profile.links?.twitter && (
                  <a href={profile.links.twitter} target="_blank" rel="noopener noreferrer" className="upwork-left-social-link twitter">
                    <span className="left-social-icon">🐦</span> Twitter / X
                  </a>
                )}
                {isFreelancer && profile.phone && (
                  <div className="upwork-left-social-link plain">
                    <span className="left-social-icon">📞</span> {profile.phone}
                  </div>
                )}
                {profile.email && (
                  <div className="upwork-left-social-link plain">
                    <span className="left-social-icon">✉️</span> {profile.email}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* ==========================================
            RIGHT COLUMN (Dynamic based on Client/Freelancer)
           ========================================== */}
        <main className="upwork-profile-right">

          {/* About / Company Description */}
          <section className="upwork-section">
            <h2 className="upwork-section-title">{isClient ? 'About Company' : 'About Me'}</h2>
            <p className="upwork-about-text">
              {profile.bio || (isClient ? 'No company description added yet.' : 'This user has not added a bio yet.')}
            </p>
          </section>

          {/* CLIENT MODULES */}
          {isClient && (
            <>
              {/* Hiring Statistics */}
              <section className="upwork-section">
                <h2 className="upwork-section-title">Hiring Statistics</h2>
                <div className="upwork-stats-grid">
                  <div className="upwork-stat-card">
                    <span className="upwork-stat-value">{totalJobsPosted}</span>
                    <span className="upwork-stat-label">Total Jobs Posted</span>
                  </div>
                  <div className="upwork-stat-card">
                    <span className="upwork-stat-value">{activeJobs.length}</span>
                    <span className="upwork-stat-label">Active Jobs</span>
                  </div>
                  <div className="upwork-stat-card">
                    <span className="upwork-stat-value">{completedJobs.length}</span>
                    <span className="upwork-stat-label">Completed Projects</span>
                  </div>
                  <div className="upwork-stat-card">
                    <span className="upwork-stat-value">{freelancersHiredCount}</span>
                    <span className="upwork-stat-label">Freelancers Hired</span>
                  </div>
                  <div className="upwork-stat-card">
                    <span className="upwork-stat-value">${(totalMoneySpent || 0).toLocaleString()}</span>
                    <span className="upwork-stat-label">Total Money Spent</span>
                  </div>
                  <div className="upwork-stat-card">
                    <span className="upwork-stat-value">${(avgBudget || 0).toLocaleString()}</span>
                    <span className="upwork-stat-label">Avg Project Budget</span>
                  </div>
                </div>
              </section>

              {/* Active Jobs List */}
              <section className="upwork-section">
                <h2 className="upwork-section-title">Active Jobs ({activeJobs.length})</h2>
                {activeJobs.length > 0 ? (
                  <div className="profile-active-jobs-list">
                    {activeJobs.map((job) => (
                      <div key={job._id} className="profile-active-job-item">
                        <div className="job-item-header">
                          <Link to={`/jobs/${job._id}`} className="job-item-title">{job.title}</Link>
                          <span className="job-item-budget">${(job.budgetMin || 0).toLocaleString()} - ${(job.budgetMax || 0).toLocaleString()}</span>
                        </div>
                        <div className="job-item-footer">
                          <span>📅 Posted: {formatDate(job.createdAt)}</span>
                          <span>👥 Applicants: {job.applicationsCount || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="upwork-no-links-hint">No active jobs posted currently.</p>
                )}
              </section>

              {/* Completed Projects List */}
              <section className="upwork-section">
                <h2 className="upwork-section-title">Completed Projects ({completedJobs.length})</h2>
                {completedJobs.length > 0 ? (
                  <div className="profile-active-jobs-list">
                    {completedJobs.map((job) => (
                      <div key={job._id} className="profile-active-job-item completed">
                        <div className="job-item-header">
                          <Link to={`/jobs/${job._id}`} className="job-item-title">{job.title}</Link>
                          <span className="job-item-budget">Budget: ${(job.budgetMin || 0).toLocaleString()} - ${(job.budgetMax || 0).toLocaleString()}</span>
                        </div>
                        <div className="job-item-footer">
                          <span>✅ Completed on: {formatDate(job.updatedAt)}</span>
                          {job.assignedFreelancer && (
                            <span>👤 Freelancer: <strong>{job.assignedFreelancer.name}</strong></span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="upwork-no-links-hint">No completed projects listed yet.</p>
                )}
              </section>
            </>
          )}

          {/* FREELANCER MODULES */}
          {isFreelancer && (
            <>
              {/* Work Details */}
              <section className="upwork-section">
                <h2 className="upwork-section-title">Work Details & Rates</h2>
                <div className="upwork-rates-grid">
                  <div className="upwork-rate-card">
                    <span className="upwork-rate-val">
                      {profile.hourlyRate ? `$${Number(profile.hourlyRate).toLocaleString()}/hr` : 'Not set'}
                    </span>
                    <span className="upwork-rate-label">Hourly Rate</span>
                  </div>
                  <div className="upwork-rate-card">
                    <span className="upwork-rate-val">
                      {profile.minProjectBudget ? `$${Number(profile.minProjectBudget).toLocaleString()}` : 'Not set'}
                    </span>
                    <span className="upwork-rate-label">Min Project Budget</span>
                  </div>
                  <div className="upwork-rate-card">
                    <span className="upwork-rate-val">{profile.preferredProjectType || 'Both'}</span>
                    <span className="upwork-rate-label">Preferred Project Type</span>
                  </div>
                </div>
              </section>

              {/* Skills */}
              {profile.skills?.length > 0 && (
                <section className="upwork-section">
                  <h2 className="upwork-section-title">Skills & Expertise</h2>
                  <div className="upwork-skills-list">
                    {profile.skills.map((skill, idx) => (
                      <span key={idx} className="upwork-skill-badge">{skill}</span>
                    ))}
                  </div>
                </section>
              )}

              {/* Performance Stats */}
              <section className="upwork-section">
                <h2 className="upwork-section-title">Performance Stats</h2>
                <div className="upwork-stats-grid">
                  <div className="upwork-stat-card">
                    <span className="upwork-stat-value">{totalReviews}</span>
                    <span className="upwork-stat-label">Projects Completed</span>
                  </div>
                  <div className="upwork-stat-card">
                    <span className="upwork-stat-value">{responseTime}</span>
                    <span className="upwork-stat-label">Response Time</span>
                  </div>
                  <div className="upwork-stat-card">
                    <span className="upwork-stat-value">{successRate}%</span>
                    <span className="upwork-stat-label">Success Rate</span>
                  </div>
                  <div className="upwork-stat-card">
                    <span className="upwork-stat-value">{repeatClients}</span>
                    <span className="upwork-stat-label">Repeat Clients</span>
                  </div>
                  <div className="upwork-stat-card">
                    <span className="upwork-stat-value">{avgRating ? `⭐ ${avgRating}` : 'N/A'}</span>
                    <span className="upwork-stat-label">Average Rating</span>
                  </div>
                  <div className="upwork-stat-card">
                    <span className="upwork-stat-value">{totalReviews}</span>
                    <span className="upwork-stat-label">Total Reviews</span>
                  </div>
                </div>
              </section>

              {/* Portfolio */}
              {profile.projects?.length > 0 && (
                <section className="upwork-section">
                  <h2 className="upwork-section-title">Portfolio Projects</h2>
                  <div className="upwork-portfolio-grid">
                    {profile.projects.map((proj, idx) => (
                      <div key={idx} className="upwork-portfolio-card">
                        <div className="upwork-portfolio-image-wrapper">
                          <img
                            src={proj.image || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=60'}
                            alt={proj.title}
                            className="upwork-portfolio-img"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=60';
                            }}
                          />
                          {proj.cost > 0 && (
                            <span className="upwork-portfolio-cost-tag">${(proj.cost || 0).toLocaleString()}</span>
                          )}
                        </div>
                        <div className="upwork-portfolio-info">
                          <h3 className="upwork-portfolio-title">{proj.title}</h3>
                          {proj.description && <p className="upwork-portfolio-desc">{proj.description}</p>}
                          {proj.technologies?.length > 0 && (
                            <div className="upwork-portfolio-techs">
                              {proj.technologies.map((tech, i) => (
                                <span key={i} className="upwork-portfolio-tech-tag">{tech}</span>
                              ))}
                            </div>
                          )}
                          <div className="upwork-portfolio-links">
                            {proj.link && (
                              <a href={proj.link} target="_blank" rel="noopener noreferrer" className="portfolio-action-link">
                                🔗 Live Demo
                              </a>
                            )}
                            {proj.githubLink && (
                              <a href={proj.githubLink} target="_blank" rel="noopener noreferrer" className="portfolio-action-link github">
                                🐙 GitHub
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Education & Certs */}
              {((profile.education?.length > 0) || (profile.certifications?.length > 0)) && (
                <section className="upwork-section">
                  <h2 className="upwork-section-title">Education & Certifications</h2>
                  <div className="upwork-timeline-container">
                    {profile.education?.map((edu, idx) => (
                      <div key={`edu-${idx}`} className="upwork-timeline-item">
                        <div className="upwork-timeline-marker edu" />
                        <div className="upwork-timeline-content">
                          <h4 className="upwork-timeline-heading">{edu.degree}</h4>
                          <p className="upwork-timeline-subheading">🎓 {edu.school}</p>
                          <span className="upwork-timeline-year">Graduated: {edu.year}</span>
                        </div>
                      </div>
                    ))}
                    {profile.certifications?.map((cert, idx) => (
                      <div key={`cert-${idx}`} className="upwork-timeline-item">
                        <div className="upwork-timeline-marker cert" />
                        <div className="upwork-timeline-content">
                          <h4 className="upwork-timeline-heading">{cert.name}</h4>
                          <p className="upwork-timeline-subheading">📜 Issued by: {cert.issuer}</p>
                          <span className="upwork-timeline-year">Earned: {cert.year}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Reviews Section (Shows for both Freelancer and Client) */}
          <section className="upwork-section">
            <div className="upwork-reviews-header">
              <h2 className="upwork-section-title" style={{ borderBottom: 'none', marginBottom: 0 }}>
                {isClient ? 'Reviews from Freelancers' : 'Client Feedback & Reviews'} {totalReviews > 0 && <span className="reviews-count-badge">{totalReviews}</span>}
              </h2>
              {/* Allow freelancers to review clients, and clients to review freelancers */}
              {!isOwner && user && user.role !== profile.role && (
                <button
                  className="upwork-btn upwork-btn-secondary"
                  onClick={() => setShowReviewForm((prev) => !prev)}
                >
                  {showReviewForm ? '✕ Cancel' : '✏️ Leave a Review'}
                </button>
              )}
            </div>

            {/* Review Form */}
            {!isOwner && user && user.role !== profile.role && showReviewForm && (
              <form className="review-form" onSubmit={handleSubmitReview}>
                <div className="review-form-row">
                  <label className="review-label">Your Rating *</label>
                  <StarRating
                    value={reviewForm.rating}
                    onChange={(val) => setReviewForm((prev) => ({ ...prev, rating: val }))}
                  />
                </div>
                <div className="review-form-row">
                  <label className="review-label">Project Name (optional)</label>
                  <input
                    type="text"
                    className="review-input"
                    placeholder="e.g. E-Commerce Website Development"
                    value={reviewForm.projectName}
                    onChange={(e) => setReviewForm((prev) => ({ ...prev, projectName: e.target.value }))}
                  />
                </div>
                <div className="review-form-row">
                  <label className="review-label">Your Review *</label>
                  <textarea
                    className="review-textarea"
                    placeholder="Share your experience working together..."
                    rows={4}
                    value={reviewForm.reviewText}
                    onChange={(e) => setReviewForm((prev) => ({ ...prev, reviewText: e.target.value }))}
                  />
                </div>
                <button type="submit" className="upwork-btn upwork-btn-primary" disabled={submittingReview}>
                  {submittingReview ? 'Submitting...' : '🚀 Submit Review'}
                </button>
              </form>
            )}

            {/* Reviews List */}
            {reviewsList.length > 0 ? (
              <div className="upwork-reviews-list">
                {reviewsList.map((review, idx) => (
                  <div key={idx} className="upwork-review-card">
                    <div className="upwork-review-header">
                      <div>
                        <h4 className="upwork-review-client">{review.clientName}</h4>
                        {review.projectName && (
                          <span className="upwork-review-project">Project: {review.projectName}</span>
                        )}
                      </div>
                      <div className="upwork-review-rating-box">
                        <StarRating value={Math.round(review.rating)} readOnly />
                        <span className="upwork-review-date">{formatDate(review.createdAt)}</span>
                      </div>
                    </div>
                    {review.reviewText && (
                      <p className="upwork-review-comment">"{review.reviewText}"</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="upwork-no-reviews">
                <p>⭐ No reviews yet. Be the first to leave a review!</p>
              </div>
            )}
          </section>

          {/* Social Links on Right (Detailed view) */}
          <section className="upwork-section">
            <h2 className="upwork-section-title">Links</h2>
            <div className="upwork-social-links">
              {profile.links?.website && (
                <a href={profile.links.website} target="_blank" rel="noopener noreferrer" className="upwork-social-link">
                  🌐 Website
                </a>
              )}
              {profile.links?.linkedin && (
                <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" className="upwork-social-link linkedin">
                  💼 LinkedIn
                </a>
              )}
              {isFreelancer && profile.links?.github && (
                <a href={profile.links.github} target="_blank" rel="noopener noreferrer" className="upwork-social-link github">
                  🐙 GitHub
                </a>
              )}
              {isClient && profile.links?.twitter && (
                <a href={profile.links.twitter} target="_blank" rel="noopener noreferrer" className="upwork-social-link twitter">
                  🐦 Twitter / X
                </a>
              )}
              {!profile.links?.website && !profile.links?.github && !profile.links?.linkedin && !profile.links?.twitter && (
                <p className="upwork-no-links-hint">No links provided.</p>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Profile;
