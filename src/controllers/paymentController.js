const Payment = require('../models/payment');
const pagbankService = require('../services/pagbank');
const notificationService = require('../services/notificationService');
const config = require('../../config.json');

class PaymentController {
  async createCreditCardPayment(req, res) {
    try {
      const { 
        amount, 
        description, 
        customerName, 
        customerEmail, 
        customerDocument, 
        customerUserId, 
        card,
        installments 
      } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }
      
      if (!customerUserId) {
        return res.status(400).json({ error: 'Customer user ID is required' });
      }
      
      if (!card || !card.number || !card.expMonth || !card.expYear || !card.securityCode || !card.holderName) {
        return res.status(400).json({ error: 'Valid card information is required' });
      }
      
      const paymentRecord = await Payment.create({
        amount,
        description,
        customerName,
        customerEmail,
        customerDocument,
        customerUserId,
        paymentMethod: 'CREDIT_CARD',
        status: 'PENDING'
      });
      
      const paymentData = {
        referenceId: paymentRecord.referenceId,
        amount,
        description,
        customerName,
        customerEmail,
        customerDocument,
        customerUserId,
        card,
        installments
      };
      
      const pagbankResponse = await pagbankService.createCreditCardCharge(paymentData);
      
      let paymentUrl = null;
      if (pagbankResponse.links) {
        const receiptLink = pagbankResponse.links.find(link => link.rel === 'RECEIPT' || link.rel === 'RECEIPT_URL');
        if (receiptLink) {
          paymentUrl = receiptLink.href;
        }
      }
      
      await Payment.updateStatus(
        paymentRecord.referenceId, 
        pagbankResponse.status || 'PENDING', 
        paymentUrl,
        pagbankResponse.id
      );
      
      res.status(201).json({
        success: true,
        payment: {
          referenceId: paymentRecord.referenceId,
          amount,
          status: pagbankResponse.status || 'PENDING',
          chargeId: pagbankResponse.id,
          receiptUrl: paymentUrl
        }
      });
    } catch (error) {
      console.error('Error creating credit card payment:', error);
      res.status(500).json({ error: 'Failed to create credit card payment', message: error.message });
    }
  }
  
  async createPixPayment(req, res) {
    try {
      const { 
        amount, 
        description, 
        customerName, 
        customerEmail, 
        customerDocument, 
        customerUserId, 
        expirationHours 
      } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }
      
      if (!customerUserId) {
        return res.status(400).json({ error: 'Customer user ID is required' });
      }
      
      const paymentRecord = await Payment.create({
        amount,
        description,
        customerName,
        customerEmail,
        customerDocument,
        customerUserId,
        paymentMethod: 'PIX',
        status: 'PENDING'
      });
      
      let expirationDate = null;
      if (expirationHours) {
        expirationDate = new Date();
        expirationDate.setHours(expirationDate.getHours() + expirationHours);
        expirationDate = expirationDate.toISOString();
      }
      
      const paymentData = {
        referenceId: paymentRecord.referenceId,
        amount,
        description,
        customerName,
        customerEmail,
        customerDocument,
        customerUserId,
        expirationDate
      };
      
      const pagbankResponse = await pagbankService.createPixCharge(paymentData);
      
      const pixInfo = extractPixInfo(pagbankResponse);
      
      await Payment.updateStatus(
        paymentRecord.referenceId, 
        pagbankResponse.status || 'PENDING', 
        pixInfo.qrCodeImage,
        pagbankResponse.id
      );
      
      res.status(201).json({
        success: true,
        payment: {
          referenceId: paymentRecord.referenceId,
          amount,
          status: pagbankResponse.status || 'PENDING',
          orderId: pagbankResponse.id,
          pix: pixInfo
        }
      });
    } catch (error) {
      console.error('Error creating PIX payment:', error);
      res.status(500).json({ error: 'Failed to create PIX payment', message: error.message });
    }
  }
  
  async createCheckoutPayment(req, res) {
    try {
      const { 
        amount, 
        description, 
        customerName, 
        customerEmail, 
        customerDocument, 
        customerUserId, 
        enabledTypes,
        defaultType,
        expiresAt,
        redirectUrl
      } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }
      
      if (!customerUserId) {
        return res.status(400).json({ error: 'Customer user ID is required' });
      }
      
      const paymentRecord = await Payment.create({
        amount,
        description,
        customerName,
        customerEmail,
        customerDocument,
        customerUserId,
        paymentMethod: 'CHECKOUT',
        status: 'PENDING'
      });
      
      const paymentData = {
        referenceId: paymentRecord.referenceId,
        amount,
        description,
        customerName,
        customerEmail,
        customerDocument,
        customerUserId,
        enabledTypes,
        defaultType,
        expiresAt,
        redirectUrl
      };
      
      const pagbankResponse = await pagbankService.createCheckout(paymentData);
      
      let checkoutUrl = null;
      
      console.log('PagBank Checkout Response:', JSON.stringify(pagbankResponse, null, 2));
      
      if (pagbankResponse.links) {
        const checkoutLink = pagbankResponse.links.find(link => 
          link.rel === 'PAY' || 
          link.rel === 'CHECKOUT_URL' || 
          link.rel === 'PAYMENT_URL' || 
          link.href.includes('/checkout/') || 
          link.href.includes('/payment/')
        );
        
        if (checkoutLink) {
          checkoutUrl = checkoutLink.href;
        } else {
          checkoutUrl = pagbankResponse.links[0]?.href;
        }
      } else if (pagbankResponse.payment_url || pagbankResponse.checkoutUrl) {
        checkoutUrl = pagbankResponse.payment_url || pagbankResponse.checkoutUrl;
      }
      
      if (!checkoutUrl && pagbankResponse.id) {
        const baseUrl = config.pagbank.environment === 'sandbox' 
          ? 'https://sandbox.pagseguro.uol.com.br/checkout/' 
          : 'https://pagseguro.uol.com.br/checkout/';
        checkoutUrl = baseUrl + pagbankResponse.id;
      }
      
      await Payment.updateStatus(
        paymentRecord.referenceId, 
        'PENDING', 
        checkoutUrl,
        pagbankResponse.id
      );
      
      res.status(201).json({
        success: true,
        payment: {
          referenceId: paymentRecord.referenceId,
          amount,
          status: 'PENDING',
          checkoutId: pagbankResponse.id,
          checkoutUrl: checkoutUrl
        }
      });
    } catch (error) {
      console.error('Error creating checkout payment:', error);
      res.status(500).json({ error: 'Failed to create checkout payment', message: error.message });
    }
  }
  
  async getPaymentStatus(req, res) {
    try {
      const { referenceId } = req.params;
      
      const payment = await Payment.getByReferenceId(referenceId);
      
      if (payment.pagbank_id) {
        try {
          let pagbankStatus;
          
          if (payment.payment_method === 'PIX') {
            pagbankStatus = await pagbankService.getOrderStatus(payment.pagbank_id);
          } else {
            pagbankStatus = await pagbankService.getChargeStatus(payment.pagbank_id);
          }
          
          if (pagbankStatus && pagbankStatus.status !== payment.status) {
            await Payment.updateStatus(referenceId, pagbankStatus.status);
            payment.status = pagbankStatus.status;
          }
        } catch (error) {
          console.warn(`Failed to get updated status from PagBank: ${error.message}`);
        }
      }
      
      let statusMessage = mapStatusMessage(payment.status);
      
      res.json({
        success: true,
        payment: {
          referenceId: payment.reference_id,
          amount: payment.amount,
          description: payment.description,
          status: payment.status,
          statusMessage,
          customerName: payment.customer_name,
          customerEmail: payment.customer_email,
          customerDocument: payment.customer_document,
          customerUserId: payment.customer_user_id,
          paymentMethod: payment.payment_method,
          paymentUrl: payment.payment_url,
          createdAt: payment.created_at,
          updatedAt: payment.updated_at
        }
      });
    } catch (error) {
      console.error('Error getting payment status:', error);
      res.status(404).json({ error: 'Payment not found', message: error.message });
    }
  }
  
  async getUserPayments(req, res) {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      const payments = await Payment.getByUserId(userId, limit, offset);
      
      res.json({
        success: true,
        count: payments.length,
        payments: payments.map(payment => ({
          referenceId: payment.reference_id,
          amount: payment.amount,
          description: payment.description,
          status: payment.status,
          statusMessage: mapStatusMessage(payment.status),
          customerName: payment.customer_name,
          customerEmail: payment.customer_email,
          customerDocument: payment.customer_document,
          customerUserId: payment.customer_user_id,
          paymentMethod: payment.payment_method,
          paymentUrl: payment.payment_url,
          createdAt: payment.created_at,
          updatedAt: payment.updated_at
        }))
      });
    } catch (error) {
      console.error('Error getting user payments:', error);
      res.status(500).json({ error: 'Failed to get user payments', message: error.message });
    }
  }
  
  async getAllPayments(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;
      
      const payments = await Payment.getAll(limit, offset);
      
      res.json({
        success: true,
        count: payments.length,
        payments: payments.map(payment => ({
          referenceId: payment.reference_id,
          amount: payment.amount,
          description: payment.description,
          status: payment.status,
          statusMessage: mapStatusMessage(payment.status),
          customerName: payment.customer_name,
          customerEmail: payment.customer_email,
          customerDocument: payment.customer_document,
          customerUserId: payment.customer_user_id,
          paymentMethod: payment.payment_method,
          paymentUrl: payment.payment_url,
          createdAt: payment.created_at,
          updatedAt: payment.updated_at
        }))
      });
    } catch (error) {
      console.error('Error getting payments:', error);
      res.status(500).json({ error: 'Failed to get payments', message: error.message });
    }
  }
  
  async getPaymentsByStatus(req, res) {
    try {
      const { status } = req.params;
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;
      
      if (!status) {
        return res.status(400).json({ error: 'Status parameter is required' });
      }
      
      const payments = await Payment.getByStatus(status.toUpperCase(), limit, offset);
      
      res.json({
        success: true,
        count: payments.length,
        status,
        payments: payments.map(payment => ({
          referenceId: payment.reference_id,
          amount: payment.amount,
          description: payment.description,
          status: payment.status,
          statusMessage: mapStatusMessage(payment.status),
          customerName: payment.customer_name,
          customerEmail: payment.customer_email,
          customerDocument: payment.customer_document,
          customerUserId: payment.customer_user_id,
          paymentMethod: payment.payment_method,
          paymentUrl: payment.payment_url,
          createdAt: payment.created_at,
          updatedAt: payment.updated_at
        }))
      });
    } catch (error) {
      console.error('Error getting payments by status:', error);
      res.status(500).json({ error: 'Failed to get payments by status', message: error.message });
    }
  }
  
  async webhookHandler(req, res) {
    try {
      const { id, reference_id, status } = req.body;
      
      if (!reference_id || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      await Payment.updateStatus(reference_id, status);
      
      const payment = await Payment.getByReferenceId(reference_id);
      
      if (payment) {
        const paymentForNotification = {
          referenceId: payment.reference_id,
          transactionId: payment.pagbank_id,
          amount: payment.amount,
          description: payment.description,
          customerUserId: payment.customer_user_id,
          paymentMethod: payment.payment_method,
          updatedAt: new Date().toISOString()
        };
        
        notificationService.sendStatusUpdate(reference_id, status, paymentForNotification)
          .catch(err => console.error('Error sending client notification:', err.message));
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Failed to process webhook', message: error.message });
    }
  }
  
  async notificationHandler(req, res) {
    try {
      console.log('PagBank notification received:', JSON.stringify(req.body));
      
      const notification = req.body;
      
      if (!notification || !notification.data || !notification.data.id) {
        console.warn('Invalid notification format:', JSON.stringify(notification));
        return res.status(400).json({ 
          error: 'Invalid notification format',
          message: 'The notification does not contain required data'
        });
      }
      
      const notificationType = notification.event.type || 'unknown';
      const resourceId = notification.data.id;
      let paymentData;
      
      try {
        if (resourceId.startsWith('ORDE_') || notificationType.includes('ORDER')) {
          paymentData = await pagbankService.getOrderStatus(resourceId);
        } else if (resourceId.startsWith('CHAR_') || notificationType.includes('CHARGE')) {
          paymentData = await pagbankService.getChargeStatus(resourceId);
        } else {
          try {
            paymentData = await pagbankService.getChargeStatus(resourceId);
          } catch (error) {
            paymentData = await pagbankService.getOrderStatus(resourceId);
          }
        }
      } catch (error) {
        console.error('Error fetching payment details from PagBank:', error);
        return res.status(200).json({ 
          success: true,
          message: 'Notification received but failed to fetch details' 
        });
      }
      
      if (!paymentData || !paymentData.reference_id) {
        console.error('Payment data does not contain reference_id:', JSON.stringify(paymentData));
        return res.status(200).json({ 
          success: true,
          message: 'Notification received but reference_id not found' 
        });
      }
      
      const referenceId = paymentData.reference_id;
      const status = paymentData.status;
      
      await Payment.updateStatus(referenceId, status);
      console.log(`Payment ${referenceId} updated to status ${status}`);

      const payment = await Payment.getByReferenceId(referenceId);
      
      if (payment) {
        const paymentForNotification = {
          referenceId: payment.reference_id,
          transactionId: payment.pagbank_id,
          amount: payment.amount,
          description: payment.description,
          customerUserId: payment.customer_user_id,
          paymentMethod: payment.payment_method,
          updatedAt: new Date().toISOString()
        };
        
        notificationService.sendStatusUpdate(referenceId, status, paymentForNotification)
          .catch(err => console.error('Error sending client notification:', err.message));
      }
      
      return res.status(200).json({ 
        success: true,
        message: 'Payment status updated successfully'
      });
    } catch (error) {
      console.error('Error processing PagBank notification:', error);
      return res.status(200).json({ 
        success: true,
        message: 'Notification received but error during processing'
      });
    }
  }
  
  async getPaymentByTransactionId(req, res) {
    try {
      const { transactionId } = req.params;
      
      if (!transactionId) {
        return res.status(400).json({ 
          error: 'Missing transaction ID',
          message: 'Transaction ID is required'
        });
      }
      
      const payment = await Payment.getByPagbankId(transactionId);
      
      if (!payment) {
        return res.status(404).json({ 
          error: 'Transaction not found',
          message: `No payment found with transaction ID: ${transactionId}` 
        });
      }
      
      if (payment.pagbank_id) {
        try {
          let pagbankStatus;
          
          if (payment.payment_method === 'PIX') {
            pagbankStatus = await pagbankService.getOrderStatus(payment.pagbank_id);
          } else {
            pagbankStatus = await pagbankService.getChargeStatus(payment.pagbank_id);
          }
          
          if (pagbankStatus && pagbankStatus.status !== payment.status) {
            await Payment.updateStatus(payment.reference_id, pagbankStatus.status);
            payment.status = pagbankStatus.status;
          }
        } catch (error) {
          console.warn(`Failed to get updated status from PagBank: ${error.message}`);
        }
      }
      
      const statusMessage = mapStatusMessage(payment.status);
      
      res.json({
        success: true,
        payment: {
          referenceId: payment.reference_id,
          transactionId: payment.pagbank_id,
          amount: payment.amount,
          description: payment.description,
          status: payment.status,
          statusMessage,
          customerName: payment.customer_name,
          customerEmail: payment.customer_email,
          customerDocument: payment.customer_document,
          customerUserId: payment.customer_user_id,
          paymentMethod: payment.payment_method,
          paymentUrl: payment.payment_url,
          createdAt: payment.created_at,
          updatedAt: payment.updated_at
        }
      });
    } catch (error) {
      console.error('Error getting payment by transaction ID:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve payment information',
        message: error.message
      });
    }
  }
}

