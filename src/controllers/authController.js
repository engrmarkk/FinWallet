const { apiResponse } = require('../utils/apiResponse');
const createToken = require('../utils/createToken');
const HttpStatusCodes = require('../utils/statusCodes');
const StatusResponse = require('../utils/statusResponse');
const {
  getUserByEmail,
  getUserByPhoneNumber,
  createUser,
  createUserSession,
  createUserWalletIfNotExists,
  getUserSessionByUserId,
} = require('../dbCruds/authCrud');
const { generateSecureOTP, validateEmail, comparePassword } = require('../utils/appUtil');

exports.loginController = async (req, res) => {
  if (!req.body?.email || !req.body?.password) {
    return apiResponse(
      res,
      'email and password are required',
      HttpStatusCodes.BAD_REQUEST,
      StatusResponse.FAILED
    );
  }
  const { email, password } = req.body;

  console.log(`Email: ${email}, Password: ${password}`);
  const user = await getUserByEmail(email);
  if (!user || !(await comparePassword(password, user.password))) {
    return apiResponse(
      res,
      'Invalid email or password',
      HttpStatusCodes.BAD_REQUEST,
      StatusResponse.FAILED
    );
  }
  if (!user.emailVerified) {
    return apiResponse(
      res,
      'Email not verified. Please verify your email before logging in.',
      HttpStatusCodes.FORBIDDEN,
      StatusResponse.FAILED,
      { email: user.email, isVerified: user.emailVerified }
    );
  }
  const access_token = createToken(user.id);
  apiResponse(res, 'login successful', HttpStatusCodes.OK, StatusResponse.SUCCESS, {
    access_token,
    isVerified: user.emailVerified,
  });
};

// register user
exports.registerController = async (req, res) => {
  if (!req.body) {
    return apiResponse(
      res,
      'Invalid request body',
      HttpStatusCodes.BAD_REQUEST,
      StatusResponse.FAILED
    );
  }

  const { firstName, lastName, email, password, confirmPassword, phoneNumber } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return apiResponse(
      res,
      'firstName, lastName, email, and password are required',
      HttpStatusCodes.BAD_REQUEST,
      StatusResponse.FAILED
    );
  }

  email_exist = await getUserByEmail(email);
  if (email_exist) {
    return apiResponse(
      res,
      'Email already in use',
      HttpStatusCodes.CONFLICT,
      StatusResponse.FAILED
    );
  }

  const emailVal = await validateEmail(email);
  console.log(`Email validation for ${email}: ${emailVal}`);
  if (!emailVal) {
    return apiResponse(
      res,
      'Invalid email format',
      HttpStatusCodes.BAD_REQUEST,
      StatusResponse.FAILED
    );
  }

  phone_exist = await getUserByPhoneNumber(phoneNumber);
  if (phone_exist) {
    return apiResponse(
      res,
      'Phone number already in use',
      HttpStatusCodes.CONFLICT,
      StatusResponse.FAILED
    );
  }

  // if password lenght is less than 8
  if (password.length < 8) {
    return apiResponse(
      res,
      'Password must be at least 8 characters',
      HttpStatusCodes.BAD_REQUEST,
      StatusResponse.FAILED
    );
  }

  if (password !== confirmPassword) {
    return apiResponse(
      res,
      'Passwords do not match',
      HttpStatusCodes.BAD_REQUEST,
      StatusResponse.FAILED
    );
  }

  user = await createUser(firstName, lastName, email, password, phoneNumber);

  if (!user) {
    return apiResponse(
      res,
      'Network Error',
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
      StatusResponse.ERROR
    );
  }

  const otp = await generateSecureOTP();

  console.log(`Generated OTP: ${otp} for user: ${user._id}`);

  await createUserSession(otp, user._id);
  await createUserWalletIfNotExists(user._id);

  return apiResponse(
    res,
    'User registered successfully. Please verify your email using the OTP sent.',
    HttpStatusCodes.CREATED,
    StatusResponse.SUCCESS
  );
};

// verify account controller
exports.verifyAccountController = async (req, res) => {
  if (!req.body?.email) {
    return apiResponse(
      res,
      'email is required',
      HttpStatusCodes.BAD_REQUEST,
      StatusResponse.FAILED
    );
  }
  const { email, otp } = req.body;
  console.log(`Email: ${email}, OTP: ${otp}`);

  if (!otp) {
    return apiResponse(res, 'OTP is required', HttpStatusCodes.BAD_REQUEST, StatusResponse.FAILED);
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return apiResponse(res, 'User not found', HttpStatusCodes.NOT_FOUND, StatusResponse.FAILED);
  }

  if (user.emailVerified) {
    return apiResponse(
      res,
      'Email already verified',
      HttpStatusCodes.BAD_REQUEST,
      StatusResponse.FAILED
    );
  }

  userSess = await getUserSessionByUserId(user._id);
  if (!userSess) {
    return apiResponse(
      res,
      'User session not found',
      HttpStatusCodes.NOT_FOUND,
      StatusResponse.FAILED
    );
  }

  // if the otp_valid is false
  if (!userSess.otp_valid) {
    return apiResponse(
      res,
      'OTP is no longer valid',
      HttpStatusCodes.BAD_REQUEST,
      StatusResponse.FAILED
    );
  }

  if (userSess.otp !== otp) {
    return apiResponse(res, 'Invalid OTP', HttpStatusCodes.BAD_REQUEST, StatusResponse.FAILED);
  }

  // if the otp has expired
  if (userSess.otp_expires < Date.now()) {
    return apiResponse(res, 'OTP has expired', HttpStatusCodes.BAD_REQUEST, StatusResponse.FAILED);
  }

  user.emailVerified = true;
  userSess.otp_valid = false;

  await user.save();
  await userSess.save();

  const access_token = createToken(user.id);

  return apiResponse(
    res,
    'Email verified successfully',
    HttpStatusCodes.OK,
    StatusResponse.SUCCESS,
    { access_token }
  );
};

// resend otp
exports.resendOTPController = async (req, res) => {
  if (!req.body?.email) {
    return apiResponse(
      res,
      'email is required',
      HttpStatusCodes.BAD_REQUEST,
      StatusResponse.FAILED
    );
  }
  if (!req.params?.action) {
    return apiResponse(
      res,
      'action is required',
      HttpStatusCodes.BAD_REQUEST,
      StatusResponse.FAILED
    );
  }

  const { action } = req.params;
  const { email } = req.body;

  if (!['email', 'password'].includes(action)) {
    return apiResponse(
      res,
      'Invalid action, must be either "email" or "password"',
      HttpStatusCodes.BAD_REQUEST,
      StatusResponse.FAILED
    );
  }

  otp = await generateSecureOTP();

  console.log(`Generated OTP: ${otp} for email: ${email}`);

  const user = await getUserByEmail(email);
  if (!user) {
    return apiResponse(res, 'User not found', HttpStatusCodes.NOT_FOUND, StatusResponse.FAILED);
  }

  if (action === 'email') {
    await createUserSession(otp, user._id);
  } else {
    // to be implemented
  }

  return apiResponse(res, 'OTP sent successfully', HttpStatusCodes.OK, StatusResponse.SUCCESS);
};
