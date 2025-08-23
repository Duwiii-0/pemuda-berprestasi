import Joi from 'joi';

export const atletValidation = {
  create: Joi.object({
    nama_atlet: Joi.string().min(2).max(150).required().messages({
      'string.empty': 'Nama atlet wajib diisi',
      'string.min': 'Nama atlet minimal 2 karakter',
      'string.max': 'Nama atlet maksimal 150 karakter'
    }),
    tanggal_lahir: Joi.date().max('now').required().messages({
      'date.base': 'Format tanggal lahir tidak valid',
      'date.max': 'Tanggal lahir tidak boleh di masa depan',
      'any.required': 'Tanggal lahir wajib diisi'
    }),
    berat_badan: Joi.number().positive().max(200).required().messages({
      'number.base': 'Berat badan harus berupa angka',
      'number.positive': 'Berat badan harus positif',
      'number.max': 'Berat badan maksimal 200 kg',
      'any.required': 'Berat badan wajib diisi'
    }),
    tinggi_badan: Joi.number().positive().max(250).required().messages({
      'number.base': 'Tinggi badan harus berupa angka',
      'number.positive': 'Tinggi badan harus positif',
      'number.max': 'Tinggi badan maksimal 250 cm',
      'any.required': 'Tinggi badan wajib diisi'
    }),
    jenis_kelamin: Joi.string().valid('L', 'P').required().messages({
      'any.only': 'Jenis kelamin harus L (Laki-laki) atau P (Perempuan)',
      'any.required': 'Jenis kelamin wajib diisi'
    }),
    id_dojang: Joi.number().integer().positive().required().messages({
      'number.base': 'ID dojang harus berupa angka',
      'number.integer': 'ID dojang harus bilangan bulat',
      'number.positive': 'ID dojang harus positif',
      'any.required': 'ID dojang wajib diisi'
    })
  }),

  update: Joi.object({
    nama_atlet: Joi.string().min(2).max(150).optional().messages({
      'string.min': 'Nama atlet minimal 2 karakter',
      'string.max': 'Nama atlet maksimal 150 karakter'
    }),
    tanggal_lahir: Joi.date().max('now').optional().messages({
      'date.base': 'Format tanggal lahir tidak valid',
      'date.max': 'Tanggal lahir tidak boleh di masa depan'
    }),
    berat_badan: Joi.number().positive().max(200).optional().messages({
      'number.base': 'Berat badan harus berupa angka',
      'number.positive': 'Berat badan harus positif',
      'number.max': 'Berat badan maksimal 200 kg'
    }),
    tinggi_badan: Joi.number().positive().max(250).optional().messages({
      'number.base': 'Tinggi badan harus berupa angka',
      'number.positive': 'Tinggi badan harus positif',
      'number.max': 'Tinggi badan maksimal 250 cm'
    }),
    jenis_kelamin: Joi.string().valid('L', 'P').optional().messages({
      'any.only': 'Jenis kelamin harus L (Laki-laki) atau P (Perempuan)'
    }),
    id_dojang: Joi.number().integer().positive().optional().messages({
      'number.base': 'ID dojang harus berupa angka',
      'number.integer': 'ID dojang harus bilangan bulat',
      'number.positive': 'ID dojang harus positif'
    })
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
    jenis_kelamin: Joi.string().valid('L', 'P').optional().messages({
      'any.only': 'Jenis kelamin harus L (Laki-laki) atau P (Perempuan)'
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