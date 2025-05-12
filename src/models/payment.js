const db = require('./database');
const { v4: uuidv4 } = require('uuid');

class Payment {
  static create(paymentData) {
    return new Promise((resolve, reject) => {
      const referenceId = uuidv4();
      const { amount, description, status, customerName, customerEmail, customerDocument, customerUserId, paymentMethod } = paymentData;
      
      const sql = `INSERT INTO payments (reference_id, amount, description, status, customer_name, customer_email, customer_document, customer_user_id, payment_method) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
      db.run(sql, [referenceId, amount, description, status || 'PENDING', customerName, customerEmail, customerDocument, customerUserId, paymentMethod], function(err) {
        if (err) {
          return reject(err);
        }
        resolve({ id: this.lastID, referenceId });
      });
    });
  }

  static updateStatus(referenceId, status, paymentUrl = null, pagbankId = null) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE payments SET status = ?, payment_url = ?, pagbank_id = ?, updated_at = CURRENT_TIMESTAMP 
                   WHERE reference_id = ?`;
      
      db.run(sql, [status, paymentUrl, pagbankId, referenceId], function(err) {
        if (err) {
          return reject(err);
        }
        
        if (this.changes === 0) {
          return reject(new Error('Payment not found'));
        }
        
        resolve({ success: true, changes: this.changes });
      });
    });
  }

  static getByReferenceId(referenceId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM payments WHERE reference_id = ?';
      
      db.get(sql, [referenceId], (err, row) => {
        if (err) {
          return reject(err);
        }
        
        if (!row) {
          return reject(new Error('Payment not found'));
        }
        
        resolve(row);
      });
    });
  }

  static getAll(limit = 100, offset = 0) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM payments ORDER BY created_at DESC LIMIT ? OFFSET ?';
      
      db.all(sql, [limit, offset], (err, rows) => {
        if (err) {
          return reject(err);
        }
        
        resolve(rows);
      });
    });
  }

  static getByUserId(userId, limit = 100, offset = 0) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM payments WHERE customer_user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?';
      
      db.all(sql, [userId, limit, offset], (err, rows) => {
        if (err) {
          return reject(err);
        }
        
        resolve(rows);
      });
    });
  }

  static getByStatus(status, limit = 100, offset = 0) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM payments WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?';
      
      db.all(sql, [status, limit, offset], (err, rows) => {
        if (err) {
          return reject(err);
        }
        
        resolve(rows);
      });
    });
  }
}

module.exports = Payment;