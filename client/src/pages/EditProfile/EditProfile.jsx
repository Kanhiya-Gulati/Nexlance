import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import * as profileService from '../../services/profileService';
import { SKILLS_LIST } from '../../utils/constants';
import Spinner from '../../components/Spinner/Spinner';
import './EditProfile.css';

/**
 * EditProfile - Form for users to update their profile information.
 * Supports avatar upload, bio, skills, hourly rate, location, etc.
 */
const EditProfile = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    bio: '',
    location: '',
    hourlyRate: '',
    skills: [],
    website: '',
    github: '',
    linkedin: '',
    projects: [],
    minProjectBudget: '',
    preferredProjectType: 'Both',
    availability: 'Available',
    phone: '',
    languages: '',
    education: [],
    certifications: [],
    twitter: '',
    industry: '',
    tagline: '',
    companySize: '',
    businessType: '',
    gstNumber: '',
  });
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    cost: '',
    link: '',
    githubLink: '',
    technologies: '',
    image: '',
  });
  const [newEducation, setNewEducation] = useState({ school: '', degree: '', year: '' });
  const [newCert, setNewCert] = useState({ name: '', issuer: '', year: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // profileService.getProfile returns { success, user }
      const data = await profileService.getProfile(user._id);
      const p = data.user || data;
      setFormData({
        name: p.name || '',
        title: p.title || '',
        bio: p.bio || '',
        location: p.location || '',
        hourlyRate: p.hourlyRate || '',
        skills: p.skills || [],
        website: p.links?.website || '',
        github: p.links?.github || '',
        linkedin: p.links?.linkedin || '',
        projects: p.projects || [],
        minProjectBudget: p.minProjectBudget || '',
        preferredProjectType: p.preferredProjectType || 'Both',
        availability: p.availability || 'Available',
        phone: p.phone || '',
        languages: p.languages?.join(', ') || '',
        education: p.education || [],
        certifications: p.certifications || [],
        twitter: p.links?.twitter || '',
        industry: p.industry || '',
        tagline: p.tagline || '',
        companySize: p.companySize || '',
        businessType: p.businessType || '',
        gstNumber: p.gstNumber || '',
      });
      if (p.avatar) setAvatarPreview(p.avatar);
    } catch (err) {
      showToast('Failed to load profile.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const addSkill = (skill) => {
    const trimmed = skill.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, trimmed] }));
    }
    setSkillInput('');
  };

  const handleProjectChange = (e) => {
    const { name, value } = e.target;
    setNewProject(prev => ({ ...prev, [name]: value }));
  };

  const addProject = (e) => {
    e.preventDefault();
    if (!newProject.title.trim()) {
      showToast('Project title is required', 'warning');
      return;
    }
    const projectToAdd = {
      title: newProject.title.trim(),
      description: newProject.description.trim(),
      cost: Number(newProject.cost) || 0,
      link: newProject.link.trim(),
      githubLink: newProject.githubLink.trim(),
      technologies: newProject.technologies ? newProject.technologies.split(',').map(t => t.trim()).filter(Boolean) : [],
      image: newProject.image.trim() || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=60',
    };
    setFormData(prev => ({
      ...prev,
      projects: [...(prev.projects || []), projectToAdd]
    }));
    setNewProject({ title: '', description: '', cost: '', link: '', githubLink: '', technologies: '', image: '' });
    showToast('Project added!', 'success');
  };

  const removeProject = (index) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, idx) => idx !== index)
    }));
  };

  const addEducation = (e) => {
    e.preventDefault();
    if (!newEducation.school.trim() || !newEducation.degree.trim()) {
      showToast('School and Degree are required', 'warning');
      return;
    }
    setFormData(prev => ({
      ...prev,
      education: [...(prev.education || []), { ...newEducation, year: Number(newEducation.year) || 2024 }]
    }));
    setNewEducation({ school: '', degree: '', year: '' });
  };

  const removeEducation = (index) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, idx) => idx !== index)
    }));
  };

  const addCertification = (e) => {
    e.preventDefault();
    if (!newCert.name.trim() || !newCert.issuer.trim()) {
      showToast('Name and Issuer are required', 'warning');
      return;
    }
    setFormData(prev => ({
      ...prev,
      certifications: [...(prev.certifications || []), { ...newCert, year: Number(newCert.year) || 2024 }]
    }));
    setNewCert({ name: '', issuer: '', year: '' });
  };

  const removeCertification = (index) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, idx) => idx !== index)
    }));
  };

  const removeSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill),
    }));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(skillInput);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Upload avatar first if changed
      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        await profileService.uploadAvatar(fd);
      }

      const payload = {
        name: formData.name,
        title: formData.title,
        bio: formData.bio,
        location: formData.location,
        skills: formData.skills,
        projects: formData.projects,
        minProjectBudget: Number(formData.minProjectBudget) || 0,
        preferredProjectType: formData.preferredProjectType,
        availability: formData.availability,
        phone: formData.phone,
        languages: formData.languages ? formData.languages.split(',').map(l => l.trim()).filter(Boolean) : [],
        education: formData.education,
        certifications: formData.certifications,
        industry: formData.industry,
        tagline: formData.tagline,
        companySize: formData.companySize,
        businessType: formData.businessType,
        gstNumber: formData.gstNumber,
        ...(user.role === 'freelancer' && { hourlyRate: Number(formData.hourlyRate) || 0 }),
        links: {
          website: formData.website,
          github: formData.github,
          linkedin: formData.linkedin,
          twitter: formData.twitter,
        },
      };

      const data = await profileService.updateProfile(payload);
      const updated = data.user || data;
      updateUser(updated);
      showToast('Profile updated successfully!', 'success');
      navigate(`/profile/${user._id}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile.';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner size="lg" fullPage />;

  return (
    <div className="page-container fade-in">
      <div className="container edit-profile-container">
        <div className="edit-profile-header">
          <h1 className="edit-profile-title">Edit Profile</h1>
          <p className="edit-profile-subtitle">Keep your profile up to date to attract more opportunities.</p>
        </div>

        <form className="edit-profile-form" onSubmit={handleSubmit}>
          {/* Avatar Section */}
          <div className="ep-section">
            <h2 className="ep-section-title">Profile Photo</h2>
            <div className="ep-avatar-row">
              <div className="ep-avatar-preview">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" />
                ) : (
                  <div className="ep-avatar-placeholder">
                    {formData.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div className="ep-avatar-upload">
                <label htmlFor="avatar-input" className="ep-upload-btn">
                  📷 Choose Photo
                </label>
                <input
                  id="avatar-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
                <p className="ep-upload-hint">JPG, PNG or GIF. Max 5MB.</p>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="ep-section">
            <h2 className="ep-section-title">Basic Information</h2>
            <div className="ep-grid">
              <div className="ep-field">
                <label className="ep-label">{user.role === 'client' ? 'Company Name / Client Name *' : 'Full Name *'}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="ep-input"
                  placeholder={user.role === 'client' ? 'Company or client name' : 'Your full name'}
                  required
                />
              </div>
              {user.role === 'freelancer' && (
                <div className="ep-field">
                  <label className="ep-label">Professional Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="ep-input"
                    placeholder="e.g. Full Stack Developer"
                  />
                </div>
              )}
              {user.role === 'client' && (
                <>
                  <div className="ep-field">
                    <label className="ep-label">Industry</label>
                    <input
                      type="text"
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      className="ep-input"
                      placeholder="e.g. IT, Healthcare, Finance"
                    />
                  </div>
                  <div className="ep-field">
                    <label className="ep-label">Tagline</label>
                    <input
                      type="text"
                      name="tagline"
                      value={formData.tagline}
                      onChange={handleChange}
                      className="ep-input"
                      placeholder="e.g. Innovating software solutions"
                    />
                  </div>
                </>
              )}
              <div className="ep-field">
                <label className="ep-label">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="ep-input"
                  placeholder="City, Country"
                />
              </div>
              <div className="ep-field">
                <label className="ep-label">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="ep-input"
                  placeholder="e.g. +91 9876543210"
                />
              </div>
              {user.role === 'freelancer' && (
                <div className="ep-field">
                  <label className="ep-label">Languages Known (comma separated)</label>
                  <input
                    type="text"
                    name="languages"
                    value={formData.languages}
                    onChange={handleChange}
                    className="ep-input"
                    placeholder="e.g. English, Hindi, Spanish"
                  />
                </div>
              )}
            </div>
            <div className="ep-field ep-field--full" style={{ marginTop: '16px' }}>
              <label className="ep-label">{user.role === 'client' ? 'About Company / Client Bio' : 'Bio / About Me'}</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="ep-textarea"
                placeholder={user.role === 'client' ? 'Describe your company history, culture, and core mission...' : 'Tell clients about yourself, your experience, and what makes you unique...'}
                rows={5}
              />
            </div>
          </div>

          {/* Company Details (clients only) */}
          {user.role === 'client' && (
            <div className="ep-section">
              <h2 className="ep-section-title">Company Details</h2>
              <div className="ep-grid">
                <div className="ep-field">
                  <label className="ep-label">Company Size</label>
                  <select
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleChange}
                    className="ep-input"
                  >
                    <option value="">Select Company Size</option>
                    <option value="1-10">1-10 Employees</option>
                    <option value="11-50">11-50 Employees</option>
                    <option value="51-200">51-200 Employees</option>
                    <option value="201-500">201-500 Employees</option>
                    <option value="500+">500+ Employees</option>
                  </select>
                </div>
                <div className="ep-field">
                  <label className="ep-label">Business Type</label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    className="ep-input"
                  >
                    <option value="">Select Business Type</option>
                    <option value="Startup">Startup</option>
                    <option value="Agency">Agency</option>
                    <option value="Individual">Individual</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <div className="ep-field">
                  <label className="ep-label">GST Number (Optional)</label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    className="ep-input"
                    placeholder="e.g. 07AAAAA1111A1Z1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Work Details (freelancers only) */}
          {user.role === 'freelancer' && (
            <div className="ep-section">
              <h2 className="ep-section-title">Work & Project Preferences</h2>
              <div className="ep-grid">
                <div className="ep-field">
                  <label className="ep-label">Hourly Rate ($/hour)</label>
                  <input
                    type="number"
                    name="hourlyRate"
                    value={formData.hourlyRate}
                    onChange={handleChange}
                    className="ep-input"
                    placeholder="e.g. 50"
                    min="0"
                  />
                </div>
                <div className="ep-field">
                  <label className="ep-label">Minimum Project Budget ($)</label>
                  <input
                    type="number"
                    name="minProjectBudget"
                    value={formData.minProjectBudget}
                    onChange={handleChange}
                    className="ep-input"
                    placeholder="e.g. 5000"
                    min="0"
                  />
                </div>
                <div className="ep-field">
                  <label className="ep-label">Preferred Project Type</label>
                  <select
                    name="preferredProjectType"
                    value={formData.preferredProjectType}
                    onChange={handleChange}
                    className="ep-input"
                  >
                    <option value="Fixed Price">Fixed Price</option>
                    <option value="Hourly">Hourly</option>
                    <option value="Both">Both (Fixed & Hourly)</option>
                  </select>
                </div>
                <div className="ep-field">
                  <label className="ep-label">Current Availability</label>
                  <select
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                    className="ep-input"
                  >
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Skills (freelancers only) */}
          {user.role === 'freelancer' && (
            <div className="ep-section">
              <h2 className="ep-section-title">Skills</h2>
              <div className="ep-skills-input-row">
                <input
                  type="text"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  className="ep-input"
                  placeholder="Type a skill and press Enter"
                />
                <button
                  type="button"
                  className="ep-add-skill-btn"
                  onClick={() => addSkill(skillInput)}
                >
                  Add
                </button>
              </div>
              <p className="ep-upload-hint">Or select from common skills:</p>
              <div className="ep-skill-suggestions">
                {SKILLS_LIST.slice(0, 20).filter(s => !formData.skills.includes(s)).map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    className="ep-skill-suggestion"
                    onClick={() => addSkill(skill)}
                  >
                    + {skill}
                  </button>
                ))}
              </div>
              {formData.skills.length > 0 && (
                <div className="ep-selected-skills">
                  {formData.skills.map((skill) => (
                    <span key={skill} className="ep-skill-tag">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ep-skill-remove"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Portfolio Projects (freelancers only) */}
          {user.role === 'freelancer' && (
            <div className="ep-section">
              <h2 className="ep-section-title">Portfolio Projects</h2>
              
              {/* Form to add a project */}
              <div className="ep-project-form-container">
                <h3 className="ep-project-form-heading">Add a Project</h3>
                <div className="ep-grid">
                  <div className="ep-field">
                    <label className="ep-label">Project Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={newProject.title}
                      onChange={handleProjectChange}
                      className="ep-input"
                      placeholder="e.g. E-Commerce App Development"
                    />
                  </div>
                  <div className="ep-field">
                    <label className="ep-label">Project Value / Cost ($)</label>
                    <input
                      type="number"
                      name="cost"
                      value={newProject.cost}
                      onChange={handleProjectChange}
                      className="ep-input"
                      placeholder="e.g. 150"
                      min="0"
                    />
                  </div>
                  <div className="ep-field">
                    <label className="ep-label">Live Demo Link</label>
                    <input
                      type="url"
                      name="link"
                      value={newProject.link}
                      onChange={handleProjectChange}
                      className="ep-input"
                      placeholder="https://myproject.com"
                    />
                  </div>
                  <div className="ep-field">
                    <label className="ep-label">GitHub Repository Link</label>
                    <input
                      type="url"
                      name="githubLink"
                      value={newProject.githubLink}
                      onChange={handleProjectChange}
                      className="ep-input"
                      placeholder="https://github.com/username/project"
                    />
                  </div>
                  <div className="ep-field ep-field--full">
                    <label className="ep-label">Technologies Used (comma separated)</label>
                    <input
                      type="text"
                      name="technologies"
                      value={newProject.technologies}
                      onChange={handleProjectChange}
                      className="ep-input"
                      placeholder="e.g. React, Node.js, MongoDB, CSS"
                    />
                  </div>
                  <div className="ep-field ep-field--full">
                    <label className="ep-label">Project Image URL</label>
                    <input
                      type="url"
                      name="image"
                      value={newProject.image}
                      onChange={handleProjectChange}
                      className="ep-input"
                      placeholder="https://example.com/project-screenshot.png"
                    />
                  </div>
                  <div className="ep-field ep-field--full">
                    <label className="ep-label">Description</label>
                    <textarea
                      name="description"
                      value={newProject.description}
                      onChange={handleProjectChange}
                      className="ep-textarea"
                      placeholder="Describe what you built, technologies used, and your contribution..."
                      rows={3}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="ep-add-project-btn"
                  onClick={addProject}
                >
                  ➕ Add Project
                </button>
              </div>

              {/* List of currently added projects */}
              {formData.projects && formData.projects.length > 0 ? (
                <div className="ep-projects-list">
                  <h3 className="ep-projects-list-heading">Current Projects ({formData.projects.length})</h3>
                  <div className="ep-projects-grid">
                    {formData.projects.map((proj, index) => (
                      <div key={index} className="ep-project-item-card">
                        <div className="ep-project-item-header">
                          <h4 className="ep-project-item-title">{proj.title}</h4>
                          <button
                            type="button"
                            className="ep-project-item-remove-btn"
                            onClick={() => removeProject(index)}
                          >
                            ✕ Remove
                          </button>
                        </div>
                        <div className="ep-project-item-meta" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '8px', fontSize: '0.85rem' }}>
                          {proj.cost > 0 && (
                            <div className="ep-project-item-cost">
                              <strong>Value:</strong> ${proj.cost.toLocaleString()}
                            </div>
                          )}
                          {proj.link && (
                            <div className="ep-project-item-link">
                              <a href={proj.link} target="_blank" rel="noopener noreferrer">
                                🔗 Demo Link
                              </a>
                            </div>
                          )}
                          {proj.githubLink && (
                            <div className="ep-project-item-link">
                              <a href={proj.githubLink} target="_blank" rel="noopener noreferrer">
                                🐙 GitHub
                              </a>
                            </div>
                          )}
                        </div>
                        {proj.technologies && proj.technologies.length > 0 && (
                          <div className="ep-project-item-techs" style={{ marginBottom: '8px' }}>
                            {proj.technologies.map((t, idx) => (
                              <span key={idx} className="ep-skill-tag" style={{ fontSize: '0.75rem', padding: '3px 8px', marginRight: '4px' }}>{t}</span>
                            ))}
                          </div>
                        )}
                        {proj.description && (
                          <p className="ep-project-item-desc">{proj.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="ep-no-projects-hint">No projects added yet. Show off your work to stand out to clients!</p>
              )}
            </div>
          )}

          {/* Education & Certifications (freelancers only) */}
          {user.role === 'freelancer' && (
            <div className="ep-section">
              <h2 className="ep-section-title">Education & Certifications</h2>
              
              {/* Education Block */}
              <div className="ep-education-form-container" style={{ marginBottom: '32px' }}>
                <h3 className="ep-project-form-heading">🎓 Add Education</h3>
                <div className="ep-grid" style={{ marginBottom: '12px' }}>
                  <div className="ep-field">
                    <label className="ep-label">School / University</label>
                    <input
                      type="text"
                      value={newEducation.school}
                      onChange={e => setNewEducation(prev => ({ ...prev, school: e.target.value }))}
                      className="ep-input"
                      placeholder="e.g. Stanford University"
                    />
                  </div>
                  <div className="ep-field">
                    <label className="ep-label">Degree / Field of Study</label>
                    <input
                      type="text"
                      value={newEducation.degree}
                      onChange={e => setNewEducation(prev => ({ ...prev, degree: e.target.value }))}
                      className="ep-input"
                      placeholder="e.g. Bachelor of Science in Computer Science"
                    />
                  </div>
                  <div className="ep-field">
                    <label className="ep-label">Year of Graduation</label>
                    <input
                      type="number"
                      value={newEducation.year}
                      onChange={e => setNewEducation(prev => ({ ...prev, year: e.target.value }))}
                      className="ep-input"
                      placeholder="e.g. 2023"
                    />
                  </div>
                </div>
                <button type="button" className="ep-add-project-btn" onClick={addEducation}>
                  ➕ Add Education
                </button>

                {formData.education && formData.education.length > 0 && (
                  <div className="ep-sublist" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {formData.education.map((edu, idx) => (
                      <div key={idx} className="ep-sublist-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-primary)' }}>
                        <div style={{ fontSize: '0.875rem' }}>
                          <strong>{edu.degree}</strong> at {edu.school} ({edu.year})
                        </div>
                        <button type="button" className="ep-project-item-remove-btn" onClick={() => removeEducation(idx)} style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}>✕ Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Certifications Block */}
              <div className="ep-cert-form-container" style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <h3 className="ep-project-form-heading">📜 Add Certification</h3>
                <div className="ep-grid" style={{ marginBottom: '12px' }}>
                  <div className="ep-field">
                    <label className="ep-label">Certification Name</label>
                    <input
                      type="text"
                      value={newCert.name}
                      onChange={e => setNewCert(prev => ({ ...prev, name: e.target.value }))}
                      className="ep-input"
                      placeholder="e.g. AWS Solutions Architect"
                    />
                  </div>
                  <div className="ep-field">
                    <label className="ep-label">Issuing Organization</label>
                    <input
                      type="text"
                      value={newCert.issuer}
                      onChange={e => setNewCert(prev => ({ ...prev, issuer: e.target.value }))}
                      className="ep-input"
                      placeholder="e.g. Amazon Web Services"
                    />
                  </div>
                  <div className="ep-field">
                    <label className="ep-label">Year Earned</label>
                    <input
                      type="number"
                      value={newCert.year}
                      onChange={e => setNewCert(prev => ({ ...prev, year: e.target.value }))}
                      className="ep-input"
                      placeholder="e.g. 2024"
                    />
                  </div>
                </div>
                <button type="button" className="ep-add-project-btn" onClick={addCertification}>
                  ➕ Add Certification
                </button>

                {formData.certifications && formData.certifications.length > 0 && (
                  <div className="ep-sublist" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {formData.certifications.map((cert, idx) => (
                      <div key={idx} className="ep-sublist-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-primary)' }}>
                        <div style={{ fontSize: '0.875rem' }}>
                          <strong>{cert.name}</strong> issued by {cert.issuer} ({cert.year})
                        </div>
                        <button type="button" className="ep-project-item-remove-btn" onClick={() => removeCertification(idx)} style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}>✕ Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Social Links */}
          <div className="ep-section">
            <h2 className="ep-section-title">Links</h2>
            <div className="ep-grid">
              <div className="ep-field">
                <label className="ep-label">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="ep-input"
                  placeholder="https://yourwebsite.com"
                />
              </div>
              {user.role === 'freelancer' && (
                <div className="ep-field">
                  <label className="ep-label">GitHub</label>
                  <input
                    type="url"
                    name="github"
                    value={formData.github}
                    onChange={handleChange}
                    className="ep-input"
                    placeholder="https://github.com/username"
                  />
                </div>
              )}
              <div className="ep-field">
                <label className="ep-label">LinkedIn</label>
                <input
                  type="url"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleChange}
                  className="ep-input"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              {user.role === 'client' && (
                <div className="ep-field">
                  <label className="ep-label">Twitter / X</label>
                  <input
                    type="url"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleChange}
                    className="ep-input"
                    placeholder="https://twitter.com/company"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="ep-actions">
            <button
              type="button"
              className="ep-cancel-btn"
              onClick={() => navigate(`/profile/${user._id}`)}
            >
              Cancel
            </button>
            <button type="submit" className="ep-save-btn" disabled={saving}>
              {saving ? (
                <>
                  <span className="ep-spinner" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
