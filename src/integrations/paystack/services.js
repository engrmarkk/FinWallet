const { PaystackBase } = require('./base');
const Logger = require('../../utils/logger');

const logger = new Logger();

class PaystackService extends PaystackBase {
  constructor() {
    super();
  }

  // get all banks
  async getAllBanks() {
    try {
      const url = `${this.baseUrl}/bank?country=${this.country}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      });
      logger.info(`Paystack getAllBanks response status: ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Error fetching banks from Paystack:', error);
      throw error;
    }
  }

  // resolve account number
  async resolveAccountNumber(accountNumber, bankCode) {
    try {
      const url = `${this.baseUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      });
      logger.info(`Paystack resolveAccountNumber response status: ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      logger.error(`Error resolving account number with Paystack: ${error}`);
      throw error;
    }
  }
}

module.exports = { PaystackService };
