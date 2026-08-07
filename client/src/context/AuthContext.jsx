import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../services/api';

/**
 * AuthContext
 * Provides Firebase authentication state (user, token, loading) and methods
 * (login, register, logout, googleLogin, firebaseGoogleLogin, setRole, forgotPassword) to the entire application.
 */
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // On mount, validate the stored token by calling /auth/me
  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('token');

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user || res.data);
        setToken(storedToken);
      } catch (err) {
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
   * login - Authenticate a user with Firebase Email and Password.
   */
  const login = async (email, password) => {
    let firebaseUid = null;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      firebaseUid = userCredential.user.uid;
    } catch (fbError) {
      console.warn('Firebase signIn notice:', fbError.message);
      if (fbError.code === 'auth/wrong-password' || fbError.code === 'auth/user-not-found' || fbError.code === 'auth/invalid-credential') {
        throw new Error(fbError.message || 'Invalid email or password');
      }
    }

    // Sync with backend API
    try {
      const res = firebaseUid
        ? await api.post('/auth/firebase', { email, firebaseUid })
        : await api.post('/auth/login', { email, password });

      const data = res.data;
      if (data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
      }
      if (data.user) {
        setUser(data.user);
      }
      return data;
    } catch (err) {
      // Direct login fallback if firebase endpoint fails
      const fallbackRes = await api.post('/auth/login', { email, password });
      const data = fallbackRes.data;
      if (data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
      }
      if (data.user) {
        setUser(data.user);
      }
      return data;
    }
  };

  /**
   * register - Create a new user account with Firebase Email and Password.
   */
  const register = async (payload) => {
    let firebaseUid = null;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
      firebaseUid = userCredential.user.uid;
    } catch (fbError) {
      console.warn('Firebase createUser notice:', fbError.message);
      if (fbError.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists.');
      }
      if (fbError.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters.');
      }
    }

    // Sync with MongoDB backend
    const syncData = {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      skills: payload.skills || [],
      firebaseUid: firebaseUid || `fb_${Date.now()}`,
    };

    const res = await api.post('/auth/firebase', syncData);
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
   * firebaseGoogleLogin - Authenticate using Firebase Google OAuth popup.
   */
  const firebaseGoogleLogin = async (role = null) => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;

    const res = await api.post('/auth/firebase', {
      email: fbUser.email,
      name: fbUser.displayName || fbUser.email.split('@')[0],
      firebaseUid: fbUser.uid,
      role: role,
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
   * verifyOtp - Verify registration OTP (legacy support).
   */
  const verifyOtp = async (email, otp) => {
    const res = await api.post('/auth/verify-otp', { email, otp });
    const data = res.data;
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user || data);
    return data;
  };

  /**
   * resendOtp - Resend verification OTP (legacy support).
   */
  const resendOtp = async (email) => {
    const res = await api.post('/auth/resend-otp', { email });
    return res.data;
  };

  /**
   * sendLoginOtp - Send OTP code for login (legacy support).
   */
  const sendLoginOtp = async (email) => {
    const res = await api.post('/auth/send-login-otp', { email });
    return res.data;
  };

  /**
   * loginOtp - Verify login OTP and log in (legacy support).
   */
  const loginOtp = async (email, otp) => {
    const res = await api.post('/auth/login-otp', { email, otp });
    const data = res.data;
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user || data);
    return data;
  };

  /**
   * forgotPassword - Send Firebase password reset email.
   */
  const forgotPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset link sent to your email via Firebase!' };
    } catch (fbError) {
      console.warn('Firebase sendPasswordResetEmail notice:', fbError.message);
      const res = await api.post('/auth/forgot-password', { email });
      return res.data;
    }
  };

  /**
   * resetPassword - Update password using OTP (legacy support).
   */
  const resetPassword = async (email, otp, newPassword) => {
    const res = await api.post('/auth/reset-password', { email, otp, newPassword });
    return res.data;
  };

  /**
   * googleLogin - Authenticate or register via Google OAuth credential.
   */
  const googleLogin = async (credential) => {
    const res = await api.post('/auth/google', { credential });
    const data = res.data;

    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
    }

    if (!data.needsRole && data.user) {
      setUser(data.user);
    }

    return data;
  };

  /**
   * setRole - Set role for first-time Google OAuth user.
   */
  const setRole = async (role, password) => {
    const res = await api.post('/auth/set-role', { role, password });
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
   * logout - Clear Firebase session, stored tokens and state.
   */
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Firebase signOut error:', err.message);
    }
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  /**
   * updateUser - Update the user object in state.
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
    firebaseGoogleLogin,
    setRole,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
