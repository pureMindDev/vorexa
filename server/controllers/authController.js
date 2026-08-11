const bcrypt = require('bcryptjs');
const User = require('../models/User');
const TutorProfile = require('../models/TutorProfile');
const { generateJWT, generateRandomToken, generateVerificationCode } = require('../utils/generateToken');
const { sendVerificationEmail, sendPasswordResetEmail, sendTwoFactorCode } = require('../services/emailService');
const { recordLogin } = require('../services/loginHistoryService');

// @desc    Register a new user
// @route   POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    // Only these are self-serve via the public register form — tutor has its own
    // registration flow (creates a TutorProfile too), and admin is never self-assigned.
    const requestedRole = ['parent', 'centre'].includes(role) ? role : 'student';

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: requestedRole,
      verificationCode,
      verificationCodeExpires,
    });

    try {
      await sendVerificationEmail(user.email, user.name, verificationCode);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError.message);
      // Don't block registration if email fails — user can request a resend
    }

    res.status(201).json({
      message: 'Account created. Please check your email to verify your account.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new tutor account — creates the User (role: tutor) and their TutorProfile together
// @route   POST /api/auth/register-tutor
const registerTutor = async (req, res, next) => {
  try {
    const { name, email, password, bio, subjects, hourlyRate, yearsExperience, sessionType } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ message: 'Select at least one subject you can teach' });
    }
    if (hourlyRate === undefined || hourlyRate < 0) {
      return res.status(400).json({ message: 'A valid hourly rate is required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = Date.now() + 15 * 60 * 1000;

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'tutor',
      verificationCode,
      verificationCodeExpires,
    });

    await TutorProfile.create({
      userId: user._id,
      bio: bio || '',
      subjects,
      hourlyRate,
      yearsExperience: yearsExperience || 0,
      sessionType: sessionType || 'online',
    });

    try {
      await sendVerificationEmail(user.email, user.name, verificationCode);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError.message);
    }

    res.status(201).json({
      message: 'Tutor account created. Please check your email to verify your account.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email with a 6-digit code
// @route   POST /api/auth/verify-email
const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      verificationCode: code,
      verificationCodeExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'That code is invalid or has expired' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'This account is already verified' });
    }

    const verificationCode = generateVerificationCode();
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    await sendVerificationEmail(user.email, user.name, verificationCode);

    res.json({ message: 'Verification code sent' });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.status === 'banned') {
      return res.status(403).json({ message: 'This account has been banned. Contact support if you believe this is a mistake.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'This account is suspended. Contact support for help.' });
    }

    if (user.twoFactorEnabled) {
      const code = generateVerificationCode();
      user.twoFactorCode = code;
      user.twoFactorCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save();

      try {
        await sendTwoFactorCode(user.email, user.name, code);
      } catch (emailError) {
        console.error('Failed to send 2FA code:', emailError.message);
        return res.status(500).json({ message: 'Could not send your login code. Please try again.' });
      }

      return res.json({ requires2FA: true, userId: user._id });
    }

    const token = generateJWT(user._id);
    await recordLogin(user._id, req);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isVerified: user.isVerified,
        onboardingCompleted: user.onboardingCompleted,
        xp: user.xp,
        streakCount: user.streakCount,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify the 2FA code and complete login
// @route   POST /api/auth/verify-2fa
const verifyTwoFactor = async (req, res, next) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ message: 'userId and code are required' });
    }

    const user = await User.findOne({
      _id: userId,
      twoFactorCode: code,
      twoFactorCodeExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'That code is invalid or has expired' });
    }

    user.twoFactorCode = undefined;
    user.twoFactorCodeExpires = undefined;
    await user.save();

    const token = generateJWT(user._id);
    await recordLogin(user._id, req);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isVerified: user.isVerified,
        onboardingCompleted: user.onboardingCompleted,
        xp: user.xp,
        streakCount: user.streakCount,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });

    // Always return success even if user not found, to avoid leaking which emails are registered
    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been sent' });
    }

    const resetToken = generateRandomToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError.message);
    }

    res.json({ message: 'If that email exists, a reset link has been sent' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = {
  register,
  registerTutor,
  verifyEmail,
  resendVerification,
  login,
  verifyTwoFactor,
  forgotPassword,
  resetPassword,
  getMe,
};
