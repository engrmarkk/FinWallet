const express = require('express');
const router = express.Router();
const {
  createTransactionCategoryController,
} = require('../controllers/transactions/transactionController');
const { topUpController } = require('../controllers/transactions/transactionController');

router.post('/transaction-category', createTransactionCategoryController);
router.post('/top-up', topUpController);

module.exports = router;
