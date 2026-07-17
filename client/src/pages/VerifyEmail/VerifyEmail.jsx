import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './VerifyEmail.css';

const VerifyEmail = () => {
  const { verifyOtp, resendOtp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from router state, query params, or localStorage
  const stateEmail = location.state?.email;
  const queryEmail = new URLSearchParams(location.search).get('email');
  const initialEmail = stateEmail || queryEmail || localStorage.getItem('verify_email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);

  // Resend countdown timer
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      showToast('Email address is missing.', 'error');
      return;
    }
    if (otp.length !== 6 || isNaN(otp)) {
      showToast('Please enter a valid 6-digit OTP code.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const data = await verifyOtp(email, otp);
      showToast(data.message || 'Email verified successfully!', 'success');
      localStorage.removeItem('verify_email');
      
      // Redirect to correct dashboard
      const role = data.user?.role || data.role;
      navigate(role === 'client' ? '/dashboard/client' : '/dashboard/freelancer');
    } catch (err) {
      showToast(err.response?.data?.message || 'Verification failed. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      showToast('Email address is missing.', 'error');
      return;
    }

    setResending(true);
    try {
      const data = await resendOtp(email);
      showToast(data.message || 'Verification OTP resent to your Gmail.', 'success');
      setTimer(60);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to resend OTP.', 'error');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="verify-page">
      <div className="verify-card fade-in">
        <div className="verify-header">
          <div className="verify-logo">NEXLANCE</div>
          <h1 className="verify-title">Verify Your Gmail</h1>
          <p className="verify-subtitle">
            We have sent a 6-digit OTP code to <strong style={{ color: 'var(--text-primary)' }}>{email || 'your email'}</strong>.
          </p>
        </div>

        {!email ? (
          <div className="verify-form-error">
            <p>Missing email address. Please go back to sign up or log in.</p>
            <Link to="/register" className="verify-btn-link">Go to Sign Up</Link>
          </div>
        ) : (
          <form className="verify-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="otp" className="form-label">Enter 6-Digit OTP</label>
              <input
                id="otp"
                type="text"
                maxLength="6"
                placeholder="e.g. 123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="verify-input"
                autoComplete="one-time-code"
                autoFocus
              />
            </div>

            <button type="submit" className="verify-btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="verify-spinner"></span>
                  Verifying...
                </>
              ) : (
                'Verify & Log In'
              )}
            </button>

            <div className="verify-resend-row">
              <p>Didn't receive the OTP?</p>
              {timer > 0 ? (
                <span className="verify-timer-text">Resend in {timer}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="verify-resend-btn"
                >
                  {resending ? 'Resending...' : 'Resend OTP'}
                </button>
              )}
            </div>
          </form>
        )}

        <div className="verify-footer">
          <Link to="/login" className="verify-back-link">Back to Log In</Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
