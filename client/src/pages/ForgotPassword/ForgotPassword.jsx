import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Please enter your email address.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const data = await forgotPassword(email.trim());
      showToast(data.message || 'Password reset link sent to your email!', 'success');
      setSubmitted(true);
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to send reset link.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-card fade-in">
        <div className="forgot-header">
          <Link to="/" className="forgot-logo-link">
            <div className="forgot-logo">NEXLANCE</div>
          </Link>
          <h1 className="forgot-title">Reset Password</h1>
          <p className="forgot-subtitle">
            {!submitted
              ? 'Enter your email address and we will send you a link to reset your password.'
              : `We've sent a password reset link to ${email}`}
          </p>
        </div>

        {!submitted ? (
          <form className="forgot-form" onSubmit={handleSendResetEmail} noValidate>
            <div className="form-group">
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
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="forgot-input"
                  required
                  style={{ paddingLeft: '48px', paddingRight: '16px' }}
                />
              </div>
            </div>

            <button type="submit" className="forgot-btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="forgot-spinner"></span>
                  Sending Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        ) : (
          <div className="forgot-success-state">
            <div className="success-icon-badge">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <p className="success-message">
              Check your inbox and click the reset link to choose a new password.
            </p>
            <div className="success-actions">
              <button
                type="button"
                className="forgot-btn-resend"
                onClick={handleSendResetEmail}
                disabled={loading}
              >
                {loading ? 'Resending...' : 'Resend Link'}
              </button>
            </div>
          </div>
        )}

        <div className="forgot-footer">
          <Link to="/login" className="forgot-back-link">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
