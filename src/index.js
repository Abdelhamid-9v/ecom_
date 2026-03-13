import app from './app.js';
import dotenv from 'dotenv';
import './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 [SERVER] GearGrid Pro API running on port ${PORT}`);
  console.log(`📦 [DB]     Connected to MariaDB — ${process.env.DB_NAME}\n`);
});