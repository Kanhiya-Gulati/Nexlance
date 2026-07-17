import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

/**
 * AuthContext
 * Provides authentication state (user, token, loading) and methods
 * (login, register, logout, googleLogin, setRole) to the entire application.
 */
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // On mount, validate the stored token by calling /api/auth/me
  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('token');

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        setUser(res.data.user || res.data);
        setToken(storedToken);
      } catch (err) {
        // Token is invalid or expired — clear it
        console.error('Auth validation failed:', err.message);
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  /**
   * login - Authenticate a user with email and password.
   */
  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const data = res.data;
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user || data);
    return data;
  };

  /**
   * register - Create a new user account (sends verification OTP).
   */
  const register = async (payload) => {
    const res = await axios.post('/api/auth/register', payload);
    return res.data;
  };

  /**
   * verifyOtp - Verify registration OTP and log in.
   */
  const verifyOtp = async (email, otp) => {
    const res = await axios.post('/api/auth/verify-otp', { email, otp });
    const data = res.data;
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user || data);
    return data;
  };

  /**
   * resendOtp - Resend verification OTP.
   */
  const resendOtp = async (email) => {
    const res = await axios.post('/api/auth/resend-otp', { email });
    return res.data;
  };

  /**
   * sendLoginOtp - Send OTP code for login.
   */
  const sendLoginOtp = async (email) => {
    const res = await axios.post('/api/auth/send-login-otp', { email });
    return res.data;
  };

  /**
   * loginOtp - Verify login OTP and log in.
   */
  const loginOtp = async (email, otp) => {
    const res = await axios.post('/api/auth/login-otp', { email, otp });
    const data = res.data;
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user || data);
    return data;
  };

  /**
   * forgotPassword - Send OTP code to reset password.
   */
  const forgotPassword = async (email) => {
    const res = await axios.post('/api/auth/forgot-password', { email });
    return res.data;
  };

  /**
   * resetPassword - Verify OTP and update password.
   */
  const resetPassword = async (email, otp, newPassword) => {
    const res = await axios.post('/api/auth/reset-password', { email, otp, newPassword });
    return res.data;
  };

  /**
   * googleLogin - Authenticate or register via Google OAuth.
   * Sends Google credential (ID token) to backend.
   * Returns data with needsRole flag if first-time Google user.
   */
  const googleLogin = async (credential) => {
    const res = await axios.post('/api/auth/google', { credential });
    const data = res.data;

    // Store the token (even temporarily for role selection)
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
    }

    // Only set full user if role is already assigned
    if (!data.needsRole && data.user) {
      setUser(data.user);
    }

    return data;
  };

  /**
   * setRole - Set role for first-time Google OAuth user.
   * After role is set, updates user state and completes login.
   */
  const setRole = async (role, password) => {
    const storedToken = localStorage.getItem('token');
    const res = await axios.post('/api/auth/set-role', { role, password }, {
      headers: { Authorization: `Bearer ${storedToken}` },
    });
    const data = res.data;

    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
    }
    if (data.user) {
      setUser(data.user);
    }

    return data;
  };

  /**
   * logout - Clear authentication state and redirect.
   */
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  /**
   * updateUser - Update the user object in state (e.g., after profile edit).
   */
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    verifyOtp,
    resendOtp,
    sendLoginOtp,
    loginOtp,
    forgotPassword,
    resetPassword,
    googleLogin,
    setRole,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth - Custom hook to access authentication context.
 * Must be used within an AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
