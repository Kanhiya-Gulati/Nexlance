import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './Register.css';

const Register = () => {
  const { user, register, googleLogin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    skills: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(user.role === 'client' ? '/dashboard/client' : '/dashboard/freelancer');
    }
  }, [user, navigate]);

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    if (formData.role === 'freelancer' && !formData.skills.trim()) {
      newErrors.skills = 'Please enter at least one skill';
    }

    if (!agreeTerms) {
      newErrors.terms = 'You must agree to the Terms of Service';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRoleSelect = (role) => {
    setFormData(prev => ({ ...prev, role }));
    if (errors.role) {
      setErrors(prev => ({ ...prev, role: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      if (formData.role === 'freelancer' && formData.skills.trim()) {
        payload.skills = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
      }

      await register(payload);
      showToast('Account created successfully! Verification OTP sent to your Gmail.', 'success');
      localStorage.setItem('verify_email', formData.email);
      navigate('/verify-email', { state: { email: formData.email } });
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      {/* Left decorative panel */}
      <div className="register-decor-panel">
        <div className="decor-shapes">
          <div className="decor-shape decor-shape-1"></div>
          <div className="decor-shape decor-shape-2"></div>
          <div className="decor-shape decor-shape-3"></div>
          <div className="decor-shape decor-shape-4"></div>
        </div>
        <div className="decor-content">
          <div className="decor-logo">NEXLANCE</div>
          <h2 className="decor-heading">Start Your Journey Today</h2>
          <p className="decor-text">
            Join a thriving community of freelancers and clients. Build your career or find the perfect talent.
          </p>
          <div className="decor-stats">
            <div className="decor-stat">
              <span className="decor-stat-value">10K+</span>
              <span className="decor-stat-label">Freelancers</span>
            </div>
            <div className="decor-stat">
              <span className="decor-stat-value">5K+</span>
              <span className="decor-stat-label">Projects</span>
            </div>
            <div className="decor-stat">
              <span className="decor-stat-value">98%</span>
              <span className="decor-stat-label">Satisfied</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="register-form-panel">
        <div className="register-card">
          <div className="register-card-header">
            <Link to="/" className="register-logo">NEXLANCE</Link>
            <h1 className="register-title">Create Account</h1>
            <p className="register-subtitle">Join NEXLANCE as a Client or Freelancer</p>
          </div>

          <form className="register-form" onSubmit={handleSubmit} noValidate>
            {/* Role Selector */}
            <div className="form-group">
              <label className="form-label">I want to...</label>
              <div className="role-selector">
                <button
                  type="button"
                  className={`role-card ${formData.role === 'client' ? 'role-card-active' : ''}`}
                  onClick={() => handleRoleSelect('client')}
                >
                  <span className="role-icon">💼</span>
                  <span className="role-label">Hire Talent</span>
                  <span className="role-desc">I'm a client</span>
                </button>
                <button
                  type="button"
                  className={`role-card ${formData.role === 'freelancer' ? 'role-card-active' : ''}`}
                  onClick={() => handleRoleSelect('freelancer')}
                >
                  <span className="role-icon">💻</span>
                  <span className="role-label">Find Work</span>
                  <span className="role-desc">I'm a freelancer</span>
                </button>
              </div>
              {errors.role && <span className="form-error">{errors.role}</span>}
            </div>

            {/* Name */}
            <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
              <label htmlFor="name" className="form-label">Full Name</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="form-input"
                  autoComplete="name"
                  style={{ paddingLeft: '48px', paddingRight: '44px' }}
                />
              </div>
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            {/* Email */}
            <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
              <label htmlFor="reg-email" className="form-label">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 4L12 13 2 4" />
                  </svg>
                </span>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="form-input"
                  autoComplete="email"
                  style={{ paddingLeft: '48px', paddingRight: '44px' }}
                />
              </div>
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className={`form-group ${errors.password ? 'has-error' : ''}`}>
              <label htmlFor="reg-password" className="form-label">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className="form-input"
                  autoComplete="new-password"
                  style={{ paddingLeft: '48px', paddingRight: '44px' }}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(prev => !prev)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            {/* Confirm Password */}
            <div className={`form-group ${errors.confirmPassword ? 'has-error' : ''}`}>
              <label htmlFor="reg-confirm-password" className="form-label">Confirm Password</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                <input
                  id="reg-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="form-input"
                  autoComplete="new-password"
                  style={{ paddingLeft: '48px', paddingRight: '44px' }}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
            </div>

            {/* Skills (Freelancer only) */}
            {formData.role === 'freelancer' && (
              <div className={`form-group ${errors.skills ? 'has-error' : ''}`}>
                <label htmlFor="skills" className="form-label">Skills</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </span>
                  <input
                    id="skills"
                    name="skills"
                    type="text"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="React, Node.js, UI Design..."
                    className="form-input"
                    style={{ paddingLeft: '48px', paddingRight: '44px' }}
                  />
                </div>
                <span className="form-hint">Enter skills separated by commas</span>
                {errors.skills && <span className="form-error">{errors.skills}</span>}
              </div>
            )}

            {/* Terms Agreement */}
            <div className="form-group">
              <label className="terms-checkbox">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    if (errors.terms) setErrors(prev => ({ ...prev, terms: '' }));
                  }}
                />
                <span className="checkmark"></span>
                <span>
                  I agree to the <a href="#" className="terms-link">Terms of Service</a> and{' '}
                  <a href="#" className="terms-link">Privacy Policy</a>
                </span>
              </label>
              {errors.terms && <span className="form-error">{errors.terms}</span>}
            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Google OAuth Divider */}
          <div className="login-divider">
            <span>or</span>
          </div>

          {/* Google Sign Up Button */}
          <div className="google-login-wrapper">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                try {
                  const data = await googleLogin(credentialResponse.credential);
                  if (data.needsRole) {
                    showToast(data.message || 'Please select your role.', 'info');
                    navigate('/select-role');
                  } else {
                    showToast(data.message || 'Signed up with Google!', 'success');
                    const role = data.user?.role;
                    navigate(role === 'client' ? '/dashboard/client' : '/dashboard/freelancer');
                  }
                } catch (err) {
                  showToast(err.response?.data?.message || 'Google sign-up failed.', 'error');
                }
              }}
              onError={() => {
                showToast('Google sign-up failed. Please try again.', 'error');
              }}
              text="signup_with"
              shape="rectangular"
              size="large"
              width="100%"
              theme="outline"
            />
          </div>

          <div className="register-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
