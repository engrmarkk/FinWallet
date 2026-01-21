const { PaystackBase } = require('./base');

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
      console.log(`Paystack getAllBanks response status: ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching banks from Paystack:', error);
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
      console.log(`Paystack resolveAccountNumber response status: ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error resolving account number with Paystack:', error);
      throw error;
    }
  }
}

module.exports = { PaystackService };
