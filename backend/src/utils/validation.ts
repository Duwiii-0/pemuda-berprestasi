import Joi from 'joi';

export const registerPelatihSchema = Joi.object({
  nama_pelatih: Joi.string().min(2).max(150).required(),
  email: Joi.string().email().max(255).required(),
  no_telp: Joi.string().pattern(/^[0-9+\-\s()]+$/).max(15).optional(),
  password: Joi.string().min(6).required(),
  confirm_password: Joi.string().valid(Joi.ref('password')).required()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const createDojangSchema = Joi.object({
  nama_dojang: Joi.string().min(2).max(150).required(),
  email: Joi.string().email().max(255).optional(),
  no_telp: Joi.string().pattern(/^[0-9+\-\s()]+$/).max(15).optional(),
  founder: Joi.string().max(150).optional(),
  no_sk: Joi.string().max(50).required(),
  id_wilayah: Joi.number().integer().optional()
});

export const createAtletSchema = Joi.object({
  nama_atlet: Joi.string().min(2).max(150).required(),
  tanggal_lahir: Joi.date().required(),
  jenis_kelamin: Joi.string().valid('L', 'P').required(),
  id_dojang: Joi.number().integer().required()
});

export const createKompetisiSchema = Joi.object({
  id_penyelenggara: Joi.number().integer().required(),
  tanggal_mulai: Joi.date().required(),
  tanggal_selesai: Joi.date().min(Joi.ref('tanggal_mulai')).required(),
  nama_event: Joi.string().min(5).max(255).required(),
  type_kompetisi: Joi.string().valid('OPEN', 'TRAINING', 'GRADE_B', 'GRADE_C').required(),
  venues: Joi.array().items(Joi.object({
    nama_venue: Joi.string().max(150).required(),
    lokasi: Joi.string().max(255).optional()
  })).optional(),
  kelas_kejuaraan: Joi.array().items(Joi.object({
    cabang: Joi.string().valid('POOMSAE', 'KYORUGI').required(),
    kategori_usia: Joi.string().max(50).required(),
    kategori_berat: Joi.string().max(50).optional()
  })).optional()
});

export const createKelasKejuaraanSchema = Joi.object({
  id_kompetisi: Joi.number().integer().required(),
  cabang: Joi.string().valid('POOMSAE', 'KYORUGI').required(),
  kategori_usia: Joi.string().max(50).required(),
  kategori_berat: Joi.string().max(50).optional()
});

export const createWilayahSchema = Joi.object({
  provinsi: Joi.string().min(2).max(100).required(),
  kota: Joi.string().min(2).max(100).required()
});