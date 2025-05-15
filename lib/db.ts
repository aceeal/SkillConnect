// src/lib/db.ts
import mysql from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';

// Use environment variables for database config
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '123456',
  database: process.env.MYSQL_DATABASE || 'skillconnect',
};

// Connection pool
let pool: Pool | null = null;  // Explicitly typed as Pool or null

// Initialize pool
export const getPool = async () => {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
    console.log('Database pool created');
  }
  return pool;
};

// Execute database queries
export async function executeQuery({ query, values = [] }: { query: string, values?: any[] }) {
  try {
    const dbPool = await getPool();
    const [results] = await dbPool.execute(query, values);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Legacy connection function (for backward compatibility)
export async function connectToDatabase() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected to the database');
    return connection;
  } catch (err) {
    console.error('Error connecting to the database:', err);
    throw err;
  }
}