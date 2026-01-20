const { apiResponse } = require('../utils/apiResponse');
const HttpStatusCodes = require('../utils/statusCodes');
const StatusResponse = require('../utils/statusResponse');

// middleware/errorHandler.js
function errorHandler(err, req, res, next) {
  console.error(err); // optional: log for debugging

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    console.log(`Validation errors: ${messages}`);
    return apiResponse(res, 'Network Error', HttpStatusCodes.BAD_REQUEST, StatusResponse.FAILED);
  }

  // Cast error (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    return apiResponse(
      res,
      'Invalid ID format',
      HttpStatusCodes.BAD_REQUEST,
      StatusResponse.FAILED
    );
  }

  // Default fallback
  return apiResponse(res, 'Network Error', HttpStatusCodes.BAD_REQUEST, StatusResponse.FAILED);
}

module.exports = errorHandler;
