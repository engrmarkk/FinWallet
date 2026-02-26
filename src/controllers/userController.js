const { apiResponse } = require('../utils/apiResponse');
const HttpStatusCodes = require('../utils/statusCodes');
const StatusResponse = require('../utils/statusResponse');
const { PaystackService } = require('../integrations/paystack/services');
const { getBankAccountByUser, getUserWalletByUser, setTransactionPin } = require('../dbCruds/userCrud');
const Logger = require('../utils/logger');
const {comparePassword} = require('../utils/appUtil');

const logger = new Logger();

const ps = new PaystackService();

// get user details
const getUserDetails = async (req, res) => {
  const user = req.user;

  if (!user) {
    return apiResponse(res, 'User not found', HttpStatusCodes.NOT_FOUND, StatusResponse.FAILED);
  }

  return apiResponse(
    res,
    'User details fetched successfully',
    HttpStatusCodes.OK,
    StatusResponse.SUCCESS,
    { ...user.toJSON() }
  );
};

// get banks conroller
const getBanksController = async (req, res) => {
  try {
    const banksData = await ps.getAllBanks();
    if (banksData.status) {
      return apiResponse(
        res,
        'Banks fetched successfully',
        HttpStatusCodes.OK,
        StatusResponse.SUCCESS,
        banksData.data
      );
    } else {
      return apiResponse(
        res,
        'Failed to fetch banks',
        HttpStatusCodes.BAD_REQUEST,
        StatusResponse.FAILED
      );
    }
  } catch (error) {
    logger.error(`Error in getBanksController: ${error}`);
    return apiResponse(res, 'Network Error', HttpStatusCodes.BAD_REQUEST, StatusResponse.FAILED);
  }
};

// resolve account number controller
const resolveAccountNumberController = async (req, res) => {
  const { accountNumber, bankCode } = req.query;

  if (!accountNumber || !bankCode) {
    return apiResponse(
      res,
      'accountNumber and bankCode are required',
      HttpStatusCodes.BAD_REQUEST,
      StatusResponse.FAILED
    );
  }

  try {
    const resolutionData = await ps.resolveAccountNumber(accountNumber, bankCode);
    logger.info(`Account resolution data from Paystack: ${resolutionData}`);
    if (resolutionData.status) {
      return apiResponse(
        res,
        'Account resolved successfully',
        HttpStatusCodes.OK,
        StatusResponse.SUCCESS,
        resolutionData.data
      );
    } else {
      return apiResponse(
        res,
        'Failed to resolve account',
        HttpStatusCodes.BAD_REQUEST,
        StatusResponse.FAILED
      );
    }
  } catch (error) {
    logger.error(`Error in resolveAccountNumberController: ${error}`);
    return apiResponse(res, 'Network Error', HttpStatusCodes.BAD_REQUEST, StatusResponse.FAILED);
  }
};

// get my bank details
const getMyBankDetailsController = async (req, res) => {
  try {
    const user = req.user;
    const bankAccount = await getBankAccountByUser(user);
    return apiResponse(
      res,
      'Bank account details fetched successfully',
      HttpStatusCodes.OK,
      StatusResponse.SUCCESS,
      bankAccount
    );
  } catch (error) {
    logger.error(`Error in getMyBankDetailsController: ${error}`);
    return apiResponse(res, 'Network Error', HttpStatusCodes.BAD_REQUEST, StatusResponse.FAILED);
  }
};

// get my wallet details controller
const getMyWalletDetailsController = async (req, res) => {
  try {
    const user = req.user;
    const wallet = await getUserWalletByUser(user);
    return apiResponse(
      res,
      'Wallet details fetched successfully',
      HttpStatusCodes.OK,
      StatusResponse.SUCCESS,
      wallet
    );
  } catch (error) {
    logger.error(`Error in getMyWalletDetailsController: ${error}`);
    return apiResponse(res, 'Network Error', HttpStatusCodes.BAD_REQUEST, StatusResponse.FAILED);
  }
};

// set transaction pin controller
const setTransactionPinController = async (req, res) => {
  const { pin } = req.body;
  if (!pin || pin.length !== 4) {
    return apiResponse(
      res,
      'A valid 4-digit transaction pin is required',
      HttpStatusCodes.BAD_REQUEST,
      StatusResponse.FAILED
    );
  }

  try {
    const user = req.user;
    if (user.transaction_pin) {
      return apiResponse(
        res,
        'Transaction pin already set.',
        HttpStatusCodes.BAD_REQUEST,
        StatusResponse.FAILED
      );
    }
    await setTransactionPin(user._id, pin);
    return apiResponse(
      res,
      'Transaction pin set successfully',
      HttpStatusCodes.OK,
      StatusResponse.SUCCESS
    );
  } catch (error) {
    logger.error(`Error in setTransactionPinController: ${error}`);
    return apiResponse(res, 'Network Error', HttpStatusCodes.BAD_REQUEST, StatusResponse.FAILED);
  }
};

// change transaction pin controller
const changeTransactionPinController = async (req, res) => {
  const { oldPin, newPin } = req.body;
  if (!oldPin || !newPin || newPin.length !== 4) {
    return apiResponse(
      res,
      'Old pin and a valid 4-digit new pin are required',
      HttpStatusCodes.BAD_REQUEST,
      StatusResponse.FAILED
    );
  }

  try {
    const user = req.user;
    if (!user.transaction_pin) {
      return apiResponse(
        res,
        'No existing transaction pin found. Please set a transaction pin first.',
        HttpStatusCodes.BAD_REQUEST,
        StatusResponse.FAILED
      );
    }

    const isOldPinValid = await comparePassword(oldPin, user.transaction_pin);
    if (!isOldPinValid) {
      return apiResponse(
        res,
        'Old transaction pin is incorrect',
        HttpStatusCodes.BAD_REQUEST,
        StatusResponse.FAILED
      );
    }

    await setTransactionPin(user._id, newPin);
    return apiResponse(
      res,
      'Transaction pin changed successfully',
      HttpStatusCodes.OK,
      StatusResponse.SUCCESS
    );
  } catch (error) {
    logger.error(`Error in changeTransactionPinController: ${error}`);
    return apiResponse(res, 'Network Error', HttpStatusCodes.BAD_REQUEST, StatusResponse.FAILED);
  }
};

module.exports = {
  getUserDetails,
  getBanksController,
  resolveAccountNumberController,
  getMyBankDetailsController,
  getMyWalletDetailsController,
  setTransactionPinController,
  changeTransactionPinController
};
