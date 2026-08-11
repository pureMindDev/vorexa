const express = require('express');
const router = express.Router();
const {
  register,
  registerTutor,
  verifyEmail,
  resendVerification,
  login,
  verifyTwoFactor,
  forgotPassword,
  resetPassword,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/register-tutor', registerTutor);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/login', login);
router.post('/verify-2fa', verifyTwoFactor);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
