const { apiResponse } = require('../../utils/apiResponse');
const HttpStatusCodes = require('../../utils/statusCodes');
const StatusResponse = require('../../utils/statusResponse');
const {
  createTransactionCategory,
  getTransactionCategories,
  createTransaction,
  getTransactionCategoryByName,
  creditOrDebitUserWallet,
  getTransactionByReference,
} = require('../../dbCruds/transactionCrud');
const { getBankAccountByAccountNumber, getUserBalance } = require('../../dbCruds/userCrud');
const { generateReferences } = require('../../utils/appUtil');
// const { buildTransactionResponse } = require('../helpers/transHelper');
const Logger = require('../../utils/logger');

const logger = new Logger();

// create transaction category controller
const createTransactionCategoryController = async (req, res) => {
  if (!req.body?.name) {
    return apiResponse(
      res,
      'Category name is required',
      HttpStatusCodes.BAD_REQUEST,
      StatusResponse.FAILED
    );
  }

  const { name } = req.body;
  try {
    const newCategory = await createTransactionCategory(name);
    return apiResponse(
      res,
      'Transaction category created successfully',
      HttpStatusCodes.CREATED,
      StatusResponse.SUCCESS,
      newCategory
    );
  } catch (error) {
    logger.error(`Error creating transaction category: ${error}`);
    return apiResponse(res, 'Network Error', HttpStatusCodes.BAD_REQUEST, StatusResponse.FAILED);
  }
};

// get transaction categories controller
const getTransactionCategoriesController = async (req, res) => {
  try {
    const categories = await getTransactionCategories();
    return apiResponse(
      res,
      'Transaction categories fetched successfully',
      HttpStatusCodes.OK,
      StatusResponse.SUCCESS,
      categories
    );
  } catch (error) {
    logger.error(`Error fetching transaction categories: ${error}`);
    return apiResponse(res, 'Network Error', HttpStatusCodes.BAD_REQUEST, StatusResponse.FAILED);
  }
};

// top up controller
const topUpController = async (req, res) => {
  try {
    if (!req.body) {
      return apiResponse(
        res,
        'Request body is required',
        HttpStatusCodes.BAD_REQUEST,
        StatusResponse.FAILED
      );
    }

    const {
      amount,
      narration,
      reference,
      bankName,
      accountNumber,
      accountName,
      bankCode,
      receiverAccountNumber,
    } = req.body;
    if (!amount || amount <= 0) {
      return apiResponse(
        res,
        'Amount is required and must be greater than 0',
        HttpStatusCodes.BAD_REQUEST,
        StatusResponse.FAILED
      );
    }

    if (!reference) {
      return apiResponse(
        res,
        'Transaction reference is required',
        HttpStatusCodes.BAD_REQUEST,
        StatusResponse.FAILED
      );
    }

    if (!bankName || !accountNumber || !accountName || !bankCode) {
      return apiResponse(
        res,
        'Bank details (bankName, accountNumber, accountName, bankCode) are required',
        HttpStatusCodes.BAD_REQUEST,
        StatusResponse.FAILED
      );
    }

    const account = await getBankAccountByAccountNumber(receiverAccountNumber);
    if (!account) {
      return apiResponse(
        res,
        'Receiver account not found',
        HttpStatusCodes.BAD_REQUEST,
        StatusResponse.FAILED
      );
    }

    const userId = account.userId;

    logger.info(`User ID for top up: ${userId}`);

    transStatus = 'completed';
    categoryId = await getTransactionCategoryByName('top up').then((cat) => cat._id);
    logger.info(`Top up category ID: ${categoryId}`);
    type = 'credit';

    const existingTransaction = await getTransactionByReference(reference);
    if (existingTransaction) {
      return apiResponse(
        res,
        'Duplicate transaction',
        HttpStatusCodes.BAD_REQUEST,
        StatusResponse.FAILED
      );
    }

    const newTransaction = await createTransaction(
      userId,
      amount,
      type,
      categoryId,
      transStatus,
      narration,
      reference,
      bankName,
      accountNumber,
      accountName,
      bankCode
    );

    await creditOrDebitUserWallet(userId, amount, 'credit');

    return apiResponse(
      res,
      'Top up transaction created successfully',
      HttpStatusCodes.CREATED,
      StatusResponse.SUCCESS,
      newTransaction
    );
  } catch (error) {
    logger.error(`Error in topUpController: ${error}`);
    return apiResponse(res, 'Network Error', HttpStatusCodes.BAD_REQUEST, StatusResponse.FAILED);
  }
};

// transfer controller
const transferController = async (req, res) => {
  try {
    if (!req.body) {
      return apiResponse(
        res,
        'Request body is required',
        HttpStatusCodes.BAD_REQUEST,
        StatusResponse.FAILED
      );
    }
    const { amount, narration, bankName, accountNumber, accountName, bankCode } = req.body;
    if (!amount || amount <= 0) {
      return apiResponse(
        res,
        'Amount is required and must be greater than 0',
        HttpStatusCodes.BAD_REQUEST,
        StatusResponse.FAILED
      );
    }

    if (!bankName || !accountNumber || !accountName || !bankCode) {
      return apiResponse(
        res,
        'Bank details (bankName, accountNumber, accountName, bankCode) are required',
        HttpStatusCodes.BAD_REQUEST,
        StatusResponse.FAILED
      );
    }

    user = req.user;
    const userBalance = await getUserBalance(user._id);
    if (amount > userBalance) {
      return apiResponse(
        res,
        'Insufficient funds',
        HttpStatusCodes.BAD_REQUEST,
        StatusResponse.FAILED
      );
    }
    categoryId = await getTransactionCategoryByName('transfer').then((cat) => cat._id);
    const reference = generateReferences();
    logger.info(`Reference for transfer: ${reference}`);

    const newTransaction = await createTransaction(
      user._id,
      amount,
      'debit',
      categoryId,
      'completed',
      narration,
      reference,
      bankName,
      accountNumber,
      accountName,
      bankCode
    );

    await creditOrDebitUserWallet(user._id, amount, 'debit');

    return apiResponse(
      res,
      'Transfer successful',
      HttpStatusCodes.CREATED,
      StatusResponse.SUCCESS,
      newTransaction
    );
  } catch (error) {
    logger.error(`Error in transferController: ${error}`);
    return apiResponse(res, 'Network Error', HttpStatusCodes.BAD_REQUEST, StatusResponse.FAILED);
  }
};

module.exports = {
  createTransactionCategoryController,
  getTransactionCategoriesController,
  topUpController,
  transferController,
};
