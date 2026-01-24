const { apiResponse } = require('../utils/apiResponse');
const HttpStatusCodes = require('../utils/statusCodes');
const StatusResponse = require('../utils/statusResponse');
const { PaystackService } = require('../integrations/paystack/services');
const { getBankAccountByUser, getUserWalletByUser } = require('../dbCruds/userCrud');
const Logger = require('../utils/logger');

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

module.exports = {
  getUserDetails,
  getBanksController,
  resolveAccountNumberController,
  getMyBankDetailsController,
  getMyWalletDetailsController,
};
