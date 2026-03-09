exports.apiResponse = (
  res,
  message,
  statusCode,
  statusMessage = 'success',
  data = null,
  pagination = null
) => {
  const response = { status: statusMessage, msg: message };
  if (data) {
    response.data = data;
  }
  if (pagination) {
    response.pagination = pagination;
  }
  res.status(statusCode).json(response);
};
