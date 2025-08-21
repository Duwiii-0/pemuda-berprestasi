// Competition status enum (from database)
export enum StatusKompetisi {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
}

// Competition type enum (from database)
export enum TypeKompetisi {
  OPEN = 'OPEN',
  TRAINING = 'TRAINING',
  GRADE_B = 'GRADE_B',
  GRADE_C = 'GRADE_C',
}

// Competition branches enum (from database)
export enum Cabang {
  POOMSAE = 'POOMSAE',
  KYORUGI = 'KYORUGI',
}

// Registration status enum (from database)
export enum StatusPendaftaran {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// Gender enum (from database)
export enum JenisKelamin {
  L = 'L', // Laki-laki (Male)
  P = 'P', // Perempuan (Female)
}

// Main competition interface (based on tb_kompetisi)
export interface Kompetisi {
  id_kompetisi: number;
  id_penyelenggara: number;
  tanggal_mulai: Date;
  tanggal_selesai: Date;
  nama_event: string;
  type_kompetisi: TypeKompetisi;
  status: StatusKompetisi;
  
  // Relations
  penyelenggara?: Penyelenggara;
  bagan?: Bagan[];
  kelas_kejuaraan?: KelasKejuaraan[];
  venue?: Venue[];
  
  // Calculated fields
  totalParticipants?: number;
  totalMatches?: number;
}

// Penyelenggara interface (based on tb_penyelenggara)
export interface Penyelenggara {
  id_penyelenggara: number;
  nama_penyelenggara: string;
  email?: string;
  no_telp?: string;
  
  // Relations
  kompetisi?: Kompetisi[];
}

// Venue interface (based on tb_venue)
export interface Venue {
  id_venue: number;
  id_kompetisi: number;
  nama_venue: string;
  lokasi?: string;
  
  // Relations
  kompetisi?: Kompetisi;
  match?: Match[];
}

// Kelompok Usia interface (based on tb_kelompok_usia)
export interface KelompokUsia {
  id_kelompok: number;
  nama_kelompok: string;
  usia_min: number;
  usia_max: number;
  
  // Relations
  kelas_berat?: KelasBerat[];
  kelas_poomsae?: KelasPoomsae[];
  kelas_kejuaraan?: KelasKejuaraan[];
}

// Kelas Berat interface (based on tb_kelas_berat)
export interface KelasBerat {
  id_kelas_berat: number;
  id_kelompok: number;
  gender: JenisKelamin;
  batas_min: number;
  batas_max: number;
  nama_kelas: string;
  
  // Relations
  kelompok?: KelompokUsia;
  kelas_kejuaraan?: KelasKejuaraan[];
}

// Kelas Poomsae interface (based on tb_kelas_poomsae)
export interface KelasPoomsae {
  id_poomsae: number;
  id_kelompok: number;
  level: string;
  daftar_taeguk?: string;
  
  // Relations
  kelompok?: KelompokUsia;
  kelas_kejuaraan?: KelasKejuaraan[];
}

// Kategori Event interface (based on tb_kategori_event)
export interface KategoriEvent {
  id_kategori_event: number;
  nama_kategori: string;
  
  // Relations
  kelas_kejuaraan?: KelasKejuaraan[];
}

// Kelas Kejuaraan interface (based on tb_kelas_kejuaraan)
export interface KelasKejuaraan {
  id_kelas_kejuaraan: number;
  id_kategori_event: number;
  id_kelompok?: number;
  id_kelas_berat?: number;
  id_poomsae?: number;
  id_kompetisi: number;
  cabang: Cabang;
  
  // Relations
  kompetisi?: Kompetisi;
  kategori_event?: KategoriEvent;
  kelompok?: KelompokUsia;
  kelas_berat?: KelasBerat;
  poomsae?: KelasPoomsae;
  bagan?: Bagan[];
  peserta_kompetisi?: PesertaKompetisi[];
}

// Peserta Kompetisi interface (based on tb_peserta_kompetisi)
export interface PesertaKompetisi {
  id_peserta_kompetisi: number;
  id_atlet: number;
  id_kelas_kejuaraan: number;
  status: StatusPendaftaran;
  
