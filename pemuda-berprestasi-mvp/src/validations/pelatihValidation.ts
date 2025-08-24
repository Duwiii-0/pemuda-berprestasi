// src/validations/pelatihValidation.ts
import Joi from 'joi'
import { body } from 'express-validator'


// Update pelatih profile validation
export const updatePelatihSchema = Joi.object({
  nama_pelatih: Joi.string()
    .min(2)
    .max(150)
    .optional()
    .messages({
      'string.min': 'Nama pelatih must be at least 2 characters',
      'string.max': 'Nama pelatih cannot exceed 150 characters'
    }),
    
  no_telp: Joi.string()
    .pattern(/^(\+62|62|0)[0-9]{8,13}$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'No telepon must be a valid Indonesian phone number'
    })
})

// ID parameter validation
export const pelatihIdSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID must be a number',
      'number.integer': 'ID must be an integer',
      'number.positive': 'ID must be positive',
      'any.required': 'ID is required'
    })
})

// Query parameters for listing pelatih
export const listPelatihSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional(),
    
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .optional(),
    
  search: Joi.string()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Search query cannot exceed 100 characters'
    }),
    
  sort: Joi.string()
    .valid('nama_pelatih', 'created_at', 'id_pelatih')
    .default('nama_pelatih')
    .optional(),
    
  order: Joi.string()
    .valid('asc', 'desc')
    .default('asc')
    .optional()
})

export const validateUpdatePelatih = [
  body('nama_pelatih')
    .notEmpty()
    .withMessage('Nama pelatih harus diisi')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama pelatih harus antara 2-100 karakter')
    .matches(/^[a-zA-Z\s\.]+$/)
    .withMessage('Nama pelatih hanya boleh mengandung huruf, spasi, dan titik')
    .custom((value) => {
      // Check for excessive spaces or special characters
      if (value.includes('  ') || value.trim() !== value) {
        throw new Error('Nama pelatih tidak boleh mengandung spasi berlebihan')
      }
      return true
    }),

  body('no_telp')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === '' || value === undefined) {
        return true // Optional field
      }
      
      // Remove spaces and validate Indonesian phone number
      const cleanPhone = value.replace(/\s/g, '')
      const phoneRegex = /^(\+62|62|0)[0-9]{8,13}$/
      
      if (!phoneRegex.test(cleanPhone)) {
        throw new Error('Format nomor telepon tidak valid (contoh: 08123456789 atau +628123456789)')
      }
      
      return true
    })
    .isLength({ max: 20 })
    .withMessage('Nomor telepon maksimal 20 karakter')
]