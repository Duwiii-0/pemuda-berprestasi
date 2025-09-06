// src/db/schema/kompetisi.ts
import { 
  int, 
  varchar, 
  mysqlTable, 
  datetime,
  float,
  boolean,
  index
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { jenisKelaminEnum, cabangEnum, statusKompetisiEnum, statusPendaftaranEnum } from './enums';

// Kompetisi table
export const tbKompetisi = mysqlTable('tb_kompetisi', {
  idKompetisi: int('id_kompetisi').primaryKey().autoincrement(),
  idPenyelenggara: int('id_penyelenggara').notNull(),
  tanggalMulai: datetime('tanggal_mulai').notNull(),
  lokasi: varchar('lokasi', { length: 255 }).notNull(),
  tanggalSelesai: datetime('tanggal_selesai').notNull(),
  namaEvent: varchar('nama_event', { length: 255 }).notNull(),
  status: statusKompetisiEnum.notNull(),
}, (table) => ({
  idPenyelenggaraIdx: index('tb_kompetisi_id_penyelenggara_fkey').on(table.idPenyelenggara),
}));

// Kategori Event table
export const tbKategoriEvent = mysqlTable('tb_kategori_event', {
  idKategoriEvent: int('id_kategori_event').primaryKey().autoincrement(),
  namaKategori: varchar('nama_kategori', { length: 150 }).notNull(),
});

// Kelompok Usia table
export const tbKelompokUsia = mysqlTable('tb_kelompok_usia', {
  idKelompok: int('id_kelompok').primaryKey().autoincrement(),
  namaKelompok: varchar('nama_kelompok', { length: 100 }).notNull(),
  usiaMin: int('usia_min').notNull(),
  usiaMax: int('usia_max').notNull(),
});

// Kelas Berat table
export const tbKelasBerat = mysqlTable('tb_kelas_berat', {
  idKelasBerat: int('id_kelas_berat').primaryKey().autoincrement(),
  idKelompok: int('id_kelompok').notNull(),
  jenisKelamin: jenisKelaminEnum.notNull(),
  batasMin: float('batas_min').notNull(),
  batasMax: float('batas_max').notNull(),
  namaKelas: varchar('nama_kelas', { length: 100 }).notNull(),
}, (table) => ({
  idKelompokIdx: index('tb_kelas_berat_id_kelompok_fkey').on(table.idKelompok),
}));

// Kelas Poomsae table
export const tbKelasPoomsae = mysqlTable('tb_kelas_poomsae', {
  idPoomsae: int('id_poomsae').primaryKey().autoincrement(),
  idKelompok: int('id_kelompok').notNull(),
  namaKelas: varchar('nama_kelas', { length: 50 }).notNull(),
});

// Kelas Kejuaraan table
export const tbKelasKejuaraan = mysqlTable('tb_kelas_kejuaraan', {
  idKelasKejuaraan: int('id_kelas_kejuaraan').primaryKey().autoincrement(),
  idKategoriEvent: int('id_kategori_event').notNull(),
  idKelompok: int('id_kelompok'),
  idKelasBerat: int('id_kelas_berat'),
  idPoomsae: int('id_poomsae'),
  idKompetisi: int('id_kompetisi').notNull(),
  cabang: cabangEnum.notNull(),
}, (table) => ({
  idKompetisiIdx: index('tb_kelas_kejuaraan_id_kompetisi_fkey').on(table.idKompetisi),
}));

// Peserta Kompetisi table
export const tbPesertaKompetisi = mysqlTable('tb_peserta_kompetisi', {
  idPesertaKompetisi: int('id_peserta_kompetisi').primaryKey().autoincrement(),
  idAtlet: int('id_atlet'), // nullable for team
  idKelasKejuaraan: int('id_kelas_kejuaraan').notNull(),
  isTeam: boolean('is_team').notNull().default(false),
  status: statusPendaftaranEnum.notNull().default('PENDING'),
}, (table) => ({
  idAtletIdx: index('tb_peserta_kompetisi_id_atlet_idx').on(table.idAtlet),
  idKelasKejuaraanIdx: index('tb_peserta_kompetisi_id_kelas_kejuaraan_idx').on(table.idKelasKejuaraan),
}));

// Peserta Tim table
export const tbPesertaTim = mysqlTable('tb_peserta_tim', {
  id: int('id').primaryKey().autoincrement(),
  idPesertaKompetisi: int('id_peserta_kompetisi').notNull(),
  idAtlet: int('id_atlet').notNull(),
}, (table) => ({
  idPesertaKompetisiIdx: index('tb_peserta_tim_id_peserta_kompetisi_idx').on(table.idPesertaKompetisi),
  idAtletIdx: index('tb_peserta_tim_id_atlet_idx').on(table.idAtlet),
}));

// Venue table
export const tbVenue = mysqlTable('tb_venue', {
  idVenue: int('id_venue').primaryKey().autoincrement(),
  idKompetisi: int('id_kompetisi').notNull(),
  namaVenue: varchar('nama_venue', { length: 150 }).notNull(),
  lokasi: varchar('lokasi', { length: 255 }),
}, (table) => ({
  idKompetisiIdx: index('tb_venue_id_kompetisi_fkey').on(table.idKompetisi),
}));

// Relations
export const tbKompetisiRelations = relations(tbKompetisi, ({ one, many }) => ({
  admin: many(tbAdminKompetisi),
  penyelenggara: one(tbPenyelenggara, {
    fields: [tbKompetisi.idPenyelenggara],
    references: [tbPenyelenggara.idPenyelenggara],
  }),
  bagan: many(tbBagan),
  kelasKejuaraan: many(tbKelasKejuaraan),
  venue: many(tbVenue),
}));

export const tbKategoriEventRelations = relations(tbKategoriEvent, ({ many }) => ({
  kelasKejuaraan: many(tbKelasKejuaraan),
}));

export const tbKelompokUsiaRelations = relations(tbKelompokUsia, ({ many }) => ({
  kelasBerat: many(tbKelasBerat),
  kelasPoomsae: many(tbKelasPoomsae),
  kelasKejuaraan: many(tbKelasKejuaraan),
}));

export const tbKelasBeratRelations = relations(tbKelasBerat, ({ one, many }) => ({
  kelompok: one(tbKelompokUsia, {
    fields: [tbKelasBerat.idKelompok],
    references: [tbKelompokUsia.idKelompok],
  }),
  kelasKejuaraan: many(tbKelasKejuaraan),
}));

export const tbKelasPoomsaeRelations = relations(tbKelasPoomsae, ({ one, many }) => ({
  kelompok: one(tbKelompokUsia, {
    fields: [tbKelasPoomsae.idKelompok],
    references: [tbKelompokUsia.idKelompok],
  }),
  kelasKejuaraan: many(tbKelasKejuaraan),
}));

export const tbKelasKejuaraanRelations = relations(tbKelasKejuaraan, ({ one, many }) => ({
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

export const tbPesertaKompetisiRelations = relations(tbPesertaKompetisi, ({ one, many }) => ({
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
  matchA: many(tbMatch, { relationName: "PesertaA" }),
  matchB: many(tbMatch, { relationName: "PesertaB" }),
}));

export const tbPesertaTimRelations = relations(tbPesertaTim, ({ one }) => ({
  pesertaKompetisi: one(tbPesertaKompetisi, {
    fields: [tbPesertaTim.idPesertaKompetisi],
    references: [tbPesertaKompetisi.idPesertaKompetisi],
  }),
  atlet: one(tbAtlet, {
    fields: [tbPesertaTim.idAtlet],
    references: [tbAtlet.idAtlet],
  }),
}));

export const tbVenueRelations = relations(tbVenue, ({ one, many }) => ({
  kompetisi: one(tbKompetisi, {
    fields: [tbVenue.idKompetisi],
    references: [tbKompetisi.idKompetisi],
  }),
  match: many(tbMatch),
}));

// Forward declare types to avoid circular imports
// Relations will be defined in index.ts