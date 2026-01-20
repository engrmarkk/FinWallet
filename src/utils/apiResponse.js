exports.apiResponse = (res, message, statusCode, statusMessage = 'success', data = null) => {
  const response = { status: statusMessage, msg: message };
  if (data) {
    response.data = data;
  }
  res.status(statusCode).json(response);
};
