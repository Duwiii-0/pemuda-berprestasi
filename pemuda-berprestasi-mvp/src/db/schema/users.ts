// src/db/schema/users.ts
import { 
  int, 
  varchar, 
  mysqlTable, 
  datetime,
  index
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { jenisKelaminEnum } from './enums';

// Pelatih table
export const tbPelatih = mysqlTable('tb_pelatih', {
  idPelatih: int('id_pelatih').primaryKey().autoincrement(),
  namaPelatih: varchar('nama_pelatih', { length: 150 }).notNull(),
  noTelp: varchar('no_telp', { length: 15 }),
  fotoKtp: varchar('foto_ktp', { length: 255 }),
  nik: varchar('nik', { length: 16 }).notNull().unique(),
  tanggalLahir: datetime('tanggal_lahir'),
  jenisKelamin: jenisKelaminEnum,
  provinsi: varchar('provinsi', { length: 100 }),
  kota: varchar('kota', { length: 100 }),
  alamat: varchar('alamat', { length: 100 }),
  sertifikatSabuk: varchar('sertifikat_sabuk', { length: 255 }),
  idAkun: int('id_akun').notNull().unique(),
  idDojang: int('id_dojang').notNull(),
});

// Penyelenggara table
export const tbPenyelenggara = mysqlTable('tb_penyelenggara', {
  idPenyelenggara: int('id_penyelenggara').primaryKey().autoincrement(),
  namaPenyelenggara: varchar('nama_penyelenggara', { length: 150 }).notNull(),
  email: varchar('email', { length: 255 }),
  noTelp: varchar('no_telp', { length: 15 }),
});

// Relations are defined in index.ts to avoid circular imports

// Import types for relations
import type { tbAkun } from './auth';
import type { tbDojang } from './dojang';
import type { tbAtlet } from './atlet';
import type { tbKompetisi } from './kompetisi';