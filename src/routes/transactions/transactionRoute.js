const express = require('express');
const router = express.Router();
const {
  getTransactionCategoriesController,
  transferController,
} = require('../../controllers/transactions/transactionController');
const { authenticate } = require('../../middlewares/authHandler');

router.get('/transaction-categories', authenticate, getTransactionCategoriesController);
router.post('/transfer', authenticate, transferController);

module.exports = router;
