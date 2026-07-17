import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './Login.css';

const Login = () => {
  const { user, login, sendLoginOtp, loginOtp, googleLogin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Login Mode: 'password' or 'otp'
  const [loginMode, setLoginMode] = useState('password');
  // OTP Login Step: 1 = Enter email to get OTP, 2 = Enter OTP code to login
  const [otpStep, setOtpStep] = useState(1);
  const [otpCode, setOtpCode] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(user.role === 'client' ? '/dashboard/client' : '/dashboard/freelancer');
    }
  }, [user, navigate]);

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (loginMode === 'password') {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (loginMode === 'password') {
        const response = await login(formData.email, formData.password);
        showToast('Welcome back! Login successful.', 'success');
        const role = response?.user?.role || response?.role;
        navigate(role === 'client' ? '/dashboard/client' : '/dashboard/freelancer');
      } else {
        // OTP Login Step 1: Send OTP
        if (otpStep === 1) {
          const data = await sendLoginOtp(formData.email);
          showToast(data.message || 'Login OTP sent to your Gmail.', 'success');
          setOtpStep(2);
        } else {
          // OTP Login Step 2: Verify & Log In
          if (!otpCode || otpCode.length !== 6 || isNaN(otpCode)) {
            showToast('Please enter a valid 6-digit OTP code.', 'warning');
            setLoading(false);
            return;
          }
          const response = await loginOtp(formData.email, otpCode);
          showToast('Welcome back! Login successful.', 'success');
          const role = response?.user?.role || response?.role;
          navigate(role === 'client' ? '/dashboard/client' : '/dashboard/freelancer');
        }
      }
    } catch (err) {
      if (err.response?.data?.needsVerification) {
        showToast(err.response.data.message || 'Please verify your email address.', 'info');
        localStorage.setItem('verify_email', formData.email);
        navigate('/verify-email');
      } else {
        const message = err.response?.data?.message || err.message || 'Login failed. Please try again.';
        showToast(message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendLoginOtp = async () => {
    setLoading(true);
    try {
      const data = await sendLoginOtp(formData.email);
      showToast(data.message || 'OTP code resent to your Gmail.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to resend OTP.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left decorative panel */}
      <div className="login-decor-panel">
        <div className="decor-shapes">
          <div className="decor-shape decor-shape-1"></div>
          <div className="decor-shape decor-shape-2"></div>
          <div className="decor-shape decor-shape-3"></div>
          <div className="decor-shape decor-shape-4"></div>
        </div>
        <div className="decor-content">
          <div className="decor-logo">NEXLANCE</div>
          <h2 className="decor-heading">Welcome to the Future of Freelancing</h2>
          <p className="decor-text">
            Connect with top talent, manage projects seamlessly, and grow your business with NEXLANCE.
          </p>
          <div className="decor-features">
            <div className="decor-feature">
              <span className="decor-feature-icon">🔒</span>
              <span>Secure Payments</span>
            </div>
            <div className="decor-feature">
              <span className="decor-feature-icon">⚡</span>
              <span>Fast Matching</span>
            </div>
            <div className="decor-feature">
              <span className="decor-feature-icon">🌍</span>
              <span>Global Talent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="login-form-panel">
        <div className="login-card">
          <div className="login-card-header">
            <Link to="/" className="login-logo">NEXLANCE</Link>
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">Sign in to your account</p>
          </div>

          {/* Mode Selector Tabs */}
          <div className="login-tabs">
            <button
              type="button"
              className={`login-tab ${loginMode === 'password' ? 'active' : ''}`}
              onClick={() => {
                setLoginMode('password');
                setErrors({});
              }}
            >
              Password Login
            </button>
            <button
              type="button"
              className={`login-tab ${loginMode === 'otp' ? 'active' : ''}`}
              onClick={() => {
                setLoginMode('otp');
                setOtpStep(1);
                setErrors({});
              }}
            >
              Gmail OTP Login
            </button>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
              <label htmlFor="email" className="form-label">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 4L12 13 2 4" />
                  </svg>
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="form-input"
                  autoComplete="email"
                  disabled={loginMode === 'otp' && otpStep === 2}
                  style={{ paddingLeft: '48px', paddingRight: '44px' }}
                />
              </div>
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            {loginMode === 'password' ? (
              <>
                <div className={`form-group ${errors.password ? 'has-error' : ''}`}>
                  <label htmlFor="password" className="form-label">Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className="form-input"
                      autoComplete="current-password"
                      style={{ paddingLeft: '48px', paddingRight: '44px' }}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(prev => !prev)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
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

                <div className="form-options">
                  <label className="remember-me">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    <span>Remember me</span>
                  </label>
                  <Link to="/forgot-password" style={{ color: 'var(--primary)' }} className="forgot-password">Forgot password?</Link>
                </div>

                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="btn-spinner"></span>
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </>
            ) : (
              // OTP Mode
              <>
                {otpStep === 2 && (
                  <div className="form-group">
                    <label htmlFor="otpCode" className="form-label">Enter 6-Digit OTP</label>
                    <div className="input-wrapper">
                      <span className="input-icon">🔑</span>
                      <input
                        id="otpCode"
                        type="text"
                        maxLength="6"
                        placeholder="e.g. 123456"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="form-input"
                        style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.15rem', fontWeight: 'bold' }}
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="btn-spinner"></span>
                      {otpStep === 1 ? 'Sending OTP...' : 'Verifying OTP...'}
                    </>
                  ) : (
                    otpStep === 1 ? 'Send Login OTP' : 'Verify & Sign In'
                  )}
                </button>

                {otpStep === 2 && (
                  <div className="otp-login-actions" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                    <button type="button" onClick={() => setOtpStep(1)} className="otp-back-btn" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer' }}>
                      ← Change Email
                    </button>
                    <button type="button" onClick={handleResendLoginOtp} className="otp-resend-btn" style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}>
                      Resend OTP
                    </button>
                  </div>
                )}
              </>
            )}
          </form>

          {/* Google OAuth Divider */}
          <div className="login-divider">
            <span>or</span>
          </div>

          {/* Google Sign In Button */}
          <div className="google-login-wrapper">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                try {
                  const data = await googleLogin(credentialResponse.credential);
                  if (data.needsRole) {
                    showToast(data.message || 'Please select your role.', 'info');
                    navigate('/select-role');
                  } else {
                    showToast(data.message || 'Logged in with Google!', 'success');
                    const role = data.user?.role;
                    navigate(role === 'client' ? '/dashboard/client' : '/dashboard/freelancer');
                  }
                } catch (err) {
                  showToast(err.response?.data?.message || 'Google login failed.', 'error');
                }
              }}
              onError={() => {
                showToast('Google login failed. Please try again.', 'error');
              }}
              text="continue_with"
              shape="rectangular"
              size="large"
              width="100%"
              theme="outline"
            />
          </div>

          <div className="login-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">Sign Up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
