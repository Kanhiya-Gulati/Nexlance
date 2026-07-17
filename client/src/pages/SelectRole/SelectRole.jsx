import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './SelectRole.css';

const SelectRole = () => {
  const { setRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole) {
      showToast('Please select a role to continue.', 'warning');
      return;
    }

    if (!password) {
      showToast('Please create a password for your account.', 'warning');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const data = await setRole(selectedRole, password);
      showToast(data.message || 'Registration completed successfully!', 'success');
      navigate(selectedRole === 'client' ? '/dashboard/client' : '/dashboard/freelancer');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to complete registration. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="select-role-page">
      <div className="select-role-card fade-in">
        <div className="select-role-header">
          <div className="select-role-logo">NEXLANCE</div>
          <h1 className="select-role-title">Choose Your Role</h1>
          <p className="select-role-subtitle">
            How do you want to use NEXLANCE? Choose a role and set a password to secure your account.
          </p>
        </div>

        <div className="select-role-options">
          <button
            type="button"
            className={`role-option ${selectedRole === 'client' ? 'selected' : ''}`}
            onClick={() => setSelectedRole('client')}
          >
            <div className="role-option-icon">💼</div>
            <div className="role-option-content">
              <h3 className="role-option-title">I'm a Client</h3>
              <p className="role-option-desc">I want to hire freelancers and post jobs for my projects.</p>
            </div>
            <div className="role-option-check">
              {selectedRole === 'client' && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </button>

          <button
            type="button"
            className={`role-option ${selectedRole === 'freelancer' ? 'selected' : ''}`}
            onClick={() => setSelectedRole('freelancer')}
          >
            <div className="role-option-icon">🚀</div>
            <div className="role-option-content">
              <h3 className="role-option-title">I'm a Freelancer</h3>
              <p className="role-option-desc">I want to find work, apply for jobs, and offer my skills.</p>
            </div>
            <div className="role-option-check">
              {selectedRole === 'freelancer' && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </button>
        </div>

        {/* Create Password section */}
        <div className="form-group" style={{ marginBottom: '28px' }}>
          <label htmlFor="password" className="form-label" style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.875rem' }}>
            Create Account Password
          </label>
          <div className="input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span className="input-icon" style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', pointerEvents: 'none', zIndex: 1 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 6 characters password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              style={{ width: '100%', height: '46px', paddingLeft: '48px', paddingRight: '44px', border: '1.5px solid var(--border)', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' }}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(prev => !prev)}
              tabIndex={-1}
              style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '4px', zIndex: 1 }}
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
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
            You can use this password to log in directly via email in the future.
          </span>
        </div>

        <button
          className="select-role-submit"
          onClick={handleContinue}
          disabled={!selectedRole || !password || loading}
        >
          {loading ? (
            <>
              <span className="select-role-spinner"></span>
              Setting up...
            </>
          ) : (
            `Continue as ${selectedRole === 'client' ? 'Client' : selectedRole === 'freelancer' ? 'Freelancer' : '...'}`
          )}
        </button>
      </div>
    </div>
  );
};

export default SelectRole;
