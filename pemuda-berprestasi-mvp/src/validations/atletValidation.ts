import Joi from 'joi';

export const atletValidation = {
  create: Joi.object({
    nama_atlet: Joi.string().min(2).max(150).required().messages({
      'string.empty': 'Nama atlet wajib diisi',
      'string.min': 'Nama atlet minimal 2 karakter',
      'string.max': 'Nama atlet maksimal 150 karakter',
      'any.required': 'Nama atlet wajib diisi',
    }),
    tanggal_lahir: Joi.date().max('now').required().messages({
      'date.base': 'Format tanggal lahir tidak valid',
      'date.max': 'Tanggal lahir tidak boleh di masa depan',
      'any.required': 'Tanggal lahir wajib diisi',
    }),
    nik: Joi.string().min(8).max(20).required().messages({
      'string.empty': 'NIK wajib diisi',
      'string.min': 'NIK minimal 8 karakter',
      'string.max': 'NIK maksimal 20 karakter',
      'any.required': 'NIK wajib diisi',
    }),
    berat_badan: Joi.number().positive().max(200).required().messages({
      'number.base': 'Berat badan harus berupa angka',
      'number.positive': 'Berat badan harus positif',
      'number.max': 'Berat badan maksimal 200 kg',
      'any.required': 'Berat badan wajib diisi',
    }),
    tinggi_badan: Joi.number().positive().max(250).required().messages({
      'number.base': 'Tinggi badan harus berupa angka',
      'number.positive': 'Tinggi badan harus positif',
      'number.max': 'Tinggi badan maksimal 250 cm',
      'any.required': 'Tinggi badan wajib diisi',
    }),
    jenis_kelamin: Joi.string().valid('LAKI_LAKI', 'PEREMPUAN').required().messages({
      'any.only': 'Jenis kelamin harus LAKI_LAKI atau PEREMPUAN',
      'any.required': 'Jenis kelamin wajib diisi',
    }),
    provinsi: Joi.string().max(100).required().messages({
      'string.empty': 'Provinsi wajib diisi',
      'string.max': 'Provinsi maksimal 100 karakter',
      'any.required': 'Provinsi wajib diisi',
    }),
    kota: Joi.string().max(100).optional(),
    belt: Joi.string().max(50).required().messages({
      'string.empty': 'Sabuk (belt) wajib diisi',
      'any.required': 'Sabuk (belt) wajib diisi',
    }),
    alamat: Joi.string().max(255).optional(),
    no_telp: Joi.string().max(15).optional(),
    umur: Joi.number().integer().min(5).max(100).optional(),
    id_dojang: Joi.number().integer().positive().required().messages({
      'number.base': 'ID dojang harus berupa angka',
      'number.integer': 'ID dojang harus bilangan bulat',
      'number.positive': 'ID dojang harus positif',
      'any.required': 'ID dojang wajib diisi',
    }),
    id_pelatih_pembuat: Joi.number().integer().positive().required().messages({
      'number.base': 'ID pelatih harus berupa angka',
      'number.integer': 'ID pelatih harus bilangan bulat',
      'number.positive': 'ID pelatih harus positif',
      'any.required': 'ID pelatih wajib diisi',
    }),
    akte_kelahiran: Joi.string().required().messages({
      'string.empty': 'Akte kelahiran wajib diupload',
      'any.required': 'Akte kelahiran wajib diupload',
    }),
    pas_foto: Joi.string().required().messages({
      'string.empty': 'Pas foto wajib diupload',
      'any.required': 'Pas foto wajib diupload',
    }),
    sertifikat_belt: Joi.string().required().messages({
      'string.empty': 'Sertifikat sabuk wajib diupload',
      'any.required': 'Sertifikat sabuk wajib diupload',
    }),
    ktp: Joi.string().optional(),
  }),

  update: Joi.object({
    id_atlet: Joi.number().positive().max(200).optional(),
    nama_atlet: Joi.string().min(2).max(150).optional(),
    tanggal_lahir: Joi.date().max('now').optional(),
    nik: Joi.string().min(8).max(20).optional(),
    berat_badan: Joi.number().positive().max(200).optional(),
    tinggi_badan: Joi.number().positive().max(250).optional(),
    jenis_kelamin: Joi.string().valid('LAKI_LAKI', 'PEREMPUAN').optional(),
    provinsi: Joi.string().max(100).optional(),
    kota: Joi.string().max(100).optional(),
    belt: Joi.string().max(50).optional(),
    alamat: Joi.string().max(255).optional(),
    no_telp: Joi.string().max(15).optional(),
    umur: Joi.number().integer().min(5).max(100).optional(),
    id_dojang: Joi.number().integer().positive().optional(),
    id_pelatih_pembuat: Joi.number().integer().positive().optional(),
    akte_kelahiran: Joi.string().optional(),
    pas_foto: Joi.string().optional(),
    sertifikat_belt: Joi.string().optional(),
    ktp: Joi.string().optional(),
  }),

  query: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.base': 'Page harus berupa angka',
      'number.integer': 'Page harus berupa bilangan bulat',
      'number.min': 'Page minimal 1'
    }),
    limit: Joi.number().integer().min(1).max(100).default(10).messages({
      'number.base': 'Limit harus berupa angka',
      'number.integer': 'Limit harus berupa bilangan bulat',
      'number.min': 'Limit minimal 1',
      'number.max': 'Limit maksimal 100'
    }),
    search: Joi.string().max(255).optional().messages({
      'string.max': 'Search maksimal 255 karakter'
    }),
    id_dojang: Joi.number().integer().positive().optional().messages({
      'number.base': 'ID dojang harus berupa angka',
      'number.integer': 'ID dojang harus bilangan bulat',
      'number.positive': 'ID dojang harus positif'
    }),
    jenis_kelamin: Joi.string().valid('LAKI_LAKI', 'PEREMPUAN').optional().messages({
      'any.only': 'Jenis kelamin harus Laki-laki atau Perempuan'
    }),
    age_min: Joi.number().integer().min(1).max(100).optional().messages({
      'number.base': 'Umur minimal harus berupa angka',
      'number.integer': 'Umur minimal harus bilangan bulat',
      'number.min': 'Umur minimal 1 tahun',
      'number.max': 'Umur minimal maksimal 100 tahun'
    }),
    age_max: Joi.number().integer().min(1).max(100).optional().messages({
      'number.base': 'Umur maksimal harus berupa angka',
      'number.integer': 'Umur maksimal harus bilangan bulat',
      'number.min': 'Umur maksimal minimal 1 tahun',
      'number.max': 'Umur maksimal 100 tahun'
    })
  }),

  eligibility: Joi.object({
    id_kompetisi: Joi.number().integer().positive().required().messages({
      'number.base': 'ID kompetisi harus berupa angka',
      'number.integer': 'ID kompetisi harus bilangan bulat',
      'number.positive': 'ID kompetisi harus positif',
      'any.required': 'ID kompetisi wajib diisi'
    }),
    cabang: Joi.string().valid('POOMSAE', 'KYORUGI').required().messages({
      'any.only': 'Cabang harus POOMSAE atau KYORUGI',
      'any.required': 'Cabang wajib diisi'
    })
  }),

  bulkUpload: Joi.object({
    id_dojang: Joi.number().integer().positive().required().messages({
      'number.base': 'ID dojang harus berupa angka',
      'number.integer': 'ID dojang harus bilangan bulat',
      'number.positive': 'ID dojang harus positif',
      'any.required': 'ID dojang wajib diisi'
    }),
    athletes: Joi.array().items(
      Joi.object({
        nama_atlet: Joi.string().min(2).max(150).required(),
        tanggal_lahir: Joi.date().max('now').required(),
        berat_badan: Joi.number().positive().max(200).required(),
        tinggi_badan: Joi.number().positive().max(250).required(),
        jenis_kelamin: Joi.string().valid('L', 'P').required()
      })
    ).min(1).max(50).required().messages({
      'array.min': 'Minimal 1 atlet harus diisi',
      'array.max': 'Maksimal 50 atlet per upload',
      'any.required': 'Data atlet wajib diisi'
    })
  })
};