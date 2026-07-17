import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import * as jobService from '../../services/jobService';
import { CATEGORIES, DURATIONS, SKILLS_LIST } from '../../utils/constants';
import { formatBudget } from '../../utils/helpers';
import './CreateJob.css';

const CATEGORY_SKILLS_MAP = {
  'Web Development': ['React', 'Node.js', 'JavaScript', 'TypeScript', 'Next.js', 'HTML', 'CSS', 'MongoDB', 'PostgreSQL', 'REST API', 'WordPress', 'Git'],
  'Mobile Development': ['React Native', 'Flutter', 'Swift', 'Kotlin', 'JavaScript', 'TypeScript', 'REST API', 'Firebase', 'Git'],
  'UI/UX Design': ['Figma', 'Adobe XD', 'UI Design', 'UX Research', 'Wireframing', 'Prototyping', 'Illustrator', 'Photoshop'],
  'Graphic Design': ['Photoshop', 'Illustrator', 'Figma', 'After Effects', 'Premiere Pro', 'UI Design'],
  'Content Writing': ['Content Writing', 'Copywriting', 'Technical Writing', 'SEO', 'Excel'],
  'Digital Marketing': ['SEO', 'Google Analytics', 'Social Media Marketing', 'Email Marketing', 'PPC Advertising'],
  'Data Science': ['Python', 'Data Analysis', 'Machine Learning', 'TensorFlow', 'Excel', 'Tableau', 'Power BI'],
  'Video Editing': ['Premiere Pro', 'After Effects', 'Photoshop', 'Illustrator'],
  'SEO': ['SEO', 'Google Analytics', 'Social Media Marketing', 'Email Marketing', 'WordPress'],
  'Other': ['React', 'Node.js', 'Python', 'Figma', 'HTML', 'CSS', 'JavaScript', 'WordPress', 'SEO', 'Copywriting']
};

