// src/config/drizzle.ts - FIXED VERSION
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../db/schema/index';

// Create MySQL connection pool
const connection = mysql.createPool({
  uri: process.env.DATABASE_URL!,
  // Optional: Add connection pool settings
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
});

// Initialize Drizzle with the connection pool
export const db = drizzle(connection, {
  schema,
  mode: 'default',
});

// Export connection for raw queries if needed
export { connection };

// Type export for TypeScript
export type Database = typeof db;