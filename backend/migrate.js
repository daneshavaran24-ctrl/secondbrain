const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: 'postgresql://root:o7ZyTPq22lpoZMldGjZAkUxA@kilimanjaro.liara.cloud:32398/postgres',
  ssl: false
});

async function run() {
  const sql = fs.readFileSync('/project/backend/src/db/schema.sql', 'utf8');

  // Split by semicolon followed by newline or end of string
  const stmts = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && s.toUpperCase().includes('CREATE'));

  console.log(`Found ${stmts.length} CREATE statements`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const stmt of stmts) {
    try {
      await pool.query(stmt);
      // Extract table name for logging
      const match = stmt.match(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(\w+)/i);
      const tableName = match ? match[1] : '?';
      console.log(`✓ ${tableName}`);
      created++;
    } catch (err) {
      if (err.message.includes('already exists')) {
        skipped++;
      } else {
        const match = stmt.match(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(\w+)/i);
        const tableName = match ? match[1] : '?';
        console.log(`✗ ${tableName}: ${err.message}`);
        errors++;
      }
    }
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped (already exist), ${errors} errors`);
  await pool.end();
}

run().catch(console.error);
