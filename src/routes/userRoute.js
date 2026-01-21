const express = require('express');
const router = express.Router();
const {
  getUserDetails,
  getBanksController,
  resolveAccountNumberController,
  getMyBankDetailsController,
  getMyWalletDetailsController,
} = require('../controllers/userController');
const { authenticate } = require('../middlewares/authHandler');

router.get('/me', authenticate, getUserDetails);
router.get('/banks', authenticate, getBanksController);
router.get('/resolve-account', authenticate, resolveAccountNumberController);
router.get('/my-bank-details', authenticate, getMyBankDetailsController);
router.get('/my-wallet-details', authenticate, getMyWalletDetailsController);
module.exports = router;
