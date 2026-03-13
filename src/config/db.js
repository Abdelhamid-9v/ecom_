import { createPool } from 'mariadb';
import dotenv from 'dotenv';

dotenv.config();

const pool = createPool({
  host:            process.env.DB_HOST,
  port:            process.env.DB_PORT,
  user:            process.env.DB_USER,
  password:        process.env.DB_PASSWORD,
  database:        process.env.DB_NAME,
  connectionLimit: 5,
  
});

export default pool;

// ─── Auto-create table if it doesn't exist ───────────────────────────────────
const initDB = async () => {
  try {
    const conn = await pool.getConnection();

    await conn.query(`
      CREATE TABLE IF NOT EXISTS products (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        name           VARCHAR(255)   NOT NULL,
        purchase_price DECIMAL(10, 2) NOT NULL,
        quantity       INT            NOT NULL DEFAULT 0,
        category       VARCHAR(100)   DEFAULT 'Other',
        image_url      TEXT           DEFAULT NULL,
        created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
        updated_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Add columns if upgrading from old schema (safe to run multiple times)
    const alterQueries = [
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS category  VARCHAR(100) DEFAULT 'Other'`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT         DEFAULT NULL`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
    ];

    for (const q of alterQueries) {
      try { await conn.query(q); } catch (_) { /* column already exists, skip */ }
    }

    conn.release();
    console.log('✅ [DB] Connected & table ready.');
  } catch (err) {
    console.error('❌ [DB] Connection failed:', err.message);
    process.exit(1); // crash early so you know immediately
  }
};

initDB();