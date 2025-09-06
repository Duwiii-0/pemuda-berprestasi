// src/db/schema/enums.ts
export const jenisKelaminEnum = ['LAKI_LAKI', 'PEREMPUAN'] as const;
export type JenisKelamin = typeof jenisKelaminEnum[number];

export const cabangEnum = ['POOMSAE', 'KYORUGI'] as const;
export type Cabang = typeof cabangEnum[number];

export const statusPendaftaranEnum = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type StatusPendaftaran = typeof statusPendaftaranEnum[number];

export const roleEnum = ['ADMIN', 'PELATIH'] as const;
export type Role = typeof roleEnum[number];

export const statusKompetisiEnum = ['PENDAFTARAN', 'SEDANG_DIMULAI', 'SELESAI'] as const;
export type StatusKompetisi = typeof statusKompetisiEnum[number];