const express = require('express');
const router = express.Router();
const {
  getTransactionCategoriesController,
  transferController,
  getTransactionsController
} = require('../../controllers/transactions/transactionController');
const { authenticate } = require('../../middlewares/authHandler');

router.use(authenticate);

router.get('/transaction-categories', getTransactionCategoriesController);
router.post('/transfer', transferController);
router.get('/transactions', getTransactionsController);

module.exports = router;
