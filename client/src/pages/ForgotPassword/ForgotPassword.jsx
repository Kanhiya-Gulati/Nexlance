import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const { forgotPassword, resetPassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // 1 = enter email, 2 = verify OTP & reset password
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Please enter your email address.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const data = await forgotPassword(email);
      showToast(data.message || 'OTP sent successfully to your Gmail.', 'success');
      setStep(2);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send OTP. Please check your email.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      showToast('Please enter a valid 6-digit OTP code.', 'warning');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const data = await resetPassword(email, otp, newPassword);
      showToast(data.message || 'Password reset successful!', 'success');
      navigate('/login');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset password. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-card fade-in">
        <div className="forgot-header">
          <div className="forgot-logo">NEXLANCE</div>
          <h1 className="forgot-title">Reset Password</h1>
          <p className="forgot-subtitle">
            {step === 1
              ? 'Enter your email address to receive a 6-digit reset OTP.'
              : 'Enter the OTP sent to your Gmail and choose a new password.'}
          </p>
        </div>

        {step === 1 ? (
          <form className="forgot-form" onSubmit={handleSendOtp}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">✉️</span>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your Gmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="forgot-input"
                  required
                  style={{ paddingLeft: '48px', paddingRight: '44px' }}
                />
              </div>
            </div>

            <button type="submit" className="forgot-btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="forgot-spinner"></span>
                  Sending OTP...
                </>
              ) : (
                'Send Reset OTP'
              )}
            </button>
          </form>
        ) : (
          <form className="forgot-form" onSubmit={handleResetPassword}>
            <div className="form-group">
              <label htmlFor="otp" className="form-label">Enter 6-Digit OTP</label>
              <input
                id="otp"
                type="text"
                maxLength="6"
                placeholder="e.g. 123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="forgot-otp-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword" className="form-label">New Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="forgot-input"
                  required
                  style={{ paddingLeft: '48px', paddingRight: '44px' }}
                />
                <button
                  type="button"
                  className="forgot-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="forgot-input"
                  required
                  style={{ paddingLeft: '48px', paddingRight: '44px' }}
                />
              </div>
            </div>

            <button type="submit" className="forgot-btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="forgot-spinner"></span>
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
            
            <button type="button" className="forgot-back-step" onClick={() => setStep(1)}>
              ← Back to enter email
            </button>
          </form>
        )}

        <div className="forgot-footer">
          <Link to="/login" className="forgot-back-link">Back to Log In</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
