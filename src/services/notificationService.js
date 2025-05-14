const axios = require('axios');
const config = require('../../config.json');

class NotificationService {
  constructor() {
    this.clientWebhookUrl = config.clientWebhook.url;
    this.enabled = config.clientWebhook.enabled;
    this.retryCount = config.clientWebhook.retryCount || 3;
    this.retryDelay = config.clientWebhook.retryDelay || 60000; 
  }

  /**
   * Envia uma notificação de mudança de status para o site do cliente
   * @param {string} referenceId - ID de referência do pagamento
   * @param {string} status - Status atual do pagamento (PAID, PENDING, CANCELED, etc)
   * @param {Object} paymentData - Dados adicionais do pagamento
   */
  async sendStatusUpdate(referenceId, status, paymentData = {}) {
    if (!this.enabled) {
      console.log('Client webhook notifications are disabled');
      return;
    }

    const notificationData = {
      event: "payment_status_changed",
      referenceId,
      status,
      statusMessage: this._mapStatusMessage(status),
      timestamp: new Date().toISOString(),
      payment: {
        ...paymentData,
        referenceId, 
        status
      }
    };

    let attempts = 0;
    let success = false;

    while (!success && attempts < this.retryCount) {
      try {
        console.log(`Sending notification to client webhook (attempt ${attempts + 1}):`, this.clientWebhookUrl);
        
        const response = await axios.post(this.clientWebhookUrl, notificationData, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'ThugPayments-API/1.0',
            'X-Notification-Event': 'payment_status_changed'
          },
          timeout: 10000 
        });

        if (response.status >= 200 && response.status < 300) {
          console.log('Client webhook notification sent successfully');
          success = true;
          return true;
        } else {
          throw new Error(`Unexpected status code: ${response.status}`);
        }
      } catch (error) {
        attempts++;
        console.error(`Error sending webhook notification (attempt ${attempts}/${this.retryCount}):`, error.message);
        
        if (attempts < this.retryCount) {
          console.log(`Retrying in ${this.retryDelay/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    if (!success) {
      console.error(`Failed to send webhook notification after ${this.retryCount} attempts`);
      return false;
    }
  }

  /**
   * Mapeia os status brutos para mensagens amigáveis
   */
  _mapStatusMessage(status) {
    if (!status) return 'UNKNOWN';
    
    const statusUpper = status.toUpperCase();
    
    switch (statusUpper) {
      case 'PAID':
      case 'COMPLETED':
      case 'APPROVED':
        return 'PAID';
      case 'PENDING':
      case 'IN_ANALYSIS':
      case 'WAITING':
        return 'PROCESSING';
      case 'DECLINED':
      case 'CANCELED':
      case 'REFUNDED':
        return 'CANCELED';
      default:
        return statusUpper;
    }
  }
}

module.exports = new NotificationService();