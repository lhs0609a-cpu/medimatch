import { Pool } from 'pg';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://medimatch:medimatch_password@localhost:5432/medimatch',
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Query error', { text, error });
    throw error;
  }
}

export async function getClient() {
  const client = await pool.connect();
  return client;
}

export default pool;
