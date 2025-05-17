const axios = require('axios');
const config = require('../../config.json');

class PagBankService {
  constructor() {
    const isSandbox = config.pagbank.environment === 'sandbox';
    this.apiUrl = isSandbox ? 'https://sandbox.api.pagseguro.com' : 'https://api.pagseguro.com';
    this.token = config.pagbank.token;
    
    this.api = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000
    });
    
    this.notificationUrl = `${config.webhook.baseUrl}/api/payments/notifications`;
  }

  async createCreditCardCharge(data) {
    try {
      const payload = this._formatCreditCardPayload(data);
      const response = await this.api.post('/charges', payload);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }
  
  async createPixCharge(data) {
    try {
      const payload = this._formatPixPayload(data);
      const response = await this.api.post('/orders', payload);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  async createCheckout(data) {
    try {
      const payload = this._formatCheckoutPayload(data);
      const response = await this.api.post('/checkouts', payload);
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

  async getOrderStatus(orderId) {
    try {
      const response = await this.api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  _formatCreditCardPayload(data) {
    return {
      reference_id: data.referenceId,
      description: data.description,
      amount: {
        value: parseInt((data.amount * 100).toFixed(0)),
        currency: "BRL"
      },
      payment_method: {
        type: "CREDIT_CARD",
        installments: data.installments || 1,
        capture: true,
        card: {
          number: data.card.number,
          exp_month: data.card.expMonth,
          exp_year: data.card.expYear,
          security_code: data.card.securityCode,
          holder: {
            name: data.card.holderName
          }
        }
      },
      notification_urls: [
        data.notificationUrl || this.notificationUrl
      ],
      metadata: {
        customer_user_id: data.customerUserId
      },
      customer: {
        name: data.customerName,
        email: data.customerEmail,
        tax_id: data.customerDocument
      }
    };
  }
  
  _formatPixPayload(data) {
    return {
      reference_id: data.referenceId,
      customer: {
        name: data.customerName,
        email: data.customerEmail,
        tax_id: data.customerDocument
      },
      metadata: {
        customer_user_id: data.customerUserId
      },
      items: [
        {
          name: data.description || "Payment",
          quantity: 1,
          unit_amount: parseInt((data.amount * 100).toFixed(0))
        }
      ],
      qr_codes: [
        {
          amount: {
            value: parseInt((data.amount * 100).toFixed(0))
          },
          expiration_date: data.expirationDate || this._getDefaultPixExpirationDate()
        }
      ],
      notification_urls: [
        data.notificationUrl || this.notificationUrl
      ]
    };
  }
  
  _formatCheckoutPayload(data) {
    return {
      reference_id: data.referenceId,
      customer: {
        name: data.customerName || "Cliente",
        email: data.customerEmail || "cliente@exemplo.com",
        tax_id: data.customerDocument || "12345678909"
      },
      items: [
        {
          reference_id: `item-${data.referenceId}`,
          name: data.description || "Payment",
          quantity: 1,
          unit_amount: parseInt((data.amount * 100).toFixed(0))
        }
      ],
      notification_urls: [
        data.notificationUrl || this.notificationUrl
      ],
      charges: [
        {
          reference_id: `charge-${data.referenceId}`,
          description: data.description || "Payment charge",
          amount: {
            value: parseInt((data.amount * 100).toFixed(0)),
            currency: "BRL"
          },
          payment_method: {
            type: "CREDIT_CARD",
            installments: 1,
            capture: true
          }
        }
      ],
      redirect_url: data.redirectUrl || config.webhook.redirectUrl,
      expires_at: data.expiresAt || this._getDefaultExpirationDate()
    };
  }
  
  _getDefaultPixExpirationDate() {
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24);
    return expirationDate.toISOString();
  }
  
  _getDefaultExpirationDate() {
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24);
    return expirationDate.toISOString();
  }

  _handleError(error) {
    if (error.code === 'ENOTFOUND') {
      console.error(`Network error connecting to PagBank API (${this.apiUrl}):`, error.message);
      throw new Error(`Network connection error. Unable to reach PagBank service at ${this.apiUrl}`);
    } else if (error.response) {
      console.error('PagBank API error:', error.response.status, JSON.stringify(error.response.data));
      throw new Error(`PagBank API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('PagBank API request error (no response):', error.message);
      throw new Error(`PagBank API request error: ${error.message}`);
    } else {
      console.error('Unexpected error during PagBank API call:', error.message);
      throw new Error(`PagBank API unexpected error: ${error.message}`);
    }
  }
}

module.exports = new PagBankService();