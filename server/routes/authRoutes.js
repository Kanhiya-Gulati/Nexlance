/**
 * @fileoverview Authentication Routes for NEXLANCE Freelance Marketplace
 *
 * Defines routes for user registration, login, email verification,
 * login via OTP, and password resetting.
 *
 * @module routes/authRoutes
 */

const express = require('express');
const router = express.Router();
const {
  register,
  verifyOtp,
  resendOtp,
  sendLoginOtp,
  loginOtp,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  googleAuth,
  setRole,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (sends verification OTP)
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify email using OTP
 * @access  Public
 */
router.post('/verify-otp', verifyOtp);

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend verification OTP
 * @access  Public
 */
router.post('/resend-otp', resendOtp);

/**
 * @route   POST /api/auth/send-login-otp
 * @desc    Send login OTP to Gmail
 * @access  Public
 */
router.post('/send-login-otp', sendLoginOtp);

/**
 * @route   POST /api/auth/login-otp
 * @desc    Login user using OTP
 * @access  Public
 */
router.post('/login-otp', loginOtp);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user using email/password
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send forgot password OTP to Gmail
 * @access  Public
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Verify OTP and update password
 * @access  Public
 */
router.post('/reset-password', resetPassword);

/**
 * @route   POST /api/auth/google
 * @desc    Authenticate or register user via Google OAuth
 * @access  Public
 */
router.post('/google', googleAuth);

/**
 * @route   POST /api/auth/set-role
 * @desc    Set role for first-time Google OAuth user
 * @access  Private
 */
router.post('/set-role', protect, setRole);

/**
 * @route   GET /api/auth/me
 * @desc    Get the currently logged-in user's profile
 * @access  Private (requires valid JWT)
 */
router.get('/me', protect, getMe);

module.exports = router;
