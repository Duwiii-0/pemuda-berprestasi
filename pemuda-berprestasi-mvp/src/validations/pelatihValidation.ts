// src/validations/pelatihValidation.ts
import Joi from 'joi'

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