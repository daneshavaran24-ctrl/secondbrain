import pg from 'pg';
const { Pool } = pg;

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: false }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'brainforge',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
      }
);

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err.message);
});

/**
 * Execute a single query
 * @param {string} text
 * @param {any[]} [params]
 */
export async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

/**
 * Get a client for transactions
 */
export async function getClient() {
  const client = await pool.connect();
  return client;
}

export default pool;
