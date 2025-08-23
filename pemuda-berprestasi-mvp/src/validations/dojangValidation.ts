import Joi from 'joi';

export const dojangValidation = {
  create: Joi.object({
    nama_dojang: Joi.string().min(3).max(150).required().messages({
      'string.empty': 'Nama dojang wajib diisi',
      'string.min': 'Nama dojang minimal 3 karakter',
      'string.max': 'Nama dojang maksimal 150 karakter'
    }),
    email: Joi.string().email().optional().messages({
      'string.email': 'Format email tidak valid'
    }),
    no_telp: Joi.string().pattern(/^[0-9+\-\s()]+$/).min(10).max(15).optional().messages({
      'string.pattern.base': 'Format nomor telepon tidak valid',
      'string.min': 'Nomor telepon minimal 10 digit',
      'string.max': 'Nomor telepon maksimal 15 digit'
    }),
    founder: Joi.string().max(150).optional().messages({
      'string.max': 'Nama founder maksimal 150 karakter'
    }),
    negara: Joi.string().max(100).optional().messages({
      'string.max': 'Nama negara maksimal 100 karakter'
    }),
    provinsi: Joi.string().max(100).optional().messages({
      'string.max': 'Nama provinsi maksimal 100 karakter'
    }),
    kota: Joi.string().max(100).optional().messages({
      'string.max': 'Nama kota maksimal 100 karakter'
    })
  }),

  update: Joi.object({
    nama_dojang: Joi.string().min(3).max(150).optional().messages({
      'string.min': 'Nama dojang minimal 3 karakter',
      'string.max': 'Nama dojang maksimal 150 karakter'
    }),
    email: Joi.string().email().optional().messages({
      'string.email': 'Format email tidak valid'
    }),
    no_telp: Joi.string().pattern(/^[0-9+\-\s()]+$/).min(10).max(15).optional().messages({
      'string.pattern.base': 'Format nomor telepon tidak valid',
      'string.min': 'Nomor telepon minimal 10 digit',
      'string.max': 'Nomor telepon maksimal 15 digit'
    }),
    founder: Joi.string().max(150).optional().messages({
      'string.max': 'Nama founder maksimal 150 karakter'
    }),
    negara: Joi.string().max(100).optional().messages({
      'string.max': 'Nama negara maksimal 100 karakter'
    }),
    provinsi: Joi.string().max(100).optional().messages({
      'string.max': 'Nama provinsi maksimal 100 karakter'
    }),
    kota: Joi.string().max(100).optional().messages({
      'string.max': 'Nama kota maksimal 100 karakter'
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
    provinsi: Joi.string().max(100).optional().messages({
      'string.max': 'Provinsi maksimal 100 karakter'
    }),
    kota: Joi.string().max(100).optional().messages({
      'string.max': 'Kota maksimal 100 karakter'
    })
  })
};