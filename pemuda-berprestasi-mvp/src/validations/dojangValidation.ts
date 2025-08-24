import Joi from 'joi';

export const dojangValidation = {
  create: Joi.object({
    nama_dojang: Joi.string()
      .trim()
      .min(3)
      .max(100)
      .required()
      .messages({
        'string.empty': 'Nama dojang tidak boleh kosong',
        'string.min': 'Nama dojang minimal 3 karakter',
        'string.max': 'Nama dojang maksimal 100 karakter',
        'any.required': 'Nama dojang wajib diisi'
      }),
    
    email: Joi.string()
      .email()
      .trim()
      .max(100)
      .optional()
      .allow('')
      .messages({
        'string.email': 'Format email tidak valid',
        'string.max': 'Email maksimal 100 karakter'
      }),
    
    no_telp: Joi.string()
      .trim()
      .pattern(/^[\d\-\+\(\)\s]{8,20}$/)
      .optional()
      .allow('')
      .messages({
        'string.pattern.base': 'Format nomor telepon tidak valid'
      }),
    
    founder: Joi.string()
      .trim()
      .max(100)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Nama founder maksimal 100 karakter'
      }),
    
    negara: Joi.string()
      .trim()
      .max(50)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Nama negara maksimal 50 karakter'
      }),
    
    provinsi: Joi.string()
      .trim()
      .max(50)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Nama provinsi maksimal 50 karakter'
      }),
    
    kota: Joi.string()
      .trim()
      .max(50)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Nama kota maksimal 50 karakter'
      }),
    
    id_pelatih_pendaftar: Joi.number()
      .integer()
      .positive()
      .optional()
      .allow(null)
      .messages({
        'number.base': 'ID Pelatih harus berupa angka',
        'number.integer': 'ID Pelatih harus berupa bilangan bulat',
        'number.positive': 'ID Pelatih harus berupa angka positif'
      })
  }),

  update: Joi.object({
    nama_dojang: Joi.string()
      .trim()
      .min(3)
      .max(100)
      .optional()
      .messages({
        'string.empty': 'Nama dojang tidak boleh kosong',
        'string.min': 'Nama dojang minimal 3 karakter',
        'string.max': 'Nama dojang maksimal 100 karakter'
      }),
    
    email: Joi.string()
      .email()
      .trim()
      .max(100)
      .optional()
      .allow('')
      .messages({
        'string.email': 'Format email tidak valid',
        'string.max': 'Email maksimal 100 karakter'
      }),
    
    no_telp: Joi.string()
      .trim()
      .pattern(/^[\d\-\+\(\)\s]{8,20}$/)
      .optional()
      .allow('')
      .messages({
        'string.pattern.base': 'Format nomor telepon tidak valid'
      }),
    
    founder: Joi.string()
      .trim()
      .max(100)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Nama founder maksimal 100 karakter'
      }),
    
    negara: Joi.string()
      .trim()
      .max(50)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Nama negara maksimal 50 karakter'
      }),
    
    provinsi: Joi.string()
      .trim()
      .max(50)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Nama provinsi maksimal 50 karakter'
      }),
    
    kota: Joi.string()
      .trim()
      .max(50)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Nama kota maksimal 50 karakter'
      }),
    
    id_pelatih_pendaftar: Joi.number()
      .integer()
      .positive()
      .optional()
      .allow(null)
      .messages({
        'number.base': 'ID Pelatih harus berupa angka',
        'number.integer': 'ID Pelatih harus berupa bilangan bulat',
        'number.positive': 'ID Pelatih harus berupa angka positif'
      })
  }),

  checkName: Joi.object({
    nama_dojang: Joi.string()
      .trim()
      .min(3)
      .max(100)
      .required()
      .messages({
        'string.empty': 'Nama dojang tidak boleh kosong',
        'string.min': 'Nama dojang minimal 3 karakter',
        'string.max': 'Nama dojang maksimal 100 karakter',
        'any.required': 'Nama dojang wajib diisi'
      })
  }),

  query: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .optional()
      .messages({
        'number.base': 'Page harus berupa angka',
        'number.integer': 'Page harus berupa bilangan bulat',
        'number.min': 'Page minimal 1'
      }),
    
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .optional()
      .messages({
        'number.base': 'Limit harus berupa angka',
        'number.integer': 'Limit harus berupa bilangan bulat',
        'number.min': 'Limit minimal 1',
        'number.max': 'Limit maksimal 100'
      }),
    
    search: Joi.string()
      .trim()
      .max(100)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Search maksimal 100 karakter'
      })
  }),

  approve: Joi.object({
    id_pelatih_pendaftar: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'ID Pelatih harus berupa angka',
        'number.integer': 'ID Pelatih harus berupa bilangan bulat',
        'number.positive': 'ID Pelatih harus berupa angka positif',
        'any.required': 'ID Pelatih wajib diisi'
      })
  }),

  reject: Joi.object({
    reason: Joi.string()
      .trim()
      .max(255)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Alasan maksimal 255 karakter'
      })
  })
};