const sqlite3 = require('sqlite3').verbose();
const config = require('../../config.json');
const path = require('path');

class Database {
  constructor() {
    this.dbPath = path.resolve(config.database.path);
    this.db = null;
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, async (err) => {
        if (err) {
          console.error('Could not connect to database', err);
          return reject(err);
        }
        
        console.log('Connected to database at ' + this.dbPath);
        try {
          await this.createTables();
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  async createTables() {
    const sql = `
      CREATE TABLE IF NOT EXISTS payments (
        reference_id TEXT PRIMARY KEY,
        pagbank_id TEXT,
        amount REAL NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        customer_name TEXT,
        customer_email TEXT,
        customer_document TEXT,
        customer_user_id TEXT,
        payment_method TEXT,
        payment_url TEXT,
        created_at TEXT,
        updated_at TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_payments_pagbank_id ON payments(pagbank_id);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
      CREATE INDEX IF NOT EXISTS idx_payments_customer_user_id ON payments(customer_user_id);
    `;
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) {
          console.error('Error creating tables', err);
          return reject(err);
        }
        resolve();
      });
    });
  }

  async insertPayment(payment) {
    const sql = `
      INSERT INTO payments (
        reference_id, amount, description, status, 
        customer_name, customer_email, customer_document, customer_user_id,
        payment_method, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      payment.reference_id,
      payment.amount,
      payment.description,
      payment.status,
      payment.customer_name,
      payment.customer_email,
      payment.customer_document,
      payment.customer_user_id,
      payment.payment_method,
      payment.created_at,
      payment.updated_at
    ];
    
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Error inserting payment', err);
          return reject(err);
        }
        resolve(this.lastID);
      });
    });
  }

  async updatePaymentByReferenceId(referenceId, updates) {
    const updateFields = Object.keys(updates)
      .map(field => {
        const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
        return `${dbField} = ?`;
      })
      .join(', ');
    
    const sql = `UPDATE payments SET ${updateFields} WHERE reference_id = ?`;
    
    const params = [...Object.values(updates), referenceId];
    
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error(`Error updating payment ${referenceId}`, err);
          return reject(err);
        }
        resolve(this.changes);
      });
    });
  }

  async getPaymentByReferenceId(referenceId) {
    const sql = `SELECT * FROM payments WHERE reference_id = ? LIMIT 1`;
    
    return new Promise((resolve, reject) => {
      this.db.get(sql, [referenceId], (err, row) => {
        if (err) {
          console.error(`Error getting payment ${referenceId}`, err);
          return reject(err);
        }
        resolve(row || null);
      });
    });
  }

  async getPaymentsByUserId(userId, limit = 100, offset = 0) {
    const sql = `
      SELECT * FROM payments 
      WHERE customer_user_id = ? 
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    return new Promise((resolve, reject) => {
      this.db.all(sql, [userId, limit, offset], (err, rows) => {
        if (err) {
          console.error(`Error getting payments for user ${userId}`, err);
          return reject(err);
        }
        resolve(rows || []);
      });
    });
  }

  async getAllPayments(limit = 100, offset = 0) {
    const sql = `
      SELECT * FROM payments 
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    return new Promise((resolve, reject) => {
      this.db.all(sql, [limit, offset], (err, rows) => {
        if (err) {
          console.error('Error getting all payments', err);
          return reject(err);
        }
        resolve(rows || []);
      });
    });
  }

  async getPaymentsByStatus(status, limit = 100, offset = 0) {
    const sql = `
      SELECT * FROM payments 
      WHERE status = ? 
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    return new Promise((resolve, reject) => {
      this.db.all(sql, [status, limit, offset], (err, rows) => {
        if (err) {
          console.error(`Error getting payments with status ${status}`, err);
          return reject(err);
        }
        resolve(rows || []);
      });
    });
  }
  
  /**
   * Busca um pagamento pelo ID do PagBank
   */
  async getPaymentByPagbankId(pagbankId) {
    const sql = `SELECT * FROM payments WHERE pagbank_id = ? LIMIT 1`;
    
    return new Promise((resolve, reject) => {
      this.db.get(sql, [pagbankId], (err, row) => {
        if (err) {
          console.error(`Error getting payment by PagBank ID ${pagbankId}`, err);
          return reject(err);
        }
        resolve(row || null);
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database connection', err);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

const database = new Database();

database.initialize()
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

module.exports = database;