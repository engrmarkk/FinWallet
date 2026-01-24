const { apiResponse } = require('../../utils/apiResponse');
const HttpStatusCodes = require('../../utils/statusCodes');
const StatusResponse = require('../../utils/statusResponse');
const Logger = require('../../utils/logger');
const { VtpassService } = require('../../integrations/vtpass/services');
const { determinePurchaseType } = require('../../utils/appUtil');

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

module.exports = {
  getServicesController,
  getVariationsController,
  verifyMeterAndSmartcardNumberController,
};
