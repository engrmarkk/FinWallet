const { VtpassBase } = require('./base');

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
      console.log(`Vtpass serviceIdentifier response status: ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching service identifier from Vtpass:', error);
      throw error;
    }
  }
}

module.exports = { VtpassService };
