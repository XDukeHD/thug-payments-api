const axios = require('axios');
const config = require('../../config.json');

class PagBankService {
  constructor() {
    this.apiUrl = 'https://api.pagbank.com.br';
    this.token = config.pagbank.token;
    this.email = config.pagbank.email;
    
    this.api = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'x-api-version': '4.0'
      }
    });
  }

  async createCharge(data) {
    try {
      const payload = this._formatChargePayload(data);
      const response = await this.api.post('/charges', payload);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }
  
  async createPixCharge(data) {
    try {
      const payload = this._formatPixChargePayload(data);
      const response = await this.api.post('/charges', payload);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  async getChargeStatus(chargeId) {
    try {
      const response = await this.api.get(`/charges/${chargeId}`);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  _formatChargePayload(data) {
    return {
      reference_id: data.referenceId,
      description: data.description,
      amount: {
        value: parseInt((data.amount * 100).toFixed(0)),
        currency: "BRL"
      },
      payment_method: {
        type: data.paymentMethod || "CREDIT_CARD",
        installments: data.installments || 1,
        capture: true
      },
      notification_urls: [
        data.notificationUrl || "https://your-domain.com/webhook/pagbank"
      ],
      customer: {
        name: data.customerName,
        email: data.customerEmail,
        tax_id: data.customerDocument
      }
    };
  }
  
  _formatPixChargePayload(data) {
    return {
      reference_id: data.referenceId,
      description: data.description,
      amount: {
        value: parseInt((data.amount * 100).toFixed(0)),
        currency: "BRL"
      },
      payment_method: {
        type: "PIX",
        expiration_date: data.expirationDate || this._getDefaultPixExpirationDate()
      },
      notification_urls: [
        data.notificationUrl || "https://your-domain.com/webhook/pagbank"
      ],
      customer: {
        name: data.customerName,
        email: data.customerEmail,
        tax_id: data.customerDocument
      }
    };
  }
  
  _getDefaultPixExpirationDate() {
    // Set default expiration to 24 hours from now
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24);
    return expirationDate.toISOString();
  }

  _handleError(error) {
    if (error.response) {
      throw new Error(`PagBank API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      throw new Error(`PagBank API request error: ${error.message}`);
    } else {
      throw new Error(`PagBank API unexpected error: ${error.message}`);
    }
  }
}

module.exports = new PagBankService();