// pemuda-berprestasi-mvp/src/validations/authValidation.ts
import Joi from 'joi'

// Register validation for pelatih
export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/) 
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one letter and one number',
      'any.required': 'Password is required'
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Password confirmation does not match',
      'any.required': 'Password confirmation is required'
    }),
    
  nama_pelatih: Joi.string()
    .min(2)
    .max(150)
    .required()
    .messages({
      'string.min': 'Nama pelatih must be at least 2 characters',
      'string.max': 'Nama pelatih cannot exceed 150 characters',
      'any.required': 'Nama pelatih is required'
    }),
    
  nik: Joi.string()
    .length(16)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.length': 'NIK must be exactly 16 digits',
      'string.pattern.base': 'NIK must contain only numbers',
      'any.required': 'NIK is required'
    }),
    
  no_telp: Joi.string()
    .pattern(/^(\+62|62|0)[0-9]{8,13}$/)
    .optional()
    .messages({
      'string.pattern.base': 'No telepon must be a valid Indonesian phone number'
    }),
    
  id_dojang: Joi.number()
    .required()
    .messages({
      'any.required': 'Dojang is required'
    })
})

// Login validation
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required'
    }),
    
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
})

// Change password validation
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
    
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base': 'New password must contain at least one letter and one number',
      'any.required': 'New password is required'
    }),
    
  confirmNewPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'New password confirmation does not match',
      'any.required': 'New password confirmation is required'
    })
})

// NEW: Reset password validation
export const resetPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required'
    }),
    
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base': 'New password must contain at least one letter and one number',
      'any.required': 'New password is required'
    }),
    
  confirmNewPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Password confirmation does not match',
      'any.required': 'Password confirmation is required'
    })
})