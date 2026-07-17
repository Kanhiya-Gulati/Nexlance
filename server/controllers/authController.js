const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { validateEmail, validatePassword, validateRequired } = require('../utils/validators');
const { OAuth2Client } = require('google-auth-library');

/**
 * Generate JWT Token
 * @param {string} id - User ID to encode in token
 * @returns {string} Signed JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

/**
 * Generate a 6-digit numeric OTP
 * @returns {string} 6-digit OTP code
 */
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * @desc    Register a new user (sends OTP for email verification)
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, skills } = req.body;

    // Validate required fields
    const missing = validateRequired([
      { value: name, name: 'name' },
      { value: email, name: 'email' },
      { value: password, name: 'password' },
      { value: role, name: 'role' },
    ]);

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`,
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Validate password strength
    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Validate role
    if (!['client', 'freelancer'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either client or freelancer',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists',
        });
      } else {
        // If the account exists but is NOT verified, update the registration details and send new OTP
        const otp = generateOtp();
        const otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

        existingUser.name = name;
        existingUser.password = password; // triggers Mongoose pre-save hash hook
        existingUser.role = role;
        existingUser.skills = skills || [];
        existingUser.otp = otp;
        existingUser.otpExpire = otpExpire;
        await existingUser.save();

        // Send verification email in background to prevent blocking HTTP response
        sendEmail({
          to: existingUser.email,
          subject: 'NEXLANCE - Verify Your Email',
          html: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 40px 20px;">
  <div style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
    <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Nexlance</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Freelance Marketplace</p>
    </div>
    <div style="padding: 40px 32px;">
      <h2 style="color: #1e293b; margin: 0 0 8px; font-size: 22px;">Verify Your Email</h2>
      <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">Welcome back to Nexlance! 🎉 Please use the verification code below to complete your registration.</p>
      <div style="background: linear-gradient(135deg, #f0f0ff 0%, #f5f3ff 100%); border: 2px dashed #4f46e5; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
        <p style="color: #64748b; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
        <h1 style="color: #4f46e5; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: 800;">${otp}</h1>
      </div>
      <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0 0 24px;">⌛ This code expires in <strong>10 minutes</strong></p>
      <div style="background: #fef3c7; border-radius: 8px; padding: 12px 16px; margin: 0 0 8px;">
        <p style="color: #92400e; font-size: 13px; margin: 0;">🔒 If you didn’t request this code, please ignore this email. Your account is safe.</p>
      </div>
    </div>
    <div style="background: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2024 Nexlance. All rights reserved.</p>
    </div>
  </div>
</div>`,
        }).catch((emailError) => {
          console.error('Failed to send verification email in background:', emailError.message);
        });

        return res.status(201).json({
          success: true,
          message: 'OTP sent to email. Please verify to complete your signup.',
          email: existingUser.email,
        });
      }
    }

    // Generate OTP
    const otp = generateOtp();
    const otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Create user (isEmailVerified defaults to false now)
    const user = await User.create({
      name,
      email,
      password,
      role,
      skills: skills || [],
      isEmailVerified: false,
      otp,
      otpExpire,
    });

    // Send verification email in background to prevent blocking HTTP response
    sendEmail({
      to: user.email,
      subject: 'NEXLANCE - Verify Your Email',
      html: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 40px 20px;">
  <div style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
    <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Nexlance</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Freelance Marketplace</p>
    </div>
    <div style="padding: 40px 32px;">
      <h2 style="color: #1e293b; margin: 0 0 8px; font-size: 22px;">Verify Your Email</h2>
      <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">Welcome to Nexlance! 🎉 We’re excited to have you on board. Please use the verification code below to complete your registration.</p>
      <div style="background: linear-gradient(135deg, #f0f0ff 0%, #f5f3ff 100%); border: 2px dashed #4f46e5; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
        <p style="color: #64748b; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
        <h1 style="color: #4f46e5; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: 800;">${otp}</h1>
      </div>
      <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0 0 24px;">⌛ This code expires in <strong>10 minutes</strong></p>
      <div style="background: #fef3c7; border-radius: 8px; padding: 12px 16px; margin: 0 0 8px;">
        <p style="color: #92400e; font-size: 13px; margin: 0;">🔒 If you didn’t request this code, please ignore this email. Your account is safe.</p>
      </div>
    </div>
    <div style="background: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2024 Nexlance. All rights reserved.</p>
    </div>
  </div>
</div>`,
    }).catch((emailError) => {
      console.error('Failed to send verification email in background:', emailError.message);
    });

    res.status(201).json({
      success: true,
      message: 'OTP sent to email. Please verify to complete your signup.',
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify OTP for email verification (Registration complete)
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify OTP and check expiration
    if (!user.otp || user.otp !== otp.toString() || user.otpExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    // Verify email and clear OTP
    user.isEmailVerified = true;
    user.otp = null;
    user.otpExpire = null;
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Return user details without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      token,
      user: userResponse,
      message: 'Email verified successfully!',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend registration email verification OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email address',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate new OTP
    const otp = generateOtp();
    const otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.otp = otp;
    user.otpExpire = otpExpire;
    await user.save();

    // Send email in background to prevent blocking HTTP response
    sendEmail({
      to: user.email,
      subject: 'NEXLANCE - Verification OTP',
      html: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 40px 20px;">
  <div style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
    <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Nexlance</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Freelance Marketplace</p>
    </div>
    <div style="padding: 40px 32px;">
      <h2 style="color: #1e293b; margin: 0 0 8px; font-size: 22px;">New Verification Code</h2>
      <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">You requested a new verification code. Use the code below to verify your email address.</p>
      <div style="background: linear-gradient(135deg, #f0f0ff 0%, #f5f3ff 100%); border: 2px dashed #4f46e5; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
        <p style="color: #64748b; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
        <h1 style="color: #4f46e5; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: 800;">${otp}</h1>
      </div>
      <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0 0 24px;">⌛ This code expires in <strong>10 minutes</strong></p>
      <div style="background: #fef3c7; border-radius: 8px; padding: 12px 16px; margin: 0 0 8px;">
        <p style="color: #92400e; font-size: 13px; margin: 0;">🔒 If you didn’t request this code, please ignore this email. Your account is safe.</p>
      </div>
    </div>
    <div style="background: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2024 Nexlance. All rights reserved.</p>
    </div>
  </div>
</div>`,
    }).catch((emailError) => {
      console.error('Failed to resend verification email in background:', emailError.message);
    });

    res.status(200).json({
      success: true,
      message: 'New OTP sent to your email successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send OTP to Gmail for OTP-based Login
 * @route   POST /api/auth/send-login-otp
 * @access  Public
 */
const sendLoginOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email address',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email. Please sign up first.',
      });
    }

    // Generate OTP
    const otp = generateOtp();
    const otpExpire = Date.now() + 10 * 60 * 1000;

    user.otp = otp;
    user.otpExpire = otpExpire;
    await user.save();

    // Send email in background to prevent blocking HTTP response
    sendEmail({
      to: user.email,
      subject: 'NEXLANCE - Login OTP',
      html: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 40px 20px;">
  <div style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
    <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Nexlance</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Freelance Marketplace</p>
    </div>
    <div style="padding: 40px 32px;">
      <h2 style="color: #1e293b; margin: 0 0 8px; font-size: 22px;">Login Verification</h2>
      <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">A sign-in attempt was detected on your Nexlance account. Use the code below to complete your login.</p>
      <div style="background: linear-gradient(135deg, #f0f0ff 0%, #f5f3ff 100%); border: 2px dashed #4f46e5; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
        <p style="color: #64748b; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
        <h1 style="color: #4f46e5; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: 800;">${otp}</h1>
      </div>
      <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0 0 24px;">⌛ This code expires in <strong>10 minutes</strong></p>
      <div style="background: #fef3c7; border-radius: 8px; padding: 12px 16px; margin: 0 0 8px;">
        <p style="color: #92400e; font-size: 13px; margin: 0;">🔒 If you didn’t request this code, please ignore this email. Your account is safe.</p>
      </div>
    </div>
    <div style="background: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2024 Nexlance. All rights reserved.</p>
    </div>
  </div>
</div>`,
    }).catch((emailError) => {
      console.error('Failed to send login OTP email in background:', emailError.message);
    });

    res.status(200).json({
      success: true,
      message: 'Login OTP sent to your email successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user using OTP
 * @route   POST /api/auth/login-otp
 * @access  Public
 */
const loginOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify OTP and check expiration
    if (!user.otp || user.otp !== otp.toString() || user.otpExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    // Log in user, mark email as verified (since they received the OTP), clear OTP fields
    user.isEmailVerified = true;
    user.otp = null;
    user.otpExpire = null;
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Return user details without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      token,
      user: userResponse,
      message: 'Logged in successfully!',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user using Email and Password
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user and explicitly include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // If email is not verified, restrict login and request OTP verification
    if (!user.isEmailVerified) {
      // Re-trigger verification OTP
      const otp = generateOtp();
      user.otp = otp;
      user.otpExpire = Date.now() + 10 * 60 * 1000;
      await user.save();

      // Send email in background to prevent blocking HTTP response
      sendEmail({
        to: user.email,
        subject: 'NEXLANCE - Verify Your Email',
        html: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 40px 20px;">
  <div style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
    <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Nexlance</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Freelance Marketplace</p>
    </div>
    <div style="padding: 40px 32px;">
      <h2 style="color: #1e293b; margin: 0 0 8px; font-size: 22px;">Verify Your Email</h2>
      <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">Please verify your email address to log in to your Nexlance account. Use the code below to complete verification.</p>
      <div style="background: linear-gradient(135deg, #f0f0ff 0%, #f5f3ff 100%); border: 2px dashed #4f46e5; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
        <p style="color: #64748b; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
        <h1 style="color: #4f46e5; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: 800;">${otp}</h1>
      </div>
      <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0 0 24px;">⌛ This code expires in <strong>10 minutes</strong></p>
      <div style="background: #fef3c7; border-radius: 8px; padding: 12px 16px; margin: 0 0 8px;">
        <p style="color: #92400e; font-size: 13px; margin: 0;">🔒 If you didn’t request this code, please ignore this email. Your account is safe.</p>
      </div>
    </div>
    <div style="background: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2024 Nexlance. All rights reserved.</p>
    </div>
  </div>
</div>`,
      }).catch((err) => {
        console.error('Failed to send verification email from login in background:', err.message);
      });

      return res.status(403).json({
        success: false,
        needsVerification: true,
        email: user.email,
        message: 'Please verify your email address first. Verification OTP has been sent.',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user data without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      token,
      user: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Forgot Password - Send OTP to Gmail
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address',
      });
    }

    // Generate OTP
    const otp = generateOtp();
    const otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.otp = otp;
    user.otpExpire = otpExpire;
    await user.save();

    // Send email in background to prevent blocking HTTP response
    sendEmail({
      to: user.email,
      subject: 'NEXLANCE - Reset Password OTP',
      html: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 40px 20px;">
  <div style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
    <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Nexlance</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Freelance Marketplace</p>
    </div>
    <div style="padding: 40px 32px;">
      <h2 style="color: #1e293b; margin: 0 0 8px; font-size: 22px;">Reset Your Password</h2>
      <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">We received a request to reset the password for your Nexlance account. Use the code below to set a new password.</p>
      <div style="background: linear-gradient(135deg, #f0f0ff 0%, #f5f3ff 100%); border: 2px dashed #4f46e5; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
        <p style="color: #64748b; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
        <h1 style="color: #4f46e5; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: 800;">${otp}</h1>
      </div>
      <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0 0 24px;">⌛ This code expires in <strong>10 minutes</strong></p>
      <div style="background: #fef3c7; border-radius: 8px; padding: 12px 16px; margin: 0 0 8px;">
        <p style="color: #92400e; font-size: 13px; margin: 0;">🔒 If you didn’t request this code, please ignore this email. Your account is safe.</p>
      </div>
    </div>
    <div style="background: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2024 Nexlance. All rights reserved.</p>
    </div>
  </div>
</div>`,
    }).catch((emailError) => {
      console.error('Failed to send reset password email in background:', emailError.message);
    });

    res.status(200).json({
      success: true,
      message: 'Reset password OTP sent to your email successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset Password using OTP
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, OTP, and new password',
      });
    }

    // Validate password strength
    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify OTP and check expiration
    if (!user.otp || user.otp !== otp.toString() || user.otpExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    // Update password, clear OTP, mark email as verified
    user.password = newPassword;
    user.otp = null;
    user.otpExpire = null;
    user.isEmailVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user via Google OAuth (Login or Sign Up)
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential token is required',
      });
    }

    // Verify the Google ID token
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token. Please try again.',
      });
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Google account does not have an email address.',
      });
    }

    // Check if a user already exists with this email or Google ID
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Existing user — link Google ID if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
      }
      // Update avatar if user doesn't have one
      if (!user.avatar && picture) {
        user.avatar = picture;
      }
      user.isEmailVerified = true;
      await user.save();

      // If user has no role yet, ask them to select
      if (!user.role) {
        const tempToken = generateToken(user._id);
        return res.status(200).json({
          success: true,
          needsRole: true,
          token: tempToken,
          user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar },
          message: 'Please select your role to continue.',
        });
      }

      // Generate JWT and return
      const token = generateToken(user._id);
      const userResponse = user.toObject();
      delete userResponse.password;

      return res.status(200).json({
        success: true,
        token,
        user: userResponse,
        message: 'Logged in with Google successfully!',
      });
    }

    // New user — create account without password, without role
    user = await User.create({
      name,
      email,
      googleId,
      authProvider: 'google',
      avatar: picture || '',
      isEmailVerified: true,
    });

    // New user needs to pick a role
    const tempToken = generateToken(user._id);
    return res.status(201).json({
      success: true,
      needsRole: true,
      token: tempToken,
      user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar },
      message: 'Account created! Please select your role to continue.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Set role for a Google OAuth user (first-time only)
 * @route   POST /api/auth/set-role
 * @access  Private
 */
const setRole = async (req, res, next) => {
  try {
    const { role, password } = req.body;

    if (!role || !['client', 'freelancer'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either client or freelancer',
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to complete your registration',
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Only allow setting role if it hasn't been set yet
    if (user.role) {
      return res.status(400).json({
        success: false,
        message: 'Role has already been set and cannot be changed.',
      });
    }

    user.role = role;
    user.password = password; // modified password will trigger hashing in pre-save hook
    await user.save();

    const token = generateToken(user._id);
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      token,
      user: userResponse,
      message: `Account setup complete! Welcome to Nexlance.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
