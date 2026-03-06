const express = require('express');
const router = express.Router();
const {
  loginController,
  registerController,
  verifyAccountController,
  resendOTPController,
  logoutController,
} = require('../controllers/authController');
const { authenticate } = require('../middlewares/authHandler');

router.post('/login', loginController);
router.post('/register', registerController);
router.patch('/verify-account', verifyAccountController);
router.patch('/resend-otp/:action', resendOTPController);
router.post('/logout', authenticate, logoutController);

module.exports = router;
