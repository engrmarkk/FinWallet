const express = require('express');
const router = express.Router();
const { createTransactionCategoryController } = require('../controllers/transactionController');
const { topUpController } = require('../controllers/transactionController');

router.post('/transaction-category', createTransactionCategoryController);
router.post('/top-up', topUpController);

module.exports = router;