const CreateJob = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const skillInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    skills: [],
    budgetMin: '',
    budgetMax: '',
    duration: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const filteredSkills = (SKILLS_LIST || []).filter(
    (skill) =>
      skill.toLowerCase().includes(skillInput.toLowerCase()) &&
      !formData.skills.includes(skill)
  );

  const suggestedSkills = CATEGORY_SKILLS_MAP[formData.category] || CATEGORY_SKILLS_MAP['Other'];

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (skillInputRef.current && !skillInputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const addSkill = (skill) => {
    if (formData.skills.length >= 10) {
      showToast('Maximum 10 skills allowed', 'info');
      return;
    }
    if (!formData.skills.includes(skill)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skill],
      }));
    }
    setSkillInput('');
    setShowSuggestions(false);
    if (errors.skills) {
      setErrors((prev) => ({ ...prev, skills: '' }));
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = skillInput.trim();
      if (trimmed) {
        const match = filteredSkills[0];
        addSkill(match || trimmed);
      }
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    }
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    }
    if (formData.skills.length === 0) {
      newErrors.skills = 'Add at least one skill';
    }
    if (!formData.budgetMin || Number(formData.budgetMin) <= 0) {
      newErrors.budgetMin = 'Minimum budget must be greater than 0';
    }
    if (!formData.budgetMax || Number(formData.budgetMax) <= 0) {
      newErrors.budgetMax = 'Maximum budget must be greater than 0';
    }
    if (
      formData.budgetMin &&
      formData.budgetMax &&
      Number(formData.budgetMax) <= Number(formData.budgetMin)
    ) {
      newErrors.budgetMax = 'Max budget must be greater than min budget';
    }
    if (!formData.duration) {
      newErrors.duration = 'Please select a duration';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const jobData = {
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim(),
        skills: formData.skills,
        budget: {
          min: Number(formData.budgetMin),
          max: Number(formData.budgetMax),
        },
        budgetMin: Number(formData.budgetMin),
        budgetMax: Number(formData.budgetMax),
        duration: formData.duration,
      };
      await jobService.createJob(jobData);
      showToast('Job posted successfully!', 'success');
      navigate('/dashboard/client');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to post job', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container container fade-in">
      <div className="create-job-header">
        <div>
          <h1 className="page-title">Post a New Job</h1>
          <p className="page-description">
            Fill in the details below to post your job and attract talented freelancers.
          </p>
        </div>
      </div>

      <div className="create-job-layout">
        <form className="job-form-card" onSubmit={handleSubmit} noValidate>
          {/* Job Title */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Job Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className={`form-input ${errors.title ? 'input-error' : ''}`}
              placeholder="e.g., Full Stack Developer for E-commerce Platform"
              value={formData.title}
              onChange={handleChange}
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          {/* Category */}
          <div className="form-group">
            <label htmlFor="category" className="form-label">
              Category <span className="required">*</span>
            </label>
            <select
              id="category"
              name="category"
              className={`form-input form-select ${errors.category ? 'input-error' : ''}`}
              value={formData.category}
              onChange={handleChange}
            >
              <option value="">Select a category</option>
              {(CATEGORIES || []).map((cat) => (
                <option key={typeof cat === 'string' ? cat : cat.value} value={typeof cat === 'string' ? cat : cat.value}>
                  {typeof cat === 'string' ? cat : cat.label}
                </option>
              ))}
            </select>
            {errors.category && <span className="error-text">{errors.category}</span>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              className={`form-input form-textarea ${errors.description ? 'input-error' : ''}`}
              placeholder="Describe the job requirements, responsibilities, and expectations..."
              value={formData.description}
              onChange={handleChange}
              rows={6}
            />
            <div className="textarea-footer">
              {errors.description && (
                <span className="error-text">{errors.description}</span>
              )}
              <span className={`char-count ${formData.description.length < 50 ? 'char-count--low' : 'char-count--ok'}`}>
                {formData.description.length}/50 min
              </span>
            </div>
          </div>

          {/* Skills */}
          <div className="form-group" ref={skillInputRef}>
            <label className="form-label">
              Required Skills <span className="required">*</span>
              <span className="label-hint">(max 10)</span>
            </label>
            <div className="skills-input-wrapper">
              <div className={`skills-input-container ${errors.skills ? 'input-error' : ''}`}>
                {formData.skills.map((skill) => (
                  <span key={skill} className="skill-tag">
                    {skill}
                    <button
                      type="button"
                      className="skill-remove"
                      onClick={() => removeSkill(skill)}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  className="skills-input"
                  placeholder={formData.skills.length === 0 ? 'Type a skill and press Enter...' : 'Add more...'}
                  value={skillInput}
                  onChange={(e) => {
                    setSkillInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={handleSkillKeyDown}
                />
              </div>
            </div>
            {showSuggestions && skillInput && filteredSkills.length > 0 && (
              <div className="skills-suggestions">
                {filteredSkills.slice(0, 8).map((skill) => (
                  <button
                    type="button"
                    key={skill}
                    className="suggestion-item"
                    onClick={() => addSkill(skill)}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            )}
            
            {/* Suggested Skills below input */}
            <div className="popular-skills-suggestions" style={{ marginTop: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Suggested skills based on category (click to toggle):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {suggestedSkills.map((skill) => {
                  const isSelected = formData.skills.includes(skill);
                  return (
                    <button
                      type="button"
                      key={skill}
                      onClick={() => isSelected ? removeSkill(skill) : addSkill(skill)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '16px',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        border: isSelected ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                        background: isSelected ? 'var(--primary-light)' : '#fff',
                        color: isSelected ? 'var(--primary-dark)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {skill} {isSelected ? '✓' : '+'}
                    </button>
                  );
                })}
              </div>
            </div>
            {errors.skills && <span className="error-text">{errors.skills}</span>}
          </div>

          {/* Budget Range */}
          <div className="form-group">
            <label className="form-label">
              Budget Range (USD) <span className="required">*</span>
            </label>
            <div className="budget-row">
              <div className="budget-field">
                <div className="input-with-prefix">
                  <span className="input-prefix">$</span>
                  <input
                    type="number"
                    name="budgetMin"
                    className={`form-input budget-input ${errors.budgetMin ? 'input-error' : ''}`}
                    placeholder="Min"
                    value={formData.budgetMin}
                    onChange={handleChange}
                    min="1"
                  />
                </div>
                {errors.budgetMin && <span className="error-text">{errors.budgetMin}</span>}
              </div>
              <span className="budget-separator">—</span>
              <div className="budget-field">
                <div className="input-with-prefix">
                  <span className="input-prefix">$</span>
                  <input
                    type="number"
                    name="budgetMax"
                    className={`form-input budget-input ${errors.budgetMax ? 'input-error' : ''}`}
                    placeholder="Max"
                    value={formData.budgetMax}
                    onChange={handleChange}
                    min="1"
                  />
                </div>
                {errors.budgetMax && <span className="error-text">{errors.budgetMax}</span>}
              </div>
            </div>
          </div>

          {/* Duration */}
          <div className="form-group">
            <label htmlFor="duration" className="form-label">
              Duration <span className="required">*</span>
            </label>
            <select
              id="duration"
              name="duration"
              className={`form-input form-select ${errors.duration ? 'input-error' : ''}`}
              value={formData.duration}
              onChange={handleChange}
            >
              <option value="">Select duration</option>
              {(DURATIONS || []).map((dur) => (
                <option key={typeof dur === 'string' ? dur : dur.value} value={typeof dur === 'string' ? dur : dur.value}>
                  {typeof dur === 'string' ? dur : dur.label}
                </option>
              ))}
            </select>
            {errors.duration && <span className="error-text">{errors.duration}</span>}
          </div>

          {/* Preview Toggle */}
          <button
            type="button"
            className="preview-toggle"
            onClick={() => setShowPreview(!showPreview)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {showPreview ? 'Hide Preview' : 'Preview Job Post'}
          </button>

          {/* Preview Section */}
          {showPreview && (
            <div className="preview-section">
              <div className="preview-header">
                <span className="preview-label">📄 Preview</span>
              </div>
              <div className="preview-content">
                <h3 className="preview-title">
                  {formData.title || 'Job Title'}
                </h3>
                {formData.category && (
                  <span className="preview-category">{typeof formData.category === 'string' ? formData.category : ''}</span>
                )}
                <p className="preview-description">
                  {formData.description || 'Job description will appear here...'}
                </p>
                {formData.skills.length > 0 && (
                  <div className="preview-skills">
                    {formData.skills.map((skill) => (
                      <span key={skill} className="preview-skill-tag">{skill}</span>
                    ))}
                  </div>
                )}
                <div className="preview-meta">
                  {formData.budgetMin && formData.budgetMax && (
                    <span className="preview-meta-item">
                      💰 ${formData.budgetMin} — ${formData.budgetMax}
                    </span>
                  )}
                  {formData.duration && (
                    <span className="preview-meta-item">
                      ⏱ {formData.duration}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <Link to="/client/dashboard" className="btn-cancel">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn-submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="btn-spinner"></span>
                  Posting...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  Post Job
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJob;
