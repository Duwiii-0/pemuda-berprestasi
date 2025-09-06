// src/db/schema/dojang.ts
import { mysqlTable, int, varchar, datetime } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const tbPenyelenggara = mysqlTable('tb_penyelenggara', {
  idPenyelenggara: int('id_penyelenggara').primaryKey().autoincrement(),
  namaPenyelenggara: varchar('nama_penyelenggara', { length: 150 }).notNull(),
  email: varchar('email', { length: 255 }),
  noTelp: varchar('no_telp', { length: 15 }),
});

export const tbDojang = mysqlTable('tb_dojang', {
  idDojang: int('id_dojang').primaryKey().autoincrement(),
  namaDojang: varchar('nama_dojang', { length: 150 }).notNull(),
  email: varchar('email', { length: 255 }),
  noTelp: varchar('no_telp', { length: 15 }),
  founder: varchar('founder', { length: 150 }),
  negara: varchar('negara', { length: 100 }),
  provinsi: varchar('provinsi', { length: 100 }),
  kota: varchar('kota', { length: 100 }),
  createdAt: datetime('created_at').default(new Date()),
  updatedAt: datetime('updated_at').default(new Date()),
});

// Relations
export const dojangRelations = relations(tbDojang, ({ many }) => ({
  pelatih: many(tbPelatih),
  atlet: many(tbAtlet),
}));

export const penyelenggaraRelations = relations(tbPenyelenggara, ({ many }) => ({
  kompetisi: many(tbKompetisi),
}));

// Import types for relations
import { tbPelatih } from './auth';
import { tbAtlet } from './atlet';
import { tbKompetisi } from './kompetisi';