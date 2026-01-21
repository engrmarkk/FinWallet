class PaystackBase {
  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY;
    this.baseUrl = process.env.PAYSTACK_BASE_URL;
    this.country = process.env.PAYSTACK_COUNTRY;
    this.headers = {
      Authorization: `Bearer ${this.secretKey}`,
    };
  }
}

module.exports = { PaystackBase };
