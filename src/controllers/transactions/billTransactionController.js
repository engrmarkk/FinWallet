const { apiResponse } = require('../../utils/apiResponse');
const HttpStatusCodes = require('../../utils/statusCodes');
const StatusResponse = require('../../utils/statusResponse');
const Logger = require('../../utils/logger');
const { VtpassService } = require('../../integrations/vtpass/services');
const { determinePurchaseType, generateRequestId } = require('../../utils/appUtil');
const {
  createTransactionCategory,
  createBillTransaction,
  creditOrDebitUserWallet,
} = require('../../dbCruds/transactionCrud');
const { getUserBalance } = require('../../dbCruds/userCrud');
const { refundTransaction } = require('../../dbCruds/backgroundCrud');
const { vtpassQueue } = require('../../queues/vtpass_queue.js');

const vtpass = new VtpassService();

const logger = new Logger();

// get services
const getServicesController = async (req, res) => {
  const { service } = req.params;
  if (!service) {
    return apiResponse(
      res,
      'which service are you looking for?',
      HttpStatusCodes.BAD_REQUEST,
      StatusResponse.FAILED
    );
  }

  //   check if the service is inside the allowed services in an array
  if (!['airtime', 'data', 'tv-subscription', 'electricity-bill'].includes(service)) {
    return apiResponse(
      res,
      'Invalid service type, should be one of airtime, data, tv-subscription, electricity-bill',
      HttpStatusCodes.BAD_REQUEST,
      StatusResponse.FAILED
    );
  }
  try {
    const servicesData = await vtpass.serviceIdentifier(service);
    logger.info(`VTpass services response: ${JSON.stringify(servicesData)}`);
    if (servicesData.response_description === '000') {
      return apiResponse(
        res,
        'Services fetched successfully',
        HttpStatusCodes.OK,
        StatusResponse.SUCCESS,
        servicesData.content
      );
    } else {
      return apiResponse(
        res,
        'Failed to fetch services',
        HttpStatusCodes.BAD_REQUEST,
        StatusResponse.FAILED
      );
    }
  } catch (error) {
    logger.error(`Error in getServicesController: ${error}`);
    return apiResponse(res, 'Network Error', HttpStatusCodes.BAD_REQUEST, StatusResponse.FAILED);
  }
};

// get variations controller
const getVariationsController = async (req, res) => {
  try {
    const { serviceID } = req.params;
    if (!serviceID) {
      return apiResponse(
        res,
        'serviceID is required',
        HttpStatusCodes.BAD_REQUEST,
        StatusResponse.FAILED
      );
    }
    const variationsData = await vtpass.variationCodes(serviceID);
    logger.info(`VTpass variations response: ${JSON.stringify(variationsData)}`);
    if (variationsData.response_description === '000') {
      return apiResponse(
        res,
        'Variations fetched successfully',
        HttpStatusCodes.OK,
        StatusResponse.SUCCESS,
        variationsData.content
      );
    } else if (variationsData.code === '011') {
      return apiResponse(
        res,
        variationsData.content.errors,
        HttpStatusCodes.BAD_REQUEST,
        StatusResponse.FAILED
      );
    } else {
      return apiResponse(
        res,
        'Failed to fetch variations',
        HttpStatusCodes.BAD_REQUEST,
        StatusResponse.FAILED
      );
    }
  } catch (error) {
    logger.error(`Error in getVariationsController: ${error}`);
    return apiResponse(res, 'Network Error', HttpStatusCodes.BAD_REQUEST, StatusResponse.FAILED);
  }
};

const verifyMeterAndSmartcardNumberController = async (req, res) => {
  try {
    if (!req.body?.serviceID || !req.body?.billersCode) {
      return apiResponse(
        res,
        'serviceID and billersCode are required',
        HttpStatusCodes.BAD_REQUEST,
        StatusResponse.FAILED
      );
    }
    const billersCode = req.body.billersCode;
    const serviceID = req.body.serviceID;
    const variationType = req.body.variationType || null;
    const purchaseType = determinePurchaseType(req.body.serviceID);
    if (process.env.ENVIRONMENT === 'development') {
      if (purchaseType === 'electricity') {
        realBillersCode =
          variationType.toLowerCase() === 'prepaid' ? '1111111111111' : '1010101010101';
      } else {
        realBillersCode = '1212121212';
      }
    } else {
      // use real billerCode logic here
      realBillersCode = billersCode; // whatever you normally set
    }
    payload = {
      serviceID,
      billersCode: realBillersCode,
    };
    if (variationType) {
      payload.type = variationType;
    }
    const verificationData = await vtpass.verifyMeterAndSmartcardNumber(payload);
    logger.info(`VTpass verification response: ${JSON.stringify(verificationData)}`);
    if (verificationData.code === '000') {
      return apiResponse(
        res,
        'Verification successful',
        HttpStatusCodes.OK,
        StatusResponse.SUCCESS,
        verificationData.content
      );
    } else if (verificationData.code === '011') {
      return apiResponse(
        res,
        variationsData.content.errors,
        HttpStatusCodes.BAD_REQUEST,
        StatusResponse.FAILED
      );
    } else {
      return apiResponse(
        res,
        'Failed to verify meter/smartcard number',
        HttpStatusCodes.BAD_REQUEST,
        StatusResponse.FAILED
      );
    }
  } catch (error) {
    logger.error(`Error in veryfyMeterAndSmartcardNumberController: ${error}`);
    return apiResponse(res, 'Network Error', HttpStatusCodes.BAD_REQUEST, StatusResponse.FAILED);
  }
};

