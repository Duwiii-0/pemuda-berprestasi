// ===== UPDATED FILE: src/constants/fileMapping.ts =====
export const ATLET_FOLDER_MAP: Record<string, string> = {
  'akte_kelahiran': 'akte_kelahiran',
  'pas_foto': 'pas_foto',
  'sertifikat_belt': 'sertifikat_belt', 
  'ktp': 'ktp'
}

export const PELATIH_FOLDER_MAP: Record<string, string> = {
  'foto_ktp': 'ktp',
  'sertifikat_sabuk': 'sertifikat',
  'bukti_transfer': 'BuktiTf' // ⬅️ TAMBAH INI
}

// TAMBAHAN: Mapping untuk dojang files
export const DOJANG_FOLDER_MAP: Record<string, string> = {
  'logo': 'logos'
}

// File type definitions
export type AtletFileType = keyof typeof ATLET_FOLDER_MAP;
export type PelatihFileType = keyof typeof PELATIH_FOLDER_MAP;
export type DojangFileType = keyof typeof DOJANG_FOLDER_MAP;