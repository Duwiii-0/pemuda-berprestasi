// src/db/schema/enums.ts
import { mysqlEnum } from 'drizzle-orm/mysql-core';

// Define all enums used in the database
export const jenisKelaminEnum = mysqlEnum('jenis_kelamin', ['LAKI_LAKI', 'PEREMPUAN']);

export const cabangEnum = mysqlEnum('cabang', ['POOMSAE', 'KYORUGI']);

export const statusPendaftaranEnum = mysqlEnum('status_pendaftaran', [
  'PENDING', 
  'APPROVED', 
  'REJECTED'
]);

export const roleEnum = mysqlEnum('role', ['ADMIN', 'PELATIH']);

export const statusKompetisiEnum = mysqlEnum('status_kompetisi', [
  'PENDAFTARAN',
  'SEDANG_DIMULAI', 
  'SELESAI'
]);

// Export types for TypeScript
export type JenisKelamin = 'LAKI_LAKI' | 'PEREMPUAN';
export type Cabang = 'POOMSAE' | 'KYORUGI';
export type StatusPendaftaran = 'PENDING' | 'APPROVED' | 'REJECTED';
export type Role = 'ADMIN' | 'PELATIH';
export type StatusKompetisi = 'PENDAFTARAN' | 'SEDANG_DIMULAI' | 'SELESAI';