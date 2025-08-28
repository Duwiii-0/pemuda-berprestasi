export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Atlet Types (berdasarkan atletController)
export interface Atlet {
  id_atlet: number;
  nama_atlet: string;
  email: string;
  no_telp?: string;
  nik?: string;
  tanggal_lahir?: string; // ISO string
  jenis_kelamin: 'LAKI_LAKI' | 'PEREMPUAN';
  kota?: string;
  provinsi?: string;
  alamat?: string;
  berat_badan?: number;
  tinggi_badan?: number;
  belt?: string;
  umur?: number;
  id_dojang: number;
  
  // File paths
  akte_kelahiran?: string;
  pas_foto?: string;
  sertifikat_belt?: string;
  ktp?: string;
  
  // Relations
  dojang?: {
    id_dojang: number;
    nama_dojang: string;
    pelatih?: {
      id_pelatih: number;
      nama_pelatih: string;
    };
  };
  
  createdAt: string;
  updatedAt: string;
}

// Kompetisi Types (berdasarkan kompetisiController)
export interface Kompetisi {
  id_kompetisi: number;
  nama_kompetisi: string;
  deskripsi?: string;
  tanggal_mulai: string; // ISO string
  tanggal_selesai: string; // ISO string
  tempat: string;
  biaya_pendaftaran: number;
  batas_pendaftaran: string; // ISO string
  max_peserta?: number;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ONGOING' | 'COMPLETED';
  type_kompetisi: 'REGIONAL' | 'NASIONAL' | 'INTERNASIONAL';
  syarat_peserta?: string;
  kontak_person?: string;
  poster_url?: string;
  
  // Relations
  kelas_kejuaraan?: KelasKejuaraan[];
  _count?: {
    peserta_kompetisi: number;
  };
  
  createdAt: string;
  updatedAt: string;
}

// Kelas Kejuaraan Types
export interface KelasKejuaraan {
  id_kelas_kejuaraan: number;
  id_kompetisi: number;
  nama_kelas: string;
  kategori: 'KYORUGI' | 'POOMSAE';
  tingkat: 'PRESTASI' | 'PEMULA';
  jenis_kelamin: 'LAKI_LAKI' | 'PEREMPUAN' | 'CAMPURAN';
  batas_umur_min: number;
  batas_umur_max: number;
  batas_berat_min?: number;
  batas_berat_max?: number;
  max_peserta?: number;
  biaya_tambahan?: number;
  
  // Relations
  peserta_kompetisi?: PesertaKompetisi[];
  _count?: {
    peserta_kompetisi: number;
  };
  
  createdAt: string;
  updatedAt: string;
}

// Peserta Kompetisi (Registration)
export interface PesertaKompetisi {
  id_peserta_kompetisi: number;
  id_atlet: number;
  id_kelas_kejuaraan: number;
  tanggal_daftar: string;
  status_pendaftaran: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  catatan?: string;
  
  // Relations
  atlet: Atlet;
  kelas_kejuaraan: KelasKejuaraan & {
    kompetisi: Kompetisi;
  };
  
  createdAt: string;
  updatedAt: string;
}

// Request Types untuk API calls
export interface AtletFilters {
  page?: number;
  limit?: number;
  search?: string;
  id_dojang?: number;
  jenis_kelamin?: 'LAKI_LAKI' | 'PEREMPUAN';
  min_age?: number;
  max_age?: number;
  min_weight?: number;
  max_weight?: number;
}

export interface KompetisiFilters {
  page?: number;
  limit?: number;
  search?: string;
  type_kompetisi?: 'REGIONAL' | 'NASIONAL' | 'INTERNASIONAL';
  status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ONGOING' | 'COMPLETED';
  start_date?: string; // ISO string
  end_date?: string; // ISO string
}

export interface RegistrationRequest {
  id_atlet: number;
  id_kelas_kejuaraan: number;
}

export interface BulkRegistrationRequest {
  registrations: RegistrationRequest[];
}