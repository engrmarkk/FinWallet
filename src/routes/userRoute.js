const express = require('express');
const router = express.Router();
const {
  getUserDetails,
  getBanksController,
  resolveAccountNumberController,
  getMyBankDetailsController,
  getMyWalletDetailsController,
  setTransactionPinController,
  changeTransactionPinController
} = require('../controllers/userController');
const { authenticate } = require('../middlewares/authHandler');

router.get('/me', authenticate, getUserDetails);
router.get('/banks', authenticate, getBanksController);
router.get('/resolve-account', authenticate, resolveAccountNumberController);
router.get('/my-bank-details', authenticate, getMyBankDetailsController);
router.get('/my-wallet-details', authenticate, getMyWalletDetailsController);
router.patch('/set-transaction-pin', authenticate, setTransactionPinController);
router.patch('/change-transaction-pin', authenticate, changeTransactionPinController);
module.exports = router;
