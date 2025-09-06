// src/db/schema/kompetisi.ts
import { mysqlTable, int, varchar, datetime, float, mysqlEnum, index } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { statusKompetisiEnum, jenisKelaminEnum, cabangEnum } from './enums';

export const tbKompetisi = mysqlTable('tb_kompetisi', {
  idKompetisi: int('id_kompetisi').primaryKey().autoincrement(),
  idPenyelenggara: int('id_penyelenggara').notNull(),
  tanggalMulai: datetime('tanggal_mulai').notNull(),
  lokasi: varchar('lokasi', { length: 255 }).notNull(),
  tanggalSelesai: datetime('tanggal_selesai').notNull(),
  namaEvent: varchar('nama_event', { length: 255 }).notNull(),
  status: mysqlEnum('status', statusKompetisiEnum).notNull(),
}, (table) => ({
  idPenyelenggaraIdx: index('tb_kompetisi_id_penyelenggara_fkey').on(table.idPenyelenggara),
}));

export const tbKategoriEvent = mysqlTable('tb_kategori_event', {
  idKategoriEvent: int('id_kategori_event').primaryKey().autoincrement(),
  namaKategori: varchar('nama_kategori', { length: 150 }).notNull(),
});

export const tbKelompokUsia = mysqlTable('tb_kelompok_usia', {
  idKelompok: int('id_kelompok').primaryKey().autoincrement(),
  namaKelompok: varchar('nama_kelompok', { length: 100 }).notNull(),
  usiaMin: int('usia_min').notNull(),
  usiaMax: int('usia_max').notNull(),
});

export const tbKelasBerat = mysqlTable('tb_kelas_berat', {
  idKelasBerat: int('id_kelas_berat').primaryKey().autoincrement(),
  idKelompok: int('id_kelompok').notNull(),
  jenisKelamin: mysqlEnum('jenis_kelamin', jenisKelaminEnum).notNull(),
  batasMin: float('batas_min').notNull(),
  batasMax: float('batas_max').notNull(),
  namaKelas: varchar('nama_kelas', { length: 100 }).notNull(),
}, (table) => ({
  idKelompokIdx: index('tb_kelas_berat_id_kelompok_fkey').on(table.idKelompok),
}));

export const tbKelasPoomsae = mysqlTable('tb_kelas_poomsae', {
  idPoomsae: int('id_poomsae').primaryKey().autoincrement(),
  idKelompok: int('id_kelompok').notNull(),
  namaKelas: varchar('nama_kelas', { length: 50 }).notNull(),
});

export const tbKelasKejuaraan = mysqlTable('tb_kelas_kejuaraan', {
  idKelasKejuaraan: int('id_kelas_kejuaraan').primaryKey().autoincrement(),
  idKategoriEvent: int('id_kategori_event').notNull(),
  idKelompok: int('id_kelompok'),
  idKelasBerat: int('id_kelas_berat'),
  idPoomsae: int('id_poomsae'),
  idKompetisi: int('id_kompetisi').notNull(),
  cabang: mysqlEnum('cabang', cabangEnum).notNull(),
}, (table) => ({
  idKompetisiIdx: index('tb_kelas_kejuaraan_id_kompetisi_fkey').on(table.idKompetisi),
}));

export const tbVenue = mysqlTable('tb_venue', {
  idVenue: int('id_venue').primaryKey().autoincrement(),
  idKompetisi: int('id_kompetisi').notNull(),
  namaVenue: varchar('nama_venue', { length: 150 }).notNull(),
  lokasi: varchar('lokasi', { length: 255 }),
}, (table) => ({
  idKompetisiIdx: index('tb_venue_id_kompetisi_fkey').on(table.idKompetisi),
}));

// Relations
export const kompetisiRelations = relations(tbKompetisi, ({ one, many }) => ({
  penyelenggara: one(tbPenyelenggara, {
    fields: [tbKompetisi.idPenyelenggara],
    references: [tbPenyelenggara.idPenyelenggara],
  }),
  admin: many(tbAdminKompetisi),
  bagan: many(tbBagan),
  kelasKejuaraan: many(tbKelasKejuaraan),
  venue: many(tbVenue),
}));

export const kategoriEventRelations = relations(tbKategoriEvent, ({ many }) => ({
  kelasKejuaraan: many(tbKelasKejuaraan),
}));

export const kelompokUsiaRelations = relations(tbKelompokUsia, ({ many }) => ({
  kelasBerat: many(tbKelasBerat),
  kelasPoomsae: many(tbKelasPoomsae),
  kelasKejuaraan: many(tbKelasKejuaraan),
}));

export const kelasBeratRelations = relations(tbKelasBerat, ({ one, many }) => ({
  kelompok: one(tbKelompokUsia, {
    fields: [tbKelasBerat.idKelompok],
    references: [tbKelompokUsia.idKelompok],
  }),
  kelasKejuaraan: many(tbKelasKejuaraan),
}));

export const kelasPoomsaeRelations = relations(tbKelasPoomsae, ({ one, many }) => ({
  kelompok: one(tbKelompokUsia, {
    fields: [tbKelasPoomsae.idKelompok],
    references: [tbKelompokUsia.idKelompok],
  }),
  kelasKejuaraan: many(tbKelasKejuaraan),
}));

export const kelasKejuaraanRelations = relations(tbKelasKejuaraan, ({ one, many }) => ({
  kompetisi: one(tbKompetisi, {
    fields: [tbKelasKejuaraan.idKompetisi],
    references: [tbKompetisi.idKompetisi],
  }),
  kategoriEvent: one(tbKategoriEvent, {
    fields: [tbKelasKejuaraan.idKategoriEvent],
    references: [tbKategoriEvent.idKategoriEvent],
  }),
  kelompok: one(tbKelompokUsia, {
    fields: [tbKelasKejuaraan.idKelompok],
    references: [tbKelompokUsia.idKelompok],
  }),
  kelasBerat: one(tbKelasBerat, {
    fields: [tbKelasKejuaraan.idKelasBerat],
    references: [tbKelasBerat.idKelasBerat],
  }),
  poomsae: one(tbKelasPoomsae, {
    fields: [tbKelasKejuaraan.idPoomsae],
    references: [tbKelasPoomsae.idPoomsae],
  }),
  bagan: many(tbBagan),
  pesertaKompetisi: many(tbPesertaKompetisi),
}));

export const venueRelations = relations(tbVenue, ({ one, many }) => ({
  kompetisi: one(tbKompetisi, {
    fields: [tbVenue.idKompetisi],
    references: [tbKompetisi.idKompetisi],
  }),
  match: many(tbMatch),
}));

// Import types for relations
import { tbPenyelenggara } from './dojang';
import { tbAdminKompetisi } from './auth';
import { tbBagan, tbMatch } from './match';
import { tbPesertaKompetisi } from './atlet';