function extractPixInfo(response) {
  let qrCode = null;
  let qrCodeImage = null;
  let expirationDate = null;
  
  if (response.qr_codes && response.qr_codes.length > 0) {
    const qrCodeData = response.qr_codes[0];
    qrCode = qrCodeData.text || null;
    expirationDate = qrCodeData.expiration_date || null;
    
    if (qrCodeData.links && qrCodeData.links.length > 0) {
      const pngLink = qrCodeData.links.find(link => 
        link.rel === 'QRCODE.PNG' || 
        (link.media === 'image/png' && 
         (link.rel === 'QRCODE' || link.rel === 'QR_CODE' || link.rel === 'qrcode'))
      );
      
      if (pngLink) {
        qrCodeImage = pngLink.href;
      }
    }
  }
  
  if (qrCodeImage === null && response.qr_codes && response.qr_codes.length > 0) {
    const qrCodeData = response.qr_codes[0];
    if (qrCodeData.links && qrCodeData.links.length > 0) {
      const anyImageLink = qrCodeData.links.find(link => 
        link.media === 'image/png' || link.href.includes('.png') || link.href.includes('/png')
      );
      
      if (anyImageLink) {
        qrCodeImage = anyImageLink.href;
      }
    }
  }
  
  console.log('QR Code response:', {
    qrCode: qrCode ? 'Present (length: ' + qrCode.length + ')' : 'Not found',
    qrCodeImage: qrCodeImage || 'Not found',
    expirationDate: expirationDate || 'Not found'
  });
  
  return {
    qrCode,
    qrCodeImage,
    copyPaste: qrCode,
    expirationDate
  };
}

function mapStatusMessage(status) {
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

PaymentController.prototype._mapStatusMessage = mapStatusMessage;

module.exports = new PaymentController();