// src/db/schema/atlet.ts
import { mysqlTable, int, varchar, datetime, float, boolean, mysqlEnum, index } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { jenisKelaminEnum, statusPendaftaranEnum } from './enums';

export const tbAtlet = mysqlTable('tb_atlet', {
  idAtlet: int('id_atlet').primaryKey().autoincrement(),
  namaAtlet: varchar('nama_atlet', { length: 150 }).notNull(),
  tanggalLahir: datetime('tanggal_lahir').notNull(),
  nik: varchar('nik', { length: 16 }).notNull(),
  beratBadan: float('berat_badan').notNull(),
  provinsi: varchar('provinsi', { length: 100 }).notNull(),
  kota: varchar('kota', { length: 100 }),
  belt: varchar('belt', { length: 50 }).notNull(),
  alamat: varchar('alamat', { length: 255 }),
  noTelp: varchar('no_telp', { length: 15 }),
  tinggiBadan: float('tinggi_badan').notNull(),
  jenisKelamin: mysqlEnum('jenis_kelamin', jenisKelaminEnum).notNull(),
  umur: int('umur'),
  idDojang: int('id_dojang').notNull(),
  idPelatihPembuat: int('id_pelatih_pembuat').notNull(),
  
  // Documents
  akteKelahiran: varchar('akte_kelahiran', { length: 255 }),
  pasFoto: varchar('pas_foto', { length: 255 }),
  sertifikatBelt: varchar('sertifikat_belt', { length: 255 }),
  ktp: varchar('ktp', { length: 255 }),
}, (table) => ({
  idDojangIdx: index('tb_atlet_id_dojang_idx').on(table.idDojang),
  idPelatihPembuatIdx: index('tb_atlet_id_pelatih_pembuat_idx').on(table.idPelatihPembuat),
}));

export const tbPesertaTim = mysqlTable('tb_peserta_tim', {
  id: int('id').primaryKey().autoincrement(),
  idPesertaKompetisi: int('id_peserta_kompetisi').notNull(),
  idAtlet: int('id_atlet').notNull(),
}, (table) => ({
  idPesertaKompetisiIdx: index('tb_peserta_tim_id_peserta_kompetisi_idx').on(table.idPesertaKompetisi),
  idAtletIdx: index('tb_peserta_tim_id_atlet_idx').on(table.idAtlet),
}));

export const tbPesertaKompetisi = mysqlTable('tb_peserta_kompetisi', {
  idPesertaKompetisi: int('id_peserta_kompetisi').primaryKey().autoincrement(),
  idAtlet: int('id_atlet'), // null jika tim
  idKelasKejuaraan: int('id_kelas_kejuaraan').notNull(),
  isTeam: boolean('is_team').default(false).notNull(),
  status: mysqlEnum('status', statusPendaftaranEnum).default('PENDING').notNull(),
}, (table) => ({
  idAtletIdx: index('tb_peserta_kompetisi_id_atlet_idx').on(table.idAtlet),
  idKelasKejuaraanIdx: index('tb_peserta_kompetisi_id_kelas_kejuaraan_idx').on(table.idKelasKejuaraan),
}));

// Relations
export const atletRelations = relations(tbAtlet, ({ one, many }) => ({
  dojang: one(tbDojang, {
    fields: [tbAtlet.idDojang],
    references: [tbDojang.idDojang],
  }),
  pelatihPembuat: one(tbPelatih, {
    fields: [tbAtlet.idPelatihPembuat],
    references: [tbPelatih.idPelatih],
  }),
  pesertaKompetisi: many(tbPesertaKompetisi),
  pesertaTim: many(tbPesertaTim),
}));

export const pesertaKompetisiRelations = relations(tbPesertaKompetisi, ({ one, many }) => ({
  atlet: one(tbAtlet, {
    fields: [tbPesertaKompetisi.idAtlet],
    references: [tbAtlet.idAtlet],
  }),
  kelasKejuaraan: one(tbKelasKejuaraan, {
    fields: [tbPesertaKompetisi.idKelasKejuaraan],
    references: [tbKelasKejuaraan.idKelasKejuaraan],
  }),
  anggotaTim: many(tbPesertaTim),
  drawingSeed: many(tbDrawingSeed),
  matchA: many(tbMatch, { relationName: 'PesertaA' }),
  matchB: many(tbMatch, { relationName: 'PesertaB' }),
}));

export const pesertaTimRelations = relations(tbPesertaTim, ({ one }) => ({
  pesertaKompetisi: one(tbPesertaKompetisi, {
    fields: [tbPesertaTim.idPesertaKompetisi],
    references: [tbPesertaKompetisi.idPesertaKompetisi],
  }),
  atlet: one(tbAtlet, {
    fields: [tbPesertaTim.idAtlet],
    references: [tbAtlet.idAtlet],
  }),
}));

// Import types for relations
import { tbDojang } from './dojang';
import { tbPelatih } from './auth';
import { tbKelasKejuaraan } from './kompetisi';
import { tbDrawingSeed, tbMatch } from './match';