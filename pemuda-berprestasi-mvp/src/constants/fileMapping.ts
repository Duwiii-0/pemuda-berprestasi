// ===== 1. CREATE NEW FILE: src/constants/fileMapping.ts =====
export const ATLET_FOLDER_MAP: Record<string, string> = {
  'akte_kelahiran': 'akte_kelahiran',
  'pas_foto': 'pas_foto',
  'sertifikat_belt': 'sertifikat_belt', 
  'ktp': 'ktp'
}

export const PELATIH_FOLDER_MAP: Record<string, string> = {
  'foto_ktp': 'ktp',
  'sertifikat_sabuk': 'sertifikat'
}

// File type definitions
export type AtletFileType = keyof typeof ATLET_FOLDER_MAP;
export type PelatihFileType = keyof typeof PELATIH_FOLDER_MAP;