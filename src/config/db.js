import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// N-jbdou l-URL d-dqa w7da mn Railway
const dbUrl = process.env.DATABASE_URL;

console.log(`\n🔍 [DEBUG] Connecting with DATABASE_URL...`);

// N-3tiw l-URL nichan l pool (Hwa kay-frez l-host o l-password rasso)
const pool = createPool(dbUrl);

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

    const alterQueries = [
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS category  VARCHAR(100) DEFAULT 'Other'`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT           DEFAULT NULL`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP      DEFAULT CURRENT_TIMESTAMP`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
    ];

    for (const q of alterQueries) {
      try { await conn.query(q); } catch (_) { /* column already exists, skip */ }
    }

    conn.release();
    console.log('✅ [DB] Connected to Railway MySQL perfectly!');
  } catch (err) {
    console.error('❌ [DB] Connection failed:', err.message);
    process.exit(1);
  }
};

initDB();