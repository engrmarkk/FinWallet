const jwt = require('jsonwebtoken');
const { User } = require('../models/userModel');
const { apiResponse } = require('../utils/apiResponse');
const HttpStatusCodes = require('../utils/statusCodes');
const StatusResponse = require('../utils/statusResponse');

const authenticate = async (req, res, next) => {
  try {
    let token = req.header('Authorization') || '';
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

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
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
