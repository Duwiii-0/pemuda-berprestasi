// src/db/schema/atlet.ts
import { 
  int, 
  varchar, 
  mysqlTable, 
  datetime,
  float,
  index
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { jenisKelaminEnum } from './enums';

// Atlet table
export const tbAtlet = mysqlTable('tb_atlet', {
  idAtlet: int('id_atlet').primaryKey().autoincrement(),
  namaAtlet: varchar('nama_atlet', { length: 150 }).notNull(),
  tanggalLahir: datetime('tanggal_lahir').notNull(),
  nik: varchar('nik', { length: 16 }).notNull(),
  beratBadan: float('berat_badan').notNull(),
  provinsi: varchar('provinsi', { length: 100 }).notNull(),
  kota: varchar('kota', { length: 100 }),
  belt: varchar('belt', { length: 50 }).notNull(),
  alamat: varchar('alamat', { length: 100 }),
  noTelp: varchar('no_telp', { length: 15 }),
  tinggiBadan: float('tinggi_badan').notNull(),
  jenisKelamin: jenisKelaminEnum.notNull(),
  umur: int('umur'),
  idDojang: int('id_dojang').notNull(),
  idPelatihPembuat: int('id_pelatih_pembuat').notNull(),
  
  // File documents
  akteKelahiran: varchar('akte_kelahiran', { length: 255 }),
  pasFoto: varchar('pas_foto', { length: 255 }),
  sertifikatBelt: varchar('sertifikat_belt', { length: 255 }),
  ktp: varchar('ktp', { length: 255 }),
}, (table) => ({
  idDojangIdx: index('tb_atlet_id_dojang_idx').on(table.idDojang),
  idPelatihPembuatIdx: index('tb_atlet_id_pelatih_pembuat_idx').on(table.idPelatihPembuat),
}));

// Relations are defined in index.ts to avoid circular imports

// Import types for relations
import type { tbDojang } from './dojang';
import type { tbPelatih } from './users';
import type { tbPesertaKompetisi, tbPesertaTim } from './kompetisi';