  // Relations
  atlet?: Atlet;
  kelas_kejuaraan?: KelasKejuaraan;
  drawing_seed?: DrawingSeed[];
  match_a?: Match[];
  match_b?: Match[];
}

// Atlet interface (based on tb_atlet)
export interface Atlet {
  id_atlet: number;
  nama_atlet: string;
  tanggal_lahir: Date;
  berat_badan: number;
  tinggi_badan: number;
  jenis_kelamin: JenisKelamin;
  id_dojang: number;
  id_pelatih_pembuat: number;
  akte_kelahiran: string;
  pas_foto: string;
  sertifikat_belt: string;
  ktp?: string;
  
  // Relations
  dojang?: Dojang;
  pelatih_pembuat?: Pelatih;
  peserta_kompetisi?: PesertaKompetisi[];
  
  // Calculated fields
  age?: number;
}

// Dojang interface (based on tb_dojang)
export interface Dojang {
  id_dojang: number;
  nama_dojang: string;
  email?: string;
  no_telp?: string;
  founder?: string;
  negara?: string;
  provinsi?: string;
  kota?: string;
  id_pelatih_pendaftar: number;
  
  // Relations
  atlet?: Atlet[];
  pelatih_pendaftar?: Pelatih;
}

// Pelatih interface (based on tb_pelatih)
export interface Pelatih {
  id_pelatih: number;
  nama_pelatih: string;
  no_telp?: string;
  foto_ktp?: string;
  sertifikat_sabuk?: string;
  id_akun?: number;
  
  // Relations
  akun?: Akun;
  atlet_pembuat?: Atlet[];
  dojang_pendaftar?: Dojang[];
}

// Akun interface (based on tb_akun)
export interface Akun {
  id_akun: number;
  email: string;
  password_hash: string;
  role: string;
  
  // Relations
  pelatih?: Pelatih;
  admin?: Admin;
}

// Admin interface (based on tb_admin)
export interface Admin {
  id_admin: number;
  nama: string;
  id_akun: number;
  
  // Relations
  akun?: Akun;
}

// Tournament Bracket interface (based on tb_bagan)
export interface Bagan {
  id_bagan: number;
  id_kompetisi: number;
  id_kelas_kejuaraan: number;
  
  // Relations
  kompetisi?: Kompetisi;
  kelas_kejuaraan?: KelasKejuaraan;
  drawing_seed?: DrawingSeed[];
  match?: Match[];
}

// Drawing Seed interface (based on tb_drawing_seed)
export interface DrawingSeed {
  id_seed: number;
  id_bagan: number;
  id_peserta_kompetisi: number;
  seed_num: number;
  
  // Relations
  bagan?: Bagan;
  peserta_kompetisi?: PesertaKompetisi;
}

// Match interface (based on tb_match)
export interface Match {
  id_match: number;
  id_bagan: number;
  ronde: number;
  id_peserta_a?: number;
  id_peserta_b?: number;
  skor_a: number;
  skor_b: number;
  id_venue?: number;
  
  // Relations
  bagan?: Bagan;
  peserta_a?: PesertaKompetisi;
  peserta_b?: PesertaKompetisi;
  venue?: Venue;
  match_audit?: MatchAudit[];
  
  // Calculated fields
  winner?: number;
  isCompleted?: boolean;
}

// Match Audit interface (based on tb_match_audit)
export interface MatchAudit {
  id_audit: number;
  id_match: number;
  id_user: number;
  aksi: string;
  payload?: any;
  created_at: Date;
  
  // Relations
  match?: Match;
}

// Audit Log interface (based on tb_audit_log)
export interface AuditLog {
  id_log: number;
  id_user: number;
  tabel: string;
  aksi: string;
  data_lama?: any;
  data_baru?: any;
  created_at: Date;
}

// Organization information
export interface OrganizationInfo