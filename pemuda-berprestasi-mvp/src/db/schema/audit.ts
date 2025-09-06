// src/db/schema/audit.ts
import { 
  int, 
  varchar, 
  mysqlTable, 
  datetime,
  json
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// Audit Log table
export const tbAuditLog = mysqlTable('tb_audit_log', {
  idLog: int('id_log').primaryKey().autoincrement(),
  idUser: int('id_user').notNull(),
  tabel: varchar('tabel', { length: 100 }).notNull(),
  aksi: varchar('aksi', { length: 100 }).notNull(),
  dataLama: json('data_lama'),
  dataBaru: json('data_baru'),
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// No relations needed for audit table - it's a standalone logging table