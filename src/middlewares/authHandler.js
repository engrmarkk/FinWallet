const jwt = require('jsonwebtoken');
const { User } = require('../models/userModel');
const { apiResponse } = require('../utils/apiResponse');
const HttpStatusCodes = require('../utils/statusCodes');
const Logger = require('../utils/logger');
const StatusResponse = require('../utils/statusResponse');
const { connection } = require('../config/redis.js');

const logger = new Logger();

const authenticate = async (req, res, next) => {
  try {
    logger.info('Authenticating user...');
    let token = req.header('Authorization') || '';
    const userAgent = req.headers['user-agent'] || 'unknown';
    if (token.startsWith('Bearer ')) token = token.slice(7);

    if (!token) {
      return apiResponse(
        res,
        'Authentication required.',
        HttpStatusCodes.UNAUTHORIZED,
        StatusResponse.FAILED
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const tokenUserAgent = decoded.userAgent || 'unknown';
    const jti = decoded.jti;
    logger.info(`Authenticating user with ID: ${decoded.id} and User-Agent: ${tokenUserAgent}`);

    // check if the token's jti is in the blacklist (for logout)
    const isBlacklisted = await connection.get(`blacklist_${jti}`);
    if (isBlacklisted) {
      logger.info(
        `Token has been revoked. Please log in again. JTI: ${jti}, isBlacklisted: ${isBlacklisted}`
      );
      return apiResponse(
        res,
        'Token has been revoked. Please log in again.',
        HttpStatusCodes.UNAUTHORIZED,
        StatusResponse.FAILED
      );
    }

    if (tokenUserAgent !== userAgent) {
      logger.info(
        `Token is not valid for this device. Expected User-Agent: ${tokenUserAgent}, Received User-Agent: ${userAgent}`
      );
      return apiResponse(
        res,
        'Token is not valid for this device.',
        HttpStatusCodes.UNAUTHORIZED,
        StatusResponse.FAILED
      );
    }
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return apiResponse(
        res,
        'User not found.',
        HttpStatusCodes.UNAUTHORIZED,
        StatusResponse.FAILED
      );
    }

    if (!user.active) {
      return apiResponse(
        res,
        'Account is deactivated.',
        HttpStatusCodes.UNAUTHORIZED,
        StatusResponse.FAILED
      );
    }

    if (!user.emailVerified) {
      return apiResponse(
        res,
        'Your account is not verified.',
        HttpStatusCodes.UNAUTHORIZED,
        StatusResponse.FAILED
      );
    }

    req.user = user;
    req.token = token;
    req.user.jti = jti;
    next();
  } catch (error) {
    // logger.error(`Authentication error: ${error}`);
    if (error.name === 'JsonWebTokenError') {
      return apiResponse(
        res,
        'Invalid token.',
        HttpStatusCodes.UNAUTHORIZED,
        StatusResponse.FAILED
      );
    }

    if (error.name === 'TokenExpiredError') {
      return apiResponse(
        res,
        'Session expired.',
        HttpStatusCodes.UNAUTHORIZED,
        StatusResponse.FAILED
      );
    }

    next(error);
  }
};

module.exports = {
  authenticate,
};
