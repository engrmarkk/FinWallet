const { VtpassBase } = require('./base');
const Logger = require('../../utils/logger');

const logger = new Logger();

class VtpassService extends VtpassBase {
  constructor() {
    super();
  }

  async serviceIdentifier(serviceID) {
    try {
      const url = `${this.baseUrl}/api/services?identifier=${serviceID}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      });
      logger.info(`Vtpass serviceIdentifier response status: ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      logger.error(`Error fetching service identifier from Vtpass: ${error}`);
      throw error;
    }
  }

  async purchaseProduct(payload) {
    try {
      logger.info(`Vtpass purchaseProduct payload: ${JSON.stringify(payload)}`);
      const url = `${this.baseUrl}/api/pay`;
      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload),
      });
      logger.info(`Vtpass purchaseProduct response status: ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      logger.error(`Error purchasing product from Vtpass: ${error}`);
      throw error;
    }
  }

  async variationCodes(serviceID) {
    try {
      const url = `${this.baseUrl}/api/service-variations?serviceID=${serviceID}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      });
      logger.info(`Vtpass variationCodes response status: ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      logger.error(`Error fetching variation codes from Vtpass: ${error}`);
      throw error;
    }
  }

  async verifyMeterAndSmartcardNumber(payload) {
    try {
      logger.info(`Vtpass verifyMeterAndSmartcardNumber payload: ${JSON.stringify(payload)}`);
      const url = `${this.baseUrl}/api/merchant-verify`;
      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload),
      });
      logger.info(`Vtpass verifyMeterAndSmartcardNumber response status: ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      logger.error(`Error verifying meter and smartcard number with Vtpass: ${error}`);
      throw error;
    }
  }

  // requery
  async requeryTransaction(request_id) {
    try {
      const url = `${this.baseUrl}/api/requery`;
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ request_id }),
        headers: this.headers,
      });
      logger.info(`Vtpass requeryTransaction response status: ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      logger.error(`Error requerying transaction with Vtpass: ${error}`);
      throw error;
    }
  }
}

module.exports = { VtpassService };
