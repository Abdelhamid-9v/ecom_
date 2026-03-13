import { createPool } from 'mariadb';
import dotenv from 'dotenv';

dotenv.config();

// 1. Nqiyou l-variables mn ay espace zayed (Trim)
const host = process.env.DB_HOST ? process.env.DB_HOST.trim() : 'localhost';
const port = process.env.DB_PORT ? Number(process.env.DB_PORT.trim()) : 3306;
const user = process.env.DB_USER ? process.env.DB_USER.trim() : 'root';
const password = process.env.DB_PASSWORD ? process.env.DB_PASSWORD.trim() : '';
const database = process.env.DB_NAME ? process.env.DB_NAME.trim() : 'railway';

// 2. N-tb3o l-m3lomat f l-Logs bach n-choufouhom b 3inina
console.log(`\n🔍 [DEBUG] Trying to connect to DB...`);
console.log(`➡️ Host: "${host}"`);
console.log(`➡️ Port: ${port}`);
console.log(`➡️ User: "${user}"`);
console.log(`➡️ DB Name: "${database}"\n`);

const pool = createPool({
  host: host,
  port: port,
  user: user,
  password: password,
  database: database,
  connectionLimit: 5,
  connectTimeout: 15000 // Zidna f l-wqt dyal Timeout bach n-3tiwh l-khatr
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
    console.log('✅ [DB] Connected & table ready.');
  } catch (err) {
    console.error('❌ [DB] Connection failed:', err.message);
    process.exit(1);
  }
};

initDB();