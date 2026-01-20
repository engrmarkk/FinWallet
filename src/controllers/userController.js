const { apiResponse } = require('../utils/apiResponse');
const HttpStatusCodes = require('../utils/statusCodes');
const StatusResponse = require('../utils/statusResponse');
const { formatDate } = require('../utils/appUtil');

// get user details
exports.getUserDetails = async (req, res) => {
  const user = req.user;

  if (!user) {
    return apiResponse(res, 'User not found', HttpStatusCodes.NOT_FOUND, StatusResponse.FAILED);
  }

  const u = user.toObject();
  u.date = formatDate(u.date);
  u.createdAt = formatDate(u.createdAt);
  u.updatedAt = formatDate(u.updatedAt);

  return apiResponse(
    res,
    'User details fetched successfully',
    HttpStatusCodes.OK,
    StatusResponse.SUCCESS,
    { ...u }
  );
};