// purchase bill controller
const purchaseBillController = async (req, res) => {
  try {
    if (!req.body?.serviceID) {
      return apiResponse(
        res,
        'serviceID is required',
        HttpStatusCodes.BAD_REQUEST,
        StatusResponse.FAILED
      );
    }

    user = req.user;

    const serviceID = req.body.serviceID;
    const billersCode = req.body.billersCode;
    const variation_code = req.body.variation_code;
    const subscription_type = req.body.subscription_type;
    const phone = req.body.phone || user.phoneNumber;
    const amount = req.body.amount;
    const quantity = req.body.quantity || 1;
    if (!serviceID) {
      return apiResponse(
        res,
        'serviceID is required',
        HttpStatusCodes.BAD_REQUEST,
        StatusResponse.FAILED
      );
    }

    const request_id = generateRequestId();

    // initiate object for payload with serviceID, request_id, phone, amount
    let payload = {
      serviceID,
      request_id,
      phone,
      amount,
    };

    const purchaseType = determinePurchaseType(req.body.serviceID);
    if (purchaseType === 'airtime') {
      if (!phone || !amount) {
        return apiResponse(
          res,
          'phone and amount are required for airtime purchase',
          HttpStatusCodes.BAD_REQUEST,
          StatusResponse.FAILED
        );
      }
      if (amount < 50) {
        return apiResponse(
          res,
          'Amount must be at least 50 for airtime purchase',
          HttpStatusCodes.BAD_REQUEST,
          StatusResponse.FAILED
        );
      }

      if (process.env.ENVIRONMENT === 'development') {
        payload.phone = '08011111111';
      }
    } else if (purchaseType === 'data') {
      if (!billersCode || !variation_code || !amount) {
        return apiResponse(
          res,
          'billersCode, variation_code and amount are required for data purchase',
          HttpStatusCodes.BAD_REQUEST,
          StatusResponse.FAILED
        );
      }

      if (process.env.ENVIRONMENT === 'development') {
        billersCode = '08011111111';
      }

      payload.billersCode = billersCode;
      payload.variation_code = variation_code;
    } else if (purchaseType === 'cable') {
      if (!billersCode || !variation_code || !phone || !amount || !subscription_type) {
        return apiResponse(
          res,
          'billersCode, variation_code, phone, amount and subscription_type are required for cable tv purchase',
          HttpStatusCodes.BAD_REQUEST,
          StatusResponse.FAILED
        );
      }
      payload.billersCode = billersCode;
      payload.variation_code = variation_code;
      payload.subscription_type = subscription_type;
      payload.quantity = quantity;
    } else if (purchaseType === 'electricity') {
      if (!billersCode || !variation_code || !phone || !amount) {
        return apiResponse(
          res,
          'billersCode, variation_code, phone and amount are required for electricity bill purchase',
          HttpStatusCodes.BAD_REQUEST,
          StatusResponse.FAILED
        );
      }
      payload.billersCode = billersCode;
      payload.variation_code = variation_code;
    } else {
      return apiResponse(
        res,
        'Invalid serviceID',
        HttpStatusCodes.BAD_REQUEST,
        StatusResponse.FAILED
      );
    }

    const userBalance = await getUserBalance(user._id);

    if (amount > userBalance) {
      return apiResponse(
        res,
        'Insufficient funds',
        HttpStatusCodes.BAD_REQUEST,
        StatusResponse.FAILED
      );
    }

    categoryId = await createTransactionCategory(purchaseType).then((cat) => cat._id);
    logger.info(`${purchaseType} category ID: ${categoryId}`);

    const trans = await createBillTransaction(
      user._id,
      amount,
      'debit',
      categoryId,
      'pending',
      'Purchase of bill',
      request_id,
      '', // billerName
      purchaseType,
      variation_code,
      serviceID
    );

    await creditOrDebitUserWallet(user._id, amount, 'debit');

    if (process.env.ENVIRONMENT === 'development') {
      if (purchaseType === 'electricity') {
        realBillersCode =
          variation_code.toLowerCase() === 'prepaid' ? '1111111111111' : '1010101010101';
      } else if (purchaseType === 'cable') {
        realBillersCode = '1212121212';
      } else {
        realBillersCode = billersCode;
      }
      // replace billersCode with realBillersCode
      payload.billersCode = realBillersCode;
    }

    const vtpassResponse = await vtpass.purchaseProduct(payload);

    logger.info(`Vtpass responseeeee: ${JSON.stringify(vtpassResponse)}`);

    // if the code is "000", update the transaction status to completed
    if (vtpassResponse.code === '000') {
      vtpassQueue.add('saveResponse', {
        request_id,
        content: vtpassResponse.content
      });
      logger.info("Bill purchase successful");
      return apiResponse(
        res,
        'Bill purchase successful',
        HttpStatusCodes.OK,
        StatusResponse.SUCCESS
      );
    } else if (vtpassResponse.code === '099') {
      // recheck the transaction after some time
      await vtpassQueue.add(
        'requery',
        { request_id },
        {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 600000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        }
      );
      return apiResponse(res, 'Bill purchase pending', HttpStatusCodes.OK, StatusResponse.SUCCESS);
    } else {
      await refundTransaction(request_id);
      return apiResponse(
        res,
        vtpassResponse.response_description || 'Bill purchase failed',
        HttpStatusCodes.UNPROCESSABLE_ENTITY,
        StatusResponse.FAILED,
        vtpassResponse
      );
    }
  } catch (error) {
    logger.error(`Error in purchaseBillController: ${error}`);
    return apiResponse(res, 'Network Error', HttpStatusCodes.BAD_REQUEST, StatusResponse.FAILED);
  }
};

module.exports = {
  getServicesController,
  getVariationsController,
  verifyMeterAndSmartcardNumberController,
  purchaseBillController,
};
