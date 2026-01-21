class VtpassBase {
  constructor() {
    // Load environment variables safely
    this.email = process.env.VTPASS_EMAIL || '';
    this.password = process.env.VTPASS_PASSWORD || '';
    this.apiKey = process.env.VTPASS_API_KEY || '';
    this.pubKey = process.env.VTPASS_PUBLIC_KEY || '';
    this.secretKey = process.env.VTPASS_SECRET_KEY || '';
    this.baseUrl = process.env.VTPASS_BASE_URL || '';

    // Generate Basic Auth header
    const authString = `${this.email}:${this.password}`;
    this.basicAuth = `Basic ${Buffer.from(authString).toString('base64')}`;
  }

  // Getter for request headers
  get headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: this.basicAuth,
      'api-key': this.apiKey,
      'secret-key': this.secretKey,
    };
  }
}

export default VtpassBase;
