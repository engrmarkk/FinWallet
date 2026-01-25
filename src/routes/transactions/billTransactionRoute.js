const express = require('express');
const router = express.Router();
const {
  getServicesController,
  getVariationsController,
  verifyMeterAndSmartcardNumberController,
  purchaseBillController,
} = require('../../controllers/transactions/billTransactionController');
const { authenticate } = require('../../middlewares/authHandler');

router.get('/services/:service', authenticate, getServicesController);
router.get('/variations/:serviceID', authenticate, getVariationsController);
router.post('/verify-meter-smartcard', authenticate, verifyMeterAndSmartcardNumberController);
router.post('/purchase-bill', authenticate, purchaseBillController);
module.exports = router;
