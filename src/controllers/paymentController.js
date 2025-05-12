const Payment = require('../models/payment');
const pagbankService = require('../services/pagbank');

class PaymentController {
  async createPayment(req, res) {
    try {
      const { amount, description, customerName, customerEmail, customerDocument, customerUserId, paymentMethod } = req.body;
      
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
        paymentMethod,
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
        paymentMethod
      };
      
      const pagbankResponse = await pagbankService.createCharge(paymentData);
      
      await Payment.updateStatus(
        paymentRecord.referenceId, 
        pagbankResponse.status || 'PENDING', 
        pagbankResponse.payment_url || pagbankResponse.links?.find(link => link.rel === 'PAYMENT')?.href,
        pagbankResponse.id
      );
      
      res.status(201).json({
        success: true,
        payment: {
          referenceId: paymentRecord.referenceId,
          amount,
          status: pagbankResponse.status || 'PENDING',
          paymentUrl: pagbankResponse.payment_url || pagbankResponse.links?.find(link => link.rel === 'PAYMENT')?.href
        }
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({ error: 'Failed to create payment', message: error.message });
    }
  }
  
  async createPixPayment(req, res) {
    try {
      const { amount, description, customerName, customerEmail, customerDocument, customerUserId, expirationHours } = req.body;
      
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
        expirationDate
      };
      
      const pagbankResponse = await pagbankService.createPixCharge(paymentData);
      
      const pixInfo = {
        qrCode: pagbankResponse.qr_codes?.[0]?.text || null,
        qrCodeImage: pagbankResponse.qr_codes?.[0]?.links?.find(link => link.media === 'image/png')?.href || null,
        copyPaste: pagbankResponse.qr_codes?.[0]?.text || null,
        expirationDate: pagbankResponse.payment_method?.expiration_date || null
      };
      
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
          pix: pixInfo
        }
      });
    } catch (error) {
      console.error('Error creating PIX payment:', error);
      res.status(500).json({ error: 'Failed to create PIX payment', message: error.message });
    }
  }
  
  async getPaymentStatus(req, res) {
    try {
      const { referenceId } = req.params;
      
      const payment = await Payment.getByReferenceId(referenceId);
      
      if (payment.pagbank_id) {
        const pagbankStatus = await pagbankService.getChargeStatus(payment.pagbank_id);
        
        if (pagbankStatus && pagbankStatus.status !== payment.status) {
          await Payment.updateStatus(referenceId, pagbankStatus.status);
          payment.status = pagbankStatus.status;
        }
      }
      
      let statusMessage = 'Unknown';
      switch (payment.status?.toUpperCase()) {
        case 'PAID':
        case 'COMPLETED':
        case 'APPROVED':
          statusMessage = 'PAID';
          break;
        case 'PENDING':
        case 'IN_ANALYSIS':
        case 'WAITING':
          statusMessage = 'PROCESSING';
          break;
        case 'DECLINED':
        case 'CANCELED':
        case 'REFUNDED':
          statusMessage = 'CANCELED';
          break;
        default:
          statusMessage = payment.status || 'UNKNOWN';
      }
      
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
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Failed to process webhook', message: error.message });
    }
  }
}

module.exports = new PaymentController();