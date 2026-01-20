const express = require('express');
const { apiResponse } = require('../utils/apiResponse');

exports.ping = async (req, res) => {
  apiResponse(res, 'pong', 200);
};
