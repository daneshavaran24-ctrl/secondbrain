/**
 * اجرای migration روی دیتابیس
 * npm run migrate
 */
import 'dotenv/config';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import pool from './index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  console.log('⏳ Running database migration...');
  const sql = await readFile(path.join(__dirname, 'schema.sql'), 'utf8');

  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('✅ Migration completed successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
