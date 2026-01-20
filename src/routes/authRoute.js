const express = require('express');
const router = express.Router();
const {
  loginController,
  registerController,
  verifyAccountController,
  resendOTPController,
} = require('../controllers/authController');

router.post('/login', loginController);
router.post('/register', registerController);
router.patch('/verify-account', verifyAccountController);
router.patch('/resend-otp/:action', resendOTPController);

module.exports = router;
