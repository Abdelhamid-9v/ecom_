import app from './app.js';
import dotenv from 'dotenv';
import './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`\n🚀 [SERVER] GearGrid Pro API running on http://localhost:${PORT}`);
  console.log(`📦 [DB]     Connected to MariaDB — ${process.env.DB_NAME}\n`);
});