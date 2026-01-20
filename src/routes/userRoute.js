const express = require('express');
const router = express.Router();
const { getUserDetails } = require('../controllers/userController');
const { authenticate } = require('../middlewares/authHandler');

router.get('/me', authenticate, getUserDetails);

module.exports = router;
