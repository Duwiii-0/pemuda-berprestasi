// src/db/schema/auth.ts
import { mysqlTable, int, varchar, mysqlEnum, index, datetime } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { jenisKelaminEnum } from './enums';

export const tbAkun = mysqlTable('tb_akun', {
  idAkun: int('id_akun').primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
});

export const tbAdmin = mysqlTable('tb_admin', {
  idAdmin: int('id_admin').primaryKey().autoincrement(),
  nama: varchar('nama', { length: 150 }).notNull(),
  idAkun: int('id_akun').unique().notNull(),
});

export const tbAdminKompetisi = mysqlTable('tb_admin_kompetisi', {
  idAdminKompetisi: int('id_admin_kompetisi').primaryKey().autoincrement(),
  idKompetisi: int('id_kompetisi').notNull(),
  nama: varchar('nama', { length: 150 }).notNull(),
  idAkun: int('id_akun').unique().notNull(),
}, (table) => ({
  idAkunIdx: index('tb_admin_kompetisi_id_akun_fkey').on(table.idAkun),
  idKompetisiIdx: index('tb_admin_kompetisi_id_kompetisi_fkey').on(table.idKompetisi),
}));

export const tbPelatih = mysqlTable('tb_pelatih', {
  idPelatih: int('id_pelatih').primaryKey().autoincrement(),
  namaPelatih: varchar('nama_pelatih', { length: 150 }).notNull(),
  noTelp: varchar('no_telp', { length: 15 }),
  fotoKtp: varchar('foto_ktp', { length: 255 }),
  nik: varchar('nik', { length: 16 }).unique().notNull(),
  tanggalLahir: datetime('tanggal_lahir'),
  jenisKelamin: mysqlEnum('jenis_kelamin', jenisKelaminEnum),
  provinsi: varchar('provinsi', { length: 100 }),
  kota: varchar('kota', { length: 100 }),
  alamat: varchar('alamat', { length: 100 }),
  sertifikatSabuk: varchar('sertifikat_sabuk', { length: 255 }),
  idAkun: int('id_akun').unique().notNull(),
  idDojang: int('id_dojang').notNull(),
});

// Relations
export const akunRelations = relations(tbAkun, ({ one }) => ({
  pelatih: one(tbPelatih, {
    fields: [tbAkun.idAkun],
    references: [tbPelatih.idAkun],
  }),
  admin: one(tbAdmin, {
    fields: [tbAkun.idAkun],
    references: [tbAdmin.idAkun],
  }),
  adminKompetisi: one(tbAdminKompetisi, {
    fields: [tbAkun.idAkun],
    references: [tbAdminKompetisi.idAkun],
  }),
}));

export const pelatihRelations = relations(tbPelatih, ({ one, many }) => ({
  akun: one(tbAkun, {
    fields: [tbPelatih.idAkun],
    references: [tbAkun.idAkun],
  }),
  dojang: one(tbDojang, {
    fields: [tbPelatih.idDojang],
    references: [tbDojang.idDojang],
  }),
  atletPembuat: many(tbAtlet, { relationName: 'AtletPembuat' }),
}));

export const adminKompetisiRelations = relations(tbAdminKompetisi, ({ one }) => ({
  akun: one(tbAkun, {
    fields: [tbAdminKompetisi.idAkun],
    references: [tbAkun.idAkun],
  }),
  kompetisi: one(tbKompetisi, {
    fields: [tbAdminKompetisi.idKompetisi],
    references: [tbKompetisi.idKompetisi],
  }),
}));

// Import types for relations
import { tbDojang } from './dojang';
import { tbAtlet } from './atlet';
import { tbKompetisi } from './kompetisi';