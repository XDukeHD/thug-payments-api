const { v4: uuidv4 } = require('uuid');
const db = require('./database');

class Payment {
  /**
   * Cria um novo registro de pagamento
   */
  static async create({ amount, description, customerName, customerEmail, customerDocument, customerUserId, paymentMethod, status }) {
    const referenceId = uuidv4();
    
    const payment = {
      reference_id: referenceId,
      amount,
      description: description || '',
      customer_name: customerName || '',
      customer_email: customerEmail || '',
      customer_document: customerDocument || '',
      customer_user_id: customerUserId || '',
      payment_method: paymentMethod || '',
      status: status || 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await db.insertPayment(payment);
    
    return {
      referenceId: payment.reference_id,
      ...payment
    };
  }
  
  /**
   * Atualiza o status de um pagamento
   */
  static async updateStatus(referenceId, status, paymentUrl = null, pagbankId = null) {
    const updates = {
      status: status || 'PENDING',
      updated_at: new Date().toISOString()
    };
    
    if (paymentUrl) {
      updates.payment_url = paymentUrl;
    }
    
    if (pagbankId) {
      updates.pagbank_id = pagbankId;
    }
    
    await db.updatePaymentByReferenceId(referenceId, updates);
  }
  
  /**
   * Busca um pagamento pelo ID de referência
   */
  static async getByReferenceId(referenceId) {
    return await db.getPaymentByReferenceId(referenceId);
  }
  
  /**
   * Busca pagamentos pelo ID do usuário
   */
  static async getByUserId(userId, limit = 100, offset = 0) {
    return await db.getPaymentsByUserId(userId, limit, offset);
  }
  
  /**
   * Busca todos os pagamentos
   */
  static async getAll(limit = 100, offset = 0) {
    return await db.getAllPayments(limit, offset);
  }
  
  /**
   * Busca pagamentos por status
   */
  static async getByStatus(status, limit = 100, offset = 0) {
    return await db.getPaymentsByStatus(status, limit, offset);
  }
  
  /**
   * Busca pagamento pelo ID do PagBank
   */
  static async getByPagbankId(pagbankId) {
    return await db.getPaymentByPagbankId(pagbankId);
  }
}

module.exports = Payment;