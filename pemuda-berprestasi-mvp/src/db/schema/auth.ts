// src/db/schema/auth.ts
import { 
  int, 
  varchar, 
  mysqlTable, 
  unique,
  index 
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// Auth/Account table
export const tbAkun = mysqlTable('tb_akun', {
  idAkun: int('id_akun').primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
});

// Admin table  
export const tbAdmin = mysqlTable('tb_admin', {
  idAdmin: int('id_admin').primaryKey().autoincrement(),
  nama: varchar('nama', { length: 150 }).notNull(),
  idAkun: int('id_akun').notNull().unique(),
});

// Admin Kompetisi table
export const tbAdminKompetisi = mysqlTable('tb_admin_kompetisi', {
  idAdminKompetisi: int('id_admin_kompetisi').primaryKey().autoincrement(),
  idKompetisi: int('id_kompetisi').notNull(),
  nama: varchar('nama', { length: 150 }).notNull(),
  idAkun: int('id_akun').notNull().unique(),
}, (table) => ({
  idAkunIdx: index('tb_admin_kompetisi_id_akun_fkey').on(table.idAkun),
  idKompetisiIdx: index('tb_admin_kompetisi_id_kompetisi_fkey').on(table.idKompetisi),
}));

// Relations are defined in index.ts to avoid circular imports

// Import types for relations (will be defined in other files)
import type { tbPelatih } from './users';
import type { tbKompetisi } from './kompetisi';