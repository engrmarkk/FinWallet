const { User, UserSession, Wallet } = require('../models/userModel');
const { hashPassword } = require('../utils/appUtil');

// Email exists
const getUserByEmail = async (email) => {
  return await User.findOne({ email });
};

// phone number exists
const getUserByPhoneNumber = async (phoneNumber) => {
  return await User.findOne({ phoneNumber });
};

// create user
const createUser = async (firstName, lastName, email, password, phoneNumber) => {
  const newUser = new User({
    firstName,
    lastName,
    email,
    password: await hashPassword(password),
    phoneNumber,
  });
  return await newUser.save();
};

// get usersession by userId
const getUserSessionByUserId = async (userId) => {
  return await UserSession.findOne({ userId });
};

// create user session
const createUserSession = async (otp, userId) => {
  const otp_expires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes
  const existingSession = await getUserSessionByUserId(userId);
  if (existingSession) {
    existingSession.otp = otp;
    existingSession.otp_expires = otp_expires;
    existingSession.otp_valid = true;
    return await existingSession.save();
  } else {
    const newUserSession = new UserSession({
      userId,
      otp,
      otp_expires,
    });
    return await newUserSession.save();
  }
};

// if user has wallet before now, create if not skip
const createUserWalletIfNotExists = async (userId) => {
  const existingWallet = await Wallet.findOne({ userId });
  if (!existingWallet) {
    const newWallet = new Wallet({
      userId,
      balance: 0,
    });
    return await newWallet.save();
  }
  return existingWallet;
};

module.exports = {
  getUserByEmail,
  getUserByPhoneNumber,
  createUser,
  getUserSessionByUserId,
  createUserSession,
  createUserWalletIfNotExists,
};
