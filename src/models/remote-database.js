const mysql = require('mysql2/promise');
const config = require('../../config.json');
const path = require('path');

const dbConfig = {
  host: config.remoteDatabase.host,
  user: config.remoteDatabase.user,
  password: config.remoteDatabase.password,
  database: config.remoteDatabase.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;

async function init() {
  try {
    if (pool) {
      console.log('Database connection pool already initialized');
      return pool;
    }

    pool = mysql.createPool(dbConfig);
    
    const connection = await pool.getConnection();
    console.log('MySQL Database connection established successfully');
    
    const [rows] = await connection.query('SELECT VERSION() as version');
    console.log(`Connected to MySQL server version: ${rows[0].version}`);
    
    connection.release();
    return pool;
  } catch (error) {
    console.error('Failed to initialize MySQL connection:', error);
    throw error;
  }
}

async function query(sql, params = []) {
  try {
    if (!pool) {
      await init();
    }
    
    const [results] = await pool.query(sql, params);
    return results;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}

async function close() {
  try {
    if (pool) {
      await pool.end();
      console.log('Database connection pool closed');
      pool = null;
    }
  } catch (error) {
    console.error('Error closing database connection pool:', error);
    throw error;
  }
}

module.exports = {
  init,
  query,
  close,
  getPool: () => pool
};