const express = require('express');
const router = express.Router();
const { getTransactionCategoriesController } = require('../controllers/transactionController');
const { authenticate } = require('../middlewares/authHandler');

router.get('/transaction-categories', authenticate, getTransactionCategoriesController);

module.exports = router;
