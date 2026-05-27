const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function initDB() {
  let lastError;
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      const client = await pool.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS invoices (
            id VARCHAR(50) PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            number VARCHAR(255) NOT NULL,
            date DATE,
            due_date DATE,
            client_name VARCHAR(255),
            client_email VARCHAR(255),
            client_address TEXT,
            line_items JSONB DEFAULT '[]',
            notes TEXT,
            template VARCHAR(50),
            accent_color VARCHAR(7),
            status VARCHAR(20) DEFAULT 'draft',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(user_id, number)
          )
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS settings (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            key VARCHAR(100) NOT NULL,
            value JSONB,
            UNIQUE(user_id, key)
          )
        `);

        console.log('Database initialized successfully');
        return;
      } finally {
        client.release();
      }
    } catch (err) {
      lastError = err;
      console.log(`Database connection attempt ${attempt}/10 failed, retrying in 3s...`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  throw lastError;
}

module.exports = { pool, initDB };
