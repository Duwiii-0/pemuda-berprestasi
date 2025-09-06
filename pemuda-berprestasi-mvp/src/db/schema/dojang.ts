// src/db/schema/dojang.ts
import { 
  int, 
  varchar, 
  mysqlTable, 
  datetime
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Dojang table
export const tbDojang = mysqlTable('tb_dojang', {
  idDojang: int('id_dojang').primaryKey().autoincrement(),
  namaDojang: varchar('nama_dojang', { length: 150 }).notNull(),
  email: varchar('email', { length: 255 }),
  noTelp: varchar('no_telp', { length: 15 }),
  founder: varchar('founder', { length: 150 }),
  negara: varchar('negara', { length: 100 }),
  provinsi: varchar('provinsi', { length: 100 }),
  kota: varchar('kota', { length: 100 }),
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// Relations are defined in index.ts to avoid circular imports

// Import types for relations
import type { tbAtlet } from './atlet';
import type { tbPelatih } from './users';