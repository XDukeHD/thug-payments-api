const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('../../config.json');

const dbPath = path.resolve(config.database.path);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
  } else {
    console.log('Connected to the SQLite database');
    initDatabase();
  }
});

function initDatabase() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_id TEXT UNIQUE,
      amount REAL NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      customer_name TEXT,
      customer_email TEXT,
      customer_document TEXT,
      customer_user_id TEXT,
      payment_method TEXT,
      payment_url TEXT,
      pagbank_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
  });
}

module.exports = db;