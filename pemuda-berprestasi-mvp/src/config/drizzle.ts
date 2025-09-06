// src/config/drizzle.ts - ALTERNATIVE SIMPLE VERSION
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../db/schema/index';

// Simple connection configuration that should work
const connection = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pemuda_berprestasi',
  port: parseInt(process.env.DB_PORT || '3306'),
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  waitForConnections: true,
  queueLimit: 0,
});

// Or if you prefer to use the DATABASE_URL (simpler approach)
// const connection = mysql.createPool(process.env.DATABASE_URL!);

// Initialize Drizzle with the connection pool
export const db = drizzle(connection, {
  schema,
  mode: 'default',
});

// Export connection for raw queries if needed
export { connection };

// Type export for TypeScript
export type Database = typeof